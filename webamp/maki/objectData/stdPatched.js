import std from "./std.json.proxy.js";
const NAME_TO_DEF = {};
Object.values(std).forEach((value) => {
  NAME_TO_DEF[value.name] = value;
});
function getMethod(className, methodName) {
  return NAME_TO_DEF[className].functions.find(({name}) => {
    return name === methodName;
  });
}
getMethod("Timer", "isRunning").result = "boolean";
getMethod("ToggleButton", "onToggle").parameters[0][1] = "onoff";
getMethod("GuiTree", "onChar").parameters[0][0] = "string";
getMethod("GuiList", "onSetVisible").parameters[0][0] = "boolean";
getMethod("Wac", "onNotify").parameters = getMethod("Object", "onNotify").parameters;
getMethod("Wac", "onNotify").result = "int";
export default std;
