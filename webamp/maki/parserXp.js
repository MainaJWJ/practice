import {COMMANDS} from "./constants.js";
import MakiFile from "./MakiFile.js";
import {getReturnType} from "./objects.js";
import {assert} from "../utils.js";
import {classResolver} from "../skin/resolver.js";
const MAGIC = "FG";
const PRIMITIVE_TYPES = {
  5: "BOOLEAN",
  2: "INT",
  3: "FLOAT",
  4: "DOUBLE",
  6: "STRING"
};
const knownContainerGuids = {
  "{0000000a-000c-0010-ff7b-01014263450c}": "[VIS]",
  "{45f3f7c1-a6f3-4ee6-a15e-125e92fc3f8d}": "[PL]",
  "{6b0edf80-c9a5-11d3-9f26-00c04f39ffc6}": "[ML]",
  "{7383a6fb-1d01-413b-a99a-7e6f655f4591}": "[CON]",
  "{7a8b2d76-9531-43b9-91a1-ac455a7c8242}": "[LIR]",
  "{a3ef47bd-39eb-435a-9fb3-a5d87f6f17a5}": "[DL]",
  "{f0816d7b-fffc-4343-80f2-e8199aa15cc3}": "[VIDEO]"
};
function getClassId(guid) {
  const known = knownContainerGuids[guid];
  if (known) {
    return known;
  }
  try {
    const cls = classResolver(guid);
    return cls.prototype.constructor.name;
  } catch (e) {
    return "--unknown--";
  }
}
let methods = [];
let variables = [];
let constants = [];
let classes = [];
let bindings = [];
let classAliases = {};
export function parse(data) {
  const makiFile = new MakiFile(data);
  const magic = readMagic(makiFile);
  const version = readVersion(makiFile);
  const extraVersion = makiFile.readUInt32LE();
  classes = readClasses(makiFile);
  methods = readMethods(makiFile, classes);
  variables = readVariables({makiFile, classes});
  readConstants({makiFile, variables});
  bindings = readBindings(makiFile);
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
  for (const ivar of variables) {
    if (ivar.isClass == true) {
      for (const ivarOffset of ivar.members) {
        const variable = variables[ivarOffset];
        for (const methodOffset of ivar.events) {
          const binding = resolvedBindings[methodOffset];
          const method = methods[binding.methodOffset];
          const methodName = `${variable.className}.${method.name}`;
          resolvedBindings.push({
            ...binding,
            methodName,
            variableOffset: ivarOffset,
            bindingOnClass: true
          });
        }
      }
    }
  }
  return {
    version,
    extraVersion,
    classes,
    classAliases,
    variables,
    methods,
    bindings: resolvedBindings,
    commands: resolvedCommands
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
  const classes2 = [];
  const classesAlias = {};
  while (count--) {
    let identifier = "";
    let chunks = 4;
    while (chunks--) {
      identifier += makiFile.readUInt32LE().toString(16).padStart(8, "0");
    }
    classes2.push(identifier);
    classesAlias[identifier] = getClassId(identifier);
  }
  classAliases = classesAlias;
  return classes2;
}
function readMethods(makiFile, guids) {
  let count = makiFile.readUInt32LE();
  const methods2 = [];
  while (count--) {
    const classCode = makiFile.readUInt16LE();
    const typeOffset = classCode & 255;
    const unknown1 = makiFile.readUInt16LE();
    const name = makiFile.readString();
    const classGuid = guids[typeOffset];
    const className = getClassId(classGuid);
    const returnType = getReturnType(classGuid, name.toLowerCase());
    methods2.push({
      name,
      typeOffset,
      returnType,
      className,
      unknown1,
      classCode
    });
  }
  return methods2;
}
function readVariables({makiFile, classes: classes2}) {
  let count = makiFile.readUInt32LE();
  const variables2 = [];
  let newClass = 0;
  while (count--) {
    const typeOffset = makiFile.readUInt8();
    const object = makiFile.readUInt8();
    const subClass = makiFile.readUInt16LE();
    const uinit1 = makiFile.readUInt16LE();
    const uinit2 = makiFile.readUInt16LE();
    const uinit3 = makiFile.readUInt16LE();
    const uinit4 = makiFile.readUInt16LE();
    const global = makiFile.readUInt8();
    const isSystem = makiFile.readUInt8();
    if (subClass) {
      const variable = variables2[typeOffset];
      if (variable == null) {
        throw new Error("Invalid type");
      } else {
        if (!variable.members) {
          variables2[typeOffset].isClass = true;
          variable.isClass = true;
          variable.newClassName = `NEW_CLASS_NAME-${++newClass}`;
          variable.type = "CLASS";
          variable.members = [];
          variable.events = [];
        }
      }
      variables2.push({
        type: "OBJECT",
        value: null,
        global,
        guid: variable.guid,
        isSubClass: true,
        inheritFrom: variable.newClassName || variable.className,
        isObject: object,
        className: getClassId(variable.guid) || "^UNKNOWN^"
      });
      const index = variables2.length - 1;
      if (!variable.members.includes(index)) {
        variable.members.push(index);
      }
    } else if (object) {
      const klass = classes2[typeOffset];
      if (klass == null) {
        throw new Error("Invalid type");
      }
      variables2.push({
        type: "OBJECT",
        value: null,
        global,
        guid: klass,
        className: getClassId(klass),
        isObject: object
      });
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
        value,
        isObject: object
      };
      variables2.push(variable);
    }
    if (isSystem) {
      variables2[variables2.length - 1].isSystem = true;
    }
    variables2[variables2.length - 1]._index_ = variables2.length - 1;
  }
  return variables2;
}
function readConstants({makiFile, variables: variables2}) {
  let count = makiFile.readUInt32LE();
  while (count--) {
    const i = makiFile.readUInt32LE();
    const variable = variables2[i];
    const value = makiFile.readString();
    variable.value = value;
    variable.constantData = value;
  }
}
function clone1level(o) {
  const ret = [];
  for (const [key, value] of Object.entries(o)) {
    if (!(typeof value === "object" && !Array.isArray(value) && value !== null)) {
      ret[key] = value;
    }
  }
  return ret;
}
function readBindings(makiFile) {
  let count = makiFile.readUInt32LE();
  const bindings2 = [];
  while (count--) {
    const variableOffset = makiFile.readUInt32LE();
    const methodOffset = makiFile.readUInt32LE();
    const binaryOffset = makiFile.readUInt32LE();
    const method = methods[methodOffset];
    const methodName = `${method.className}.${method.name}`;
    bindings2.push({
      methodName,
      variableOffset,
      binaryOffset,
      methodOffset,
      variable: clone1level(variables[variableOffset])
    });
    const aclass = variables[variableOffset];
    if (!aclass.events) {
      aclass.events = [];
    }
    aclass.events.push(bindings2.length - 1);
  }
  return bindings2;
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
  const Command = COMMANDS[opcode] || {name: "UNKNOWN", short: "-???-"};
  const description = `${Command.short || Command.name} (${Command.name})`;
  const command = {
    description,
    opcode,
    offset: pos,
    start,
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
    const strangeFlag = makiFile.readUInt8();
    command.strangeFlag = strangeFlag;
  }
  return command;
}
