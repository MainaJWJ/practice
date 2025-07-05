import {V} from "./v.js";
import {assert, assume} from "../utils.js";
import {getMethod} from "./objects.js";
import BaseObject from "../skin/makiClasses/BaseObject.js";
function validateMaki(program) {
  return;
}
export async function interpret(start, program, stack, classResolver, eventName, uiRoot) {
  validateMaki(program);
  const interpreter = new Interpreter(program, classResolver, eventName, uiRoot);
  interpreter.stack = stack;
  try {
    return await interpreter.interpret(start);
  } catch (error) {
    console.warn(`Stopped executing ${program.maki_id}.
`, error);
  }
}
function validateVariable(v) {
  if (v.type === "OBJECT" && typeof v.value !== "object" && v.value !== 0) {
    debugger;
  }
}
class Interpreter {
  constructor(program, classResolver, eventName, uiRoot) {
    this.debug = false;
    const {commands, methods, variables, classes, maki_id} = program;
    this.classResolver = classResolver;
    this.commands = commands;
    this.methods = methods;
    this.variables = variables;
    this.classes = classes;
    this.maki_id = maki_id;
    this.eventName = eventName;
    this._uiRoot = uiRoot;
    this.stack = [];
    this.callStack = [];
  }
  push(variable) {
    this.stack.push(variable);
  }
  async interpret(start) {
    for (const v of this.variables) {
      validateVariable(v);
    }
    let ip = start;
    while (ip < this.commands.length) {
      const command = this.commands[ip];
      if (this.debug) {
        console.log(command);
      }
      switch (command.opcode) {
        case 1: {
          const offsetIntoVariables = command.arg;
          this.push(this.variables[offsetIntoVariables]);
          break;
        }
        case 2: {
          this.stack.pop();
          break;
        }
        case 3: {
          const a = this.stack.pop();
          const offsetIntoVariables = command.arg;
          const current = this.variables[offsetIntoVariables];
          assume(a != null, `Assigning from invalid object into: ${current.value}. #${this.maki_id}. @${this.eventName} 
 (see next error)`);
          assume(typeof a.value === typeof current.value || current.value == null, `Assigned from one type to a different type ${typeof a.value}, ${typeof current.value}. #${this.maki_id}`);
          current.value = a.value;
          break;
        }
        case 8: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          let result;
          if (a.type == "STRING" && b.type == "STRING") {
            result = V.newInt(b.value.toLowerCase() == a.value.toLowerCase());
          } else {
            result = V.newInt(b.value === a.value);
          }
          this.push(result);
          break;
        }
        case 9: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          let result;
          if (a.type == "STRING" && b.type == "STRING") {
            result = V.newInt(b.value.toLowerCase() != a.value.toLowerCase());
          } else {
            result = V.newInt(b.value !== a.value);
          }
          this.push(result);
          break;
        }
        case 10: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          if (!(a.type == b.type && ["INT", "FLOAT", "DOUBLE", "STRING"].includes(a.type))) {
            switch (a.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.10a");
            }
            switch (b.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.10b");
            }
          }
          if (this.debug) {
            console.log(`${b.value} > ${a.value}`);
          }
          this.push(V.newInt(b.value > a.value));
          break;
        }
        case 11: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          if (!(a.type == b.type && ["INT", "FLOAT", "DOUBLE", "STRING"].includes(a.type))) {
            switch (a.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.11a. " + this.maki_id);
            }
            switch (b.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.11b");
            }
          }
          if (this.debug) {
            console.log(`${b.value} >= ${a.value}`);
          }
          this.push(V.newInt(b.value >= a.value));
          break;
        }
        case 12: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          if (!(a.type == b.type && ["INT", "FLOAT", "DOUBLE", "STRING"].includes(a.type))) {
            switch (a.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.12a");
            }
            switch (b.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.12b");
            }
          }
          if (this.debug) {
            console.log(`${b.value} < ${a.value}`);
          }
          this.push(V.newInt(b.value < a.value));
          break;
        }
        case 13: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          if (!(a.type == b.type && ["INT", "FLOAT", "DOUBLE", "STRING"].includes(a.type))) {
            switch (a.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.13a");
            }
            switch (b.type) {
              case "STRING":
              case "OBJECT":
              case "BOOLEAN":
              case "NULL":
                throw new Error("Tried to add non-numbers.13b");
            }
          }
          if (this.debug) {
            console.log(`${b.value} < ${a.value}`);
          }
          this.push(V.newInt(b.value <= a.value));
          break;
        }
        case 16: {
          const value = this.stack.pop();
          if (value.value) {
            break;
          }
          ip = command.arg - 1;
          break;
        }
        case 17: {
          const value = this.stack.pop();
          if (!value.value) {
            break;
          }
          ip = command.arg - 1;
          break;
        }
        case 18: {
          ip = command.arg - 1;
          break;
        }
        case 24:
        case 112: {
          const methodOffset = command.arg;
          const method = this.methods[methodOffset];
          let methodName = method.name;
          const returnType = method.returnType;
          const classesOffset = method.typeOffset;
          methodName = methodName.toLowerCase();
          const guid = this.classes[classesOffset];
          const klass = this.classResolver(guid);
          if (!klass) {
            throw new Error("Need to add a missing class to runtime");
          }
          if (!klass.prototype[methodName]) {
            throw new Error(`Need to add missing method: ${klass.name}.${methodName}: ${returnType}`);
          }
          let argCount = klass.prototype[methodName].length;
          const methodDefinition = getMethod(guid, methodName);
          if (methodName.toLowerCase() != "init") {
            assert(argCount === (methodDefinition.parameters.length ?? 0), `Arg count mismatch. Expected ${methodDefinition.parameters.length ?? 0} arguments, but found ${argCount} for ${klass.name}.${methodName}`);
          }
          const methodArgs = [];
          while (argCount--) {
            const a = this.stack.pop();
            methodArgs.push(a.value);
          }
          const obj = this.stack.pop();
          assert((obj.type === "OBJECT" && typeof obj.value) === "object" && obj.value != null, `Guru Meditation: Tried to call method ${klass.name}.${methodName} on null object. #${this.maki_id}`);
          let result = null;
          try {
            let afunction = obj.value[methodName];
            if (afunction.constructor.name === "AsyncFunction") {
              console.log("calling fun type:", afunction.constructor.name, `@${klass.name}.${methodName}`);
              result = await obj.value[methodName](...methodArgs);
            } else {
              result = obj.value[methodName](...methodArgs);
            }
          } catch (err) {
            const args = JSON.stringify(methodArgs).replace("[", "").replace("]", "");
            console.warn(`error call: ${klass.name}.${methodName}(${args})`, `err: ${err.message} obj:`, obj);
            result = null;
          }
          if (result === void 0 && returnType !== "NULL") {
            throw new Error(`Did not expect ${klass.name}.${methodName}: ${returnType} to return undefined`);
          }
          if (result === null) {
            result = this.variables[1];
          }
          if (returnType === "BOOLEAN") {
            assert(typeof result === "boolean", `${klass.name}.${methodName} should return a boolean, but "${JSON.stringify(result)}"`);
            result = result ? 1 : 0;
          }
          if (returnType === "OBJECT") {
            assert(typeof result === "object", `Expected the returned value of ${klass.name}.${methodName} to be an object, but it was "${result}"`);
          }
          if (this.debug) {
            console.log(`Calling method ${methodName}`);
          }
          this.push({type: returnType, value: result});
          break;
        }
        case 25: {
          this.callStack.push(ip);
          const offset = command.arg;
          ip = offset - 1;
          break;
        }
        case 33: {
          ip = this.callStack.pop();
          break;
        }
        case 40: {
          break;
        }
        case 48: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          if (a.type == "OBJECT" && b.type == "OBJECT") {
          }
          if (b == null) {
            const objId = a.value instanceof BaseObject ? a.value.getId() : "!noid";
            console.log(objId, ":=", "dest:", b, "src:", a);
            console.warn("Hey, can't move: b.value=a.value with b==nul;a=", a);
          }
          if (b != null) {
            b.value = a.value;
          }
          this.push(a);
          break;
        }
        case 56: {
          const a = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to increment a non-number.");
          }
          const aValue = a.value;
          a.value = aValue + 1;
          this.push({type: a.type, value: aValue});
          break;
        }
        case 57: {
          const a = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to decrement a non-number.");
          }
          const aValue = a.value;
          a.value = aValue - 1;
          this.push({type: a.type, value: aValue});
          break;
        }
        case 58: {
          const a = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to increment a non-number.");
          }
          a.value++;
          this.push(a);
          break;
        }
        case 59: {
          const a = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to increment a non-number.");
          }
          a.value--;
          this.push(a);
          break;
        }
        case 64: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          let a_value = a.value;
          let b_value = b.value;
          switch (a.type) {
            case "BOOLEAN":
              a_value = a_value == 0 ? 0 : 1;
              break;
            case "OBJECT":
            case "NULL":
              throw new Error(`Tried to add non-numbers: ${b.type} + ${a.type}.64a`);
            case "STRING":
              if (b.type !== "STRING") {
                throw new Error(`Tried to add string and a non-string: ${b.type} + ${a.type}.`);
              }
          }
          switch (b.type) {
            case "OBJECT":
              throw new Error(`Tried to add non-numbers.64b.A:${a.type}=${a.value}B:${b.type}=${b.value}`);
            case "BOOLEAN":
              b_value = b_value == 0 ? 0 : 1;
          }
          this.push({type: a.type, value: b_value + a_value});
          break;
        }
        case 65: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to add non-numbers.65a");
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to add non-numbers.65b");
          }
          this.push({type: a.type, value: b.value - a.value});
          break;
        }
        case 66: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to add non-numbers.66a");
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to add non-numbers.66b");
          }
          this.push({type: a.type, value: b.value * a.value});
          break;
        }
        case 67: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to add non-numbers.67a");
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
              throw new Error("Tried to add non-numbers.67b");
          }
          this.push({type: a.type, value: b.value / a.value});
          break;
        }
        case 68: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to add non-numbers.68a");
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
              throw new Error("Tried to add non-numbers.68b");
            case "FLOAT":
            case "DOUBLE":
              const value = Math.floor(b.value) % a.value;
              this.push({type: a.type, value});
              break;
            case "INT":
              this.push({type: a.type, value: b.value % a.value});
              break;
          }
          break;
        }
        case 72: {
          assume(false, "Unimplimented & operator");
          break;
        }
        case 73: {
          assume(false, "Unimplimented | operator");
          break;
        }
        case 74: {
          const a = this.stack.pop();
          this.push(V.newInt(!a.value));
          break;
        }
        case 76: {
          const a = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to add non-numbers.76a");
          }
          this.push({type: a.type, value: -a.value});
          break;
        }
        case 80: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "NULL":
              throw new Error("Tried to add non-numbers.80a");
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "NULL":
              throw new Error("Tried to add non-numbers.80b");
          }
          if (b.value && a.value) {
            this.push(a);
          } else {
            this.push(b);
          }
          break;
        }
        case 81: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "NULL":
              throw new Error("Tried to add non-numbers.81a :" + a.type);
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "NULL":
              throw new Error("Tried to add non-numbers.81b");
          }
          if (b.value) {
            this.push(b);
          } else {
            this.push(a);
          }
          break;
        }
        case 88: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to left shift non-numbers.88a");
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
              throw new Error("Tried to left shift non-numbers.88b");
            case "FLOAT":
            case "DOUBLE":
            case "INT":
              this.push({type: a.type, value: b.value << a.value});
              break;
          }
          break;
        }
        case 89: {
          const a = this.stack.pop();
          const b = this.stack.pop();
          switch (a.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
            case "NULL":
              throw new Error("Tried to right shift non-numbers.89a");
          }
          switch (b.type) {
            case "STRING":
            case "OBJECT":
            case "BOOLEAN":
              throw new Error("Tried to right shift non-numbers.89b");
            case "FLOAT":
            case "DOUBLE":
            case "INT":
              this.push({type: a.type, value: b.value >> a.value});
              break;
          }
          break;
          break;
        }
        case 96: {
          const classesOffset = command.arg;
          const guid = this.classes[classesOffset];
          const Klass = this.classResolver(guid);
          const klassInst = new Klass(this._uiRoot);
          this.push({type: "OBJECT", value: klassInst});
          break;
        }
        case 97: {
          const aValue = this.stack.pop();
          break;
        }
        default:
          throw new Error(`Unhandled opcode ${command.opcode}`);
      }
      ip++;
    }
  }
}
