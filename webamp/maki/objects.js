import stdPatched from "./objectData/stdPatched.js";
import pldir from "./objectData/pldir.json.proxy.js";
import config from "./objectData/config.json.proxy.js";
import winampconfig from "./objectData/winampconfig.json.proxy.js";
import application from "./objectData/application.json.proxy.js";
import fileio from "./objectData/fileio.json.proxy.js";
import {assert} from "../utils.js";
const objects = {
  ...stdPatched,
  ...pldir,
  ...config,
  ...winampconfig,
  ...application,
  ...fileio
};
export function getClass(id) {
  return normalizedObjects[getFormattedId(id)];
}
export function getReturnType(classId, methodName) {
  const method = getMethod(classId, methodName);
  const upper = method.result.toUpperCase();
  switch (upper) {
    case "INT":
    case "DOUBLE":
    case "STRING":
    case "FLOAT":
    case "BOOLEAN":
    case "ANY":
      return upper;
    case "":
      return "NULL";
    default:
      return "OBJECT";
  }
}
export function getMethod(classId, methodName) {
  const klass = getClass(classId);
  assert(klass != null, `Could not find class matching id: ${classId}`);
  return getObjectFunction(klass, methodName);
}
export const normalizedObjects = {};
Object.keys(objects).forEach((key) => {
  normalizedObjects[key.toLowerCase()] = objects[key];
});
const objectsByName = {};
Object.values(objects).forEach((object) => {
  objectsByName[object.name] = object;
});
Object.values(normalizedObjects).forEach((object) => {
  const parentClass = objectsByName[object.parent];
  if (parentClass == null) {
    if (object.parent === "@{00000000-0000-0000-0000-000000000000}@") {
    } else {
      throw new Error(`Could not find parent class named ${object.parent}`);
    }
  }
  object.parentClass = parentClass;
});
export function getFormattedId(id) {
  const formattedId = id.replace(/(........)(....)(....)(..)(..)(..)(..)(..)(..)(..)(..)/, "$1$3$2$7$6$5$4$11$10$9$8");
  return formattedId.toLowerCase();
}
function getObjectFunction(klass, functionName) {
  const lowerName = functionName.toLowerCase();
  const method = klass.functions.find((func) => {
    return func.name.toLowerCase() === lowerName;
  });
  if (method != null) {
    return method;
  }
  if (klass.parentClass == null) {
    throw new Error(`Could not find method ${functionName} on ${klass.name}.`);
  }
  return getObjectFunction(klass.parentClass, functionName);
}
