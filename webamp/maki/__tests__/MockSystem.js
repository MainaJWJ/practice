import {getClass} from "../objects.js";
export function classResolver(guid) {
  switch (guid) {
    case "d6f50f6449b793fa66baf193983eaeef":
      return MockSystem;
    case "45be95e5419120725fbb5c93fd17f1f9":
      return MockGroup;
    case "6129fec14d51dab7ca016591db701b0c":
      return MockGuiList;
  }
  throw new Error(`Unresolvable class "${getClass(guid).name}" (guid: ${guid})`);
}
export class MockSystem {
  constructor() {
    this.group = new MockGroup();
  }
  getruntimeversion() {
    return 5.666;
  }
  messagebox(message, msgtitle, flag, notanymore_id) {
    return 1;
  }
  getscriptgroup() {
    return this.group;
  }
  getAssertions() {
    return this.group.list.items;
  }
}
class MockGroup {
  constructor() {
    this.list = new MockGuiList();
  }
  getobject(objectId) {
    if (objectId !== "results") {
      throw new Error("In this test, we only expect this to be called to get the list.");
    }
    return this.list;
  }
}
class MockGuiList {
  constructor() {
    this.items = [];
  }
  additem(status) {
    this.items.push([status]);
    return 1;
  }
  getlastaddeditempos() {
    return this.items.length - 1;
  }
  setsubitem(i, j, value) {
    this.items[i][j] = value;
  }
}
