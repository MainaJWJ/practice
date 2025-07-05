import {COMMANDS} from "./constants.js";
import MakiFile from "./MakiFile.js";
import {getReturnType} from "./objects.js";
import {assert} from "../utils.js";
const MAGIC = "FG";
const PRIMITIVE_TYPES = {
  5: "BOOLEAN",
  2: "INT",
  3: "FLOAT",
  4: "DOUBLE",
  6: "STRING"
};
export function parse(data, maki_id) {
  const makiFile = new MakiFile(data);
  const magic = readMagic(makiFile);
  const version = readVersion(makiFile);
  const extraVersion = makiFile.readUInt32LE();
  const classes = readClasses(makiFile);
  const methods = readMethods(makiFile, classes);
  const variables = readVariables({makiFile, classes});
  readConstants({makiFile, variables});
  const bindings = readBindings(makiFile, variables);
  const commands = decodeCode({makiFile});
  if (!makiFile.isEof()) {
    console.warn("EOF not reached!");
  }
  const offsetToCommand = {};
  commands.forEach((command, i) => {
    if (command.offset != null) {
      offsetToCommand[command.offset] = i;
    }
  });
  const resolvedBindings = bindings.map((binding) => {
    return Object.assign({}, binding, {
      commandOffset: offsetToCommand[binding.binaryOffset]
    });
  });
  const resolvedCommands = commands.map((command) => {
    if (command.argType === "COMMAND_OFFSET") {
      return Object.assign({}, command, {
        arg: offsetToCommand[command.arg]
      });
    }
    return command;
  });
  return {
    classes,
    methods,
    variables,
    bindings: resolvedBindings,
    commands: resolvedCommands,
    version,
    maki_id
  };
}
function opcodeToArgType(opcode) {
  const command = COMMANDS[opcode];
  if (command == null) {
    throw new Error(`Unknown opcode ${opcode}`);
  }
  switch (command.arg) {
    case "func":
    case "line":
      return "COMMAND_OFFSET";
    case "var":
    case "objFunc":
    case "obj":
      return "VARIABLE_OFFSET";
    default:
      return "NONE";
  }
}
function readMagic(makiFile) {
  const magic = makiFile.readStringOfLength(MAGIC.length);
  if (magic !== MAGIC) {
    throw new Error(`Magic "${magic}" does not mach "${MAGIC}". Is this a maki file?`);
  }
  return magic;
}
function readVersion(makiFile) {
  return makiFile.readUInt16LE();
}
function readClasses(makiFile) {
  let count = makiFile.readUInt32LE();
  const classes = [];
  while (count--) {
    let identifier = "";
    let chunks = 4;
    while (chunks--) {
      identifier += makiFile.readUInt32LE().toString(16).padStart(8, "0");
    }
    classes.push(identifier);
  }
  return classes;
}
function readMethods(makiFile, classes) {
  let count = makiFile.readUInt32LE();
  const methods = [];
  while (count--) {
    const classCode = makiFile.readUInt16LE();
    const typeOffset = classCode & 255;
    makiFile.readUInt16LE();
    const name = makiFile.readString().toLowerCase();
    const className = classes[typeOffset];
    const returnType = getReturnType(className, name);
    methods.push({name, typeOffset, returnType});
  }
  return methods;
}
function readVariables({makiFile, classes}) {
  let count = makiFile.readUInt32LE();
  const variables = [];
  while (count--) {
    const typeOffset = makiFile.readUInt8();
    const object = makiFile.readUInt8();
    const subClass = makiFile.readUInt16LE();
    const uinit1 = makiFile.readUInt16LE();
    const uinit2 = makiFile.readUInt16LE();
    makiFile.readUInt16LE();
    makiFile.readUInt16LE();
    const global = makiFile.readUInt8();
    makiFile.readUInt8();
    if (subClass) {
      const variable = variables[typeOffset];
      if (variable == null) {
        throw new Error("Invalid type");
      } else {
        if (!variable.members) {
          variable.isClass = true;
          variable.members = [];
          variable.events = [];
        }
      }
      variables.push({
        type: "OBJECT",
        value: null,
        global,
        guid: variable.guid
      });
      const index = variables.length - 1;
      if (!variable.members.includes(index)) {
        variable.members.push(index);
      }
    } else if (object) {
      const klass = classes[typeOffset];
      if (klass == null) {
        throw new Error("Invalid type");
      }
      variables.push({type: "OBJECT", value: null, global, guid: klass});
    } else {
      const typeName = PRIMITIVE_TYPES[typeOffset];
      if (typeName == null) {
        throw new Error("Invalid type");
      }
      let value = null;
      switch (typeName) {
        case PRIMITIVE_TYPES[5]:
          value = uinit1;
          assert(value === 1 || value === 0, "Expected boolean value to be initialized as zero or one");
          break;
        case PRIMITIVE_TYPES[2]:
          value = uinit1;
          break;
        case PRIMITIVE_TYPES[3]:
        case PRIMITIVE_TYPES[4]:
          const exponent = (uinit2 & 65408) >> 7;
          const mantisse = (128 | uinit2 & 127) << 16 | uinit1;
          value = mantisse * 2 ** (exponent - 150);
          break;
        case PRIMITIVE_TYPES[6]:
          break;
        default:
          throw new Error("Invalid primitive type");
      }
      const variable = {
        global,
        type: typeName,
        value
      };
      variables.push(variable);
    }
  }
  return variables;
}
function readConstants({makiFile, variables}) {
  let count = makiFile.readUInt32LE();
  while (count--) {
    const i = makiFile.readUInt32LE();
    const variable = variables[i];
    const value = makiFile.readString();
    variable.value = value;
  }
}
function readBindings(makiFile, variables) {
  let count = makiFile.readUInt32LE();
  const bindings = [];
  while (count--) {
    const variableOffset = makiFile.readUInt32LE();
    const methodOffset = makiFile.readUInt32LE();
    const binaryOffset = makiFile.readUInt32LE();
    bindings.push({variableOffset, binaryOffset, methodOffset});
    const aclass = variables[variableOffset];
    if (!aclass.events) {
      aclass.events = [];
    }
    aclass.events.push(bindings.length - 1);
  }
  return bindings;
}
function decodeCode({makiFile}) {
  const length = makiFile.readUInt32LE();
  const start = makiFile.getPosition();
  const commands = [];
  while (makiFile.getPosition() < start + length) {
    commands.push(parseComand({start, makiFile, length}));
  }
  return commands;
}
function parseComand({start, makiFile, length}) {
  const pos = makiFile.getPosition() - start;
  const opcode = makiFile.readUInt8();
  const command = {
    offset: pos,
    start,
    opcode,
    arg: null,
    argType: opcodeToArgType(opcode)
  };
  if (command.argType === "NONE") {
    return command;
  }
  let arg = null;
  switch (command.argType) {
    case "COMMAND_OFFSET":
      arg = makiFile.readInt32LE() + 5 + pos;
      break;
    case "VARIABLE_OFFSET":
      arg = makiFile.readUInt32LE();
      break;
    default:
      throw new Error("Invalid argType");
  }
  command.arg = arg;
  if (length > pos + 5 + 4 && makiFile.peekUInt32LE() >= 4294901760 && makiFile.peekUInt32LE() <= 4294901775) {
    makiFile.readUInt32LE();
  }
  if (opcode === 112) {
    makiFile.readUInt8();
  }
  return command;
}
