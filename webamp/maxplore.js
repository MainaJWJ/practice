import {classResolver} from "./skin/resolver.js";
import {parse as parseMaki1} from "./maki/parser.js";
import {parse as parseMakiXp} from "./maki/parserXp.js";
function hack() {
  classResolver("A funny joke about why this is needed.");
}
function getClass(guid) {
  try {
    return classResolver(guid);
  } catch (e) {
    return null;
  }
}
const panel = document.getElementById("panel");
const totals = document.createElement("div");
panel.appendChild(totals);
const table = document.createElement("table");
panel.appendChild(table);
const header = document.createElement("tr");
const nameHeader = document.createElement("th");
nameHeader.innerText = "Class Name";
header.appendChild(nameHeader);
const methodHeader = document.createElement("th");
methodHeader.innerText = "Methods";
header.appendChild(methodHeader);
table.appendChild(header);
const classes = [];
let total = 0;
let found = 0;
let dummy = 0;
const url = new URL(window.location.href);
let makiPath = url.searchParams.get("maki");
console.log("maki:", makiPath);
if (!makiPath) {
  makiPath = "/assets/MMD3/scripts/songinfo.maki";
  url.searchParams.set("maki", makiPath);
  window.history.pushState({pageTitle: "title"}, "title", url);
}
async function main() {
  fetch(makiPath).then(async (response) => {
    const scriptContents = await response.arrayBuffer();
    if (scriptContents == null) {
      `ScriptFile file not found at path ${makiPath}`;
    } else {
      const parsedScriptXp = parseMakiXp(scriptContents);
      const parsedScript1 = parseMaki1(scriptContents, makiPath);
      explore(parsedScriptXp, parsedScript1);
    }
  });
}
function explore(makiXp, maki) {
  const scriptXp = JSON.stringify(makiXp, null, "	");
  const script = JSON.stringify(maki, null, "	");
  updateEditor(scriptXp, "editor1");
  updateEditor(script, "editor2");
}
function updateEditor(txt, elementId) {
  const div = document.getElementById(elementId);
  div.textContent = txt;
  var editor = window.ace.edit(elementId);
  editor.setTheme("ace/theme/merbivore");
  editor.getSession().setMode("ace/mode/json");
}
main();
methodHeader.innerText += ` (${found}/${total}, ${Math.round(found / total * 100)}% Complete) | ${Math.round((found - dummy) / total * 100)}% Real.`;
