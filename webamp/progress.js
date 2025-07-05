import {classResolver} from "./skin/resolver.js";
import {normalizedObjects, getFormattedId} from "./maki/objects.js";
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
const totals = document.createElement("div");
document.body.appendChild(totals);
const table = document.createElement("table");
document.body.appendChild(table);
const header = document.createElement("tr");
const nameHeader = document.createElement("th");
nameHeader.innerText = "Class Name";
header.appendChild(nameHeader);
const methodHeader = document.createElement("th");
methodHeader.innerText = "Methods";
header.appendChild(methodHeader);
table.appendChild(header);
const classes = [];
for (const [key, obj] of Object.entries(normalizedObjects)) {
  const name = obj.name;
  const deprecated = obj.deprecated || [
    "DropDownList",
    "CheckBox",
    "Edit",
    "GroupList",
    "GuiList",
    "GuiTree",
    "Browser",
    "XmlDoc",
    "MouseRedir",
    "TreeItem",
    "CfgGroup"
  ].includes(obj.name);
  const methods = [];
  const klass = getClass(getFormattedId(key.toLowerCase()));
  console.log("KLASS:" + key, klass, obj);
  for (const method of obj.functions) {
    const params = method.parameters.map(([type, name2]) => `${name2}<i> :${type}</i>`);
    const methodName = `${method.name}(${params.join(", ")})` + (method.result.length > 0 ? "<i> :" + method.result + "</i>" : "");
    const blacklist = method.name.startsWith("fx_");
    const mdeprecated = method.deprecated;
    const hook = method.name.toLowerCase().startsWith("on");
    if (hook) {
      methods.push({
        name: methodName,
        hook: true,
        deprecated: mdeprecated,
        blacklist
      });
      continue;
    } else if (klass == null) {
      methods.push({
        name: methodName,
        status: "missing",
        deprecated: mdeprecated,
        blacklist
      });
    } else {
      const impl = klass.prototype[method.name.toLowerCase()];
      if (impl == null) {
        methods.push({
          name: methodName,
          status: "missing",
          deprecated: mdeprecated,
          blacklist
        });
      } else if (impl.length !== method.parameters.length) {
        methods.push({
          name: methodName,
          status: "wrong",
          deprecated: mdeprecated,
          blacklist
        });
      } else {
        const code = impl.toString();
        const fake = code.split("\n").length <= 2 || /[Uu]nimplemented/.test(code);
        methods.push({
          name: methodName,
          status: "found",
          deprecated: mdeprecated,
          blacklist,
          fake
        });
      }
    }
  }
  classes.push({name, deprecated, methods, implemented: !!klass});
}
let total = 0;
let found = 0;
let dummy = 0;
for (const cls of classes) {
  const classRow = document.createElement("tr");
  const className = document.createElement("td");
  className.classList.add("class-name");
  className.addEventListener("click", () => {
    classRow.classList.toggle("expanded");
  });
  let totalCount = 0;
  let foundCount = 0;
  className.style.color = cls.deprecated ? "grey" : "black";
  classRow.appendChild(className);
  const methodsCell = document.createElement("td");
  classRow.appendChild(methodsCell);
  console.log("klass:", cls);
  total++;
  found += cls.implemented ? 1 : 0;
  for (const method of cls.methods) {
    if (method.hook) {
      continue;
    }
    totalCount++;
    const methodDiv2 = document.createElement("span");
    methodDiv2.classList.add("method");
    methodDiv2.innerHTML = `<span>${method.name}</span>`;
    methodDiv2.title = method.name;
    switch (method.status) {
      case "missing":
        methodDiv2.style.backgroundColor = "pink";
        break;
      case "found":
        methodDiv2.style.backgroundColor = "lightgreen";
        if (method.fake) {
          methodDiv2.style.backgroundColor = "greenyellow";
          methodDiv2.classList.add("fake");
          dummy++;
        }
        foundCount++;
        break;
      case "wrong":
        methodDiv2.style.backgroundColor = "red";
        break;
    }
    methodsCell.appendChild(methodDiv2);
    if (cls.deprecated) {
      methodDiv2.style.backgroundColor = "white";
      totalCount--;
    } else if (method.deprecated) {
      totalCount--;
      methodDiv2.style.backgroundColor = "silver";
    } else if (method.blacklist) {
      totalCount--;
      methodDiv2.style.backgroundColor = "coral";
    }
  }
  if (cls.methods.length == 0 || totalCount == 0) {
    const methodDiv2 = document.createElement("span");
    methodDiv2.classList.add("method");
    methodDiv2.classList.add("dummy");
    methodsCell.appendChild(methodDiv2);
  }
  className.innerText = `${cls.name} (${foundCount}/${totalCount})`;
  const methodDiv = document.createElement("span");
  methodDiv.classList.add("implementation");
  methodDiv.style.backgroundColor = cls.implemented ? "lightgreen" : cls.deprecated ? "white" : "pink";
  className.appendChild(methodDiv);
  total += totalCount;
  found += foundCount;
  table.appendChild(classRow);
}
methodHeader.innerText += ` (${found}/${total}, ${Math.round(found / total * 100)}% Complete) | ${Math.round((found - dummy) / total * 100)}% Real.`;
