import "./maki/parser.js";
import {parse as parseMaki} from "./maki/parser.js";
import {getMethod, getClass} from "./maki/objects.js";
import JSZip from "./_snowpack/pkg/jszip.js";
import {classResolver} from "./skin/resolver.js";
import {getCaseInsensitiveFile} from "./utils.js";
function hack() {
  classResolver("A funny joke about why this is needed.");
}
function whiteSpace(indent) {
  let white = "";
  for (let i = 0; i < indent; i++) {
    white += "  ";
  }
  return white;
}
function indented(code, depth) {
  return code.split("\n").map((str) => whiteSpace(depth) + str).join("\n");
}
function prettyPrint(ast, indent = 0) {
  switch (ast.kind) {
    case "VARIABLE_DEFINITION":
      return `Global ${ast.typeName} ${ast.name}`;
    case "HOOK":
      const body = ast.body.map((statement) => {
        return indented(prettyPrint(statement, indent + 1), indent + 1);
      });
      const name = `${ast.variableName}.${ast.hookName}`;
      return `${name}(${ast.args}){//${JSON.stringify(ast.binding)}
${body.join("\n")}
}`;
    case "CALL":
      return `${ast.objectName}.${ast.methodName}(${ast.args.map(prettyPrint)}) /*${ast.comment}*/ `;
    case "ASSIGNMENT":
      return `${ast.variableName} = ${prettyPrint(ast.expression)};`;
    case "IDENTIFIER":
      return `${ast.value}`;
    case "BINARY_EXPRESSION":
      return `(${prettyPrint(ast.left)} ${ast.operator} ${prettyPrint(ast.right)})`;
    case "CONDITIONAL":
      return `if(${prettyPrint(ast.test)}) {
  // SOME BODY
}
`;
    default:
      throw new Error(`Unhandled ast kind "${ast.kind}"`);
  }
}
class Decompiler {
  constructor(program) {
    this._program = program;
  }
  decompile() {
    const sections = [...this.variables(), ...this.bindings()];
    return sections.map((node) => prettyPrint(node)).join("\n");
  }
  variableTypeName(offset) {
    const variable = this._program.variables[offset];
    let type = variable.type;
    switch (variable.type) {
      case "OBJECT": {
        const guid = variable.guid;
        const klass = getClass(guid);
        return klass.name;
      }
      case "INT":
        return "int";
      case "DOUBLE":
      case "FLOAT":
        return "double";
      case "STRING":
        return "string";
      case "BOOLEAN":
        return "boolean";
      default:
        throw new Error(`Unexpected type: ${type}`);
    }
  }
  variables() {
    const output = [];
    for (const [i, variable] of this._program.variables.entries()) {
      if (i == 0 || i == 1) {
        continue;
      }
      if (variable.global) {
        output.push({
          kind: "VARIABLE_DEFINITION",
          typeName: this.variableTypeName(i),
          name: this.variableName(i)
        });
      }
    }
    return output;
  }
  variableName(offset) {
    switch (offset) {
      case 0:
        return "System";
      default:
        return `${this.variableTypeName(offset).toLowerCase()}${offset}`;
    }
  }
  bindings() {
    const output = [];
    for (const binding of this._program.bindings) {
      const method = this._program.methods[binding.methodOffset];
      const guid = this._program.classes[method.typeOffset];
      const methodDefinition = getMethod(guid, method.name);
      output.push({
        kind: "HOOK",
        binding,
        variableName: this.variableName(binding.variableOffset),
        hookName: method.name,
        args: methodDefinition.parameters.map(([type, name]) => `${type} ${name}`).join(", "),
        body: this.code(binding.commandOffset, methodDefinition.parameters.map(([type, name]) => ({
          kind: "IDENTIFIER",
          value: name
        })))
      });
    }
    return output;
  }
  code(commandOffset, args) {
    const nodes = [];
    let ip = commandOffset;
    const callStack = [];
    const stack = args;
    outer:
      while (ip < this._program.commands.length) {
        const command = this._program.commands[ip];
        switch (command.opcode) {
          case 1: {
            stack.push({
              kind: "IDENTIFIER",
              value: this.variableName(command.arg),
              variable: this._program.variables[command.arg]
            });
            break;
          }
          case 2: {
            stack.pop();
            break;
          }
          case 3: {
            const value = stack.pop();
            if (value == null) {
              throw new Error("Unexpected empty stack");
            }
            nodes.push({
              kind: "ASSIGNMENT",
              variableName: this.variableName(command.arg),
              expression: value
            });
            break;
          }
          case 8:
          case 9:
          case 10:
          case 12:
          case 64:
          case 66:
          case 67:
          case 81: {
            const operatorMap = {
              8: "==",
              9: "!=",
              10: ">",
              12: "<",
              64: "+",
              65: "-",
              66: "*",
              67: "/",
              81: "||"
            };
            const a2 = stack.pop();
            const b2 = stack.pop();
            stack.push({
              kind: "BINARY_EXPRESSION",
              left: b2,
              right: a2,
              operator: operatorMap[command.opcode]
            });
            break;
          }
          case 16: {
            const test = stack.pop();
            nodes.push({kind: "CONDITIONAL", test});
            ip = command.arg - 1;
            break;
          }
          case 17: {
            const test = stack.pop();
            nodes.push({kind: "CONDITIONAL", test});
            ip = command.arg - 1;
            break;
          }
          case 24:
            const methodOffset24 = command.arg;
            const method24 = this._program.methods[methodOffset24];
            let methodName24 = method24.name;
            const guid24 = this._program.classes[method24.typeOffset];
            const methodDefinition24 = getMethod(guid24, method24.name);
            const obj24 = stack.pop();
            if (obj24.kind !== "IDENTIFIER") {
              throw new Error("Expectd ident");
            }
            const args24 = methodDefinition24.parameters.map((param) => {
              return stack.pop();
            });
            nodes.push({
              kind: "CALL",
              objectName: obj24.value,
              methodName: methodName24,
              args: args24,
              body: [],
              comment: "call"
            });
            stack.push({
              kind: "CALL",
              objectName: obj24.value,
              methodName: methodName24,
              args: args24,
              body: [],
              comment: "call"
            });
            break;
          case 112:
            const methodOffset = command.arg;
            const method = this._program.methods[methodOffset];
            let methodName = method.name;
            const guid = this._program.classes[method.typeOffset];
            const methodDefinition = getMethod(guid, method.name);
            const obj = stack.pop();
            if (obj.kind !== "IDENTIFIER") {
              throw new Error("Expectd ident");
            }
            const args2 = methodDefinition.parameters.map((param) => {
              return stack.pop();
            });
            nodes.push({
              kind: "CALL",
              objectName: obj.value,
              methodName,
              args: args2,
              body: [],
              comment: "STRANGECALL:" + JSON.stringify({methodOffset, method, obj})
            });
            stack.push({
              kind: "CALL",
              objectName: obj.value,
              methodName,
              args: args2,
              body: [],
              comment: "stack-call"
            });
            break;
          case 33: {
            ip = callStack.pop();
            break;
          }
          case 40:
            return nodes;
            break;
          case 48:
            const a = stack.pop();
            const b = stack.pop();
            stack.push({
              kind: "ASSIGNMENT",
              variableName: a.name,
              expression: b
            });
            nodes.push({
              kind: "ASSIGNMENT",
              variableName: JSON.stringify(a),
              expression: b,
              a,
              b
            });
            break;
          case 25:
            callStack.push(ip);
            ip = command.arg - 1;
            break;
          default:
            console.log(`Missing support for opcode ${command.opcode}`);
            break outer;
        }
        ip++;
      }
    return nodes;
  }
}
async function main() {
  const skin = "assets/WinampModern566.wal";
  const script = "scripts/eq.maki";
  const response = await fetch(skin);
  const data = await response.blob();
  const zip = await JSZip.loadAsync(data);
  const makiFile = getCaseInsensitiveFile(zip, script);
  const scriptContents = await makiFile.async("arraybuffer");
  const parsedScript = parseMaki(scriptContents);
  const decompiler = new Decompiler(parsedScript);
  const decompiled = decompiler.decompile();
  document.getElementById("editor").innerHTML = decompiled;
  window.loaded();
}
main();
const btn1 = document.getElementById("btn1");
const btn2 = document.getElementById("btn2");
const btn3 = document.getElementById("btn3");
let successCallback;
async function getNumber() {
  return new Promise((resolve) => successCallback = resolve);
}
function btn1Click() {
  if (successCallback)
    successCallback(1);
}
function btn2Click() {
  if (successCallback)
    successCallback(2);
}
function btn3Click() {
  if (successCallback)
    successCallback(-1);
}
async function doIt() {
  console.log("wait for clic....");
  btn1.addEventListener("click", btn1Click);
  btn2.addEventListener("click", btn2Click);
  btn3.addEventListener("click", btn3Click);
  for (let c = 1; c < 10; c += 1) {
    const ret = await getNumber();
    console.log(c, "result=", ret);
    if (ret < 0)
      break;
  }
  btn1.removeEventListener("click", btn1Click);
  btn2.removeEventListener("click", btn2Click);
  btn3.removeEventListener("click", btn3Click);
  console.log("Finished");
}
doIt();
