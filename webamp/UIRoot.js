import {genCssVar} from "./skin/Bitmap.js";
import TrueTypeFont from "./skin/TrueTypeFont.js";
import {
  assume,
  Emitter,
  findLast,
  removeAllChildNodes
} from "./utils.js";
import BitmapFont from "./skin/BitmapFont.js";
import GammaGroup from "./skin/GammaGroup.js";
import Vm from "./skin/VM.js";
import AUDIO_PLAYER from "./skin/AudioPlayer.js";
import PRIVATE_CONFIG from "./skin/PrivateConfig.js";
import ImageManager from "./skin/ImageManager.js";
import {PlEdit} from "./skin/makiClasses/PlayList.js";
import Config from "./skin/makiClasses/Config.js";
import WinampConfig from "./skin/makiClasses/WinampConfig.js";
import {getWa5Popup} from "./skin/makiClasses/menuWa5.js";
import {
  PathFileExtractor,
  ZipFileExtractor
} from "./skin/FileExtractor.js";
import Application from "./skin/makiClasses/Application.js";
import {
  getSkinEngineClass,
  getSkinEngineClassByContent
} from "./skin/SkinEngine.js";
export class UIRoot {
  constructor(id = "ui-root") {
    this._avss = [];
    this._div = document.createElement("div");
    this._mousePos = {x: 0, y: 0};
    this._bitmaps = {};
    this._fonts = [];
    this._colors = [];
    this._elementAlias = {};
    this._dimensions = {};
    this._groupDefs = {};
    this._gammaSets = new Map();
    this._gammaNames = {};
    this._dummyGammaGroup = null;
    this._activeGammaSetName = "";
    this._xuiGroupDefs = {};
    this._activeGammaSet = [];
    this._containers = [];
    this._systemObjects = [];
    this._buckets = [];
    this._bucketEntries = {};
    this._xFades = [];
    this._input = document.createElement("input");
    this._skinInfo = {};
    this._skin = {name: "", url: ""};
    this._skins = [];
    this._eventListener = new Emitter();
    this._additionalCss = [];
    this._objects = [];
    this.audio = AUDIO_PLAYER;
    this._inputChanged = () => {
      this.playlist.clear();
      for (var i = 0; i < this._input.files.length; i++) {
        const newTrack = {
          filename: this._input.files[i].name,
          file: this._input.files[i]
        };
        this.playlist.addTrack(newTrack);
      }
      this.audio.play();
    };
    this._id = id;
    this._input.type = "file";
    this._input.setAttribute("multiple", "true");
    this._input.onchange = this._inputChanged;
    this._imageManager = new ImageManager(this);
    this._config = new Config(this);
    this._application = new Application(this);
    this._winampConfig = new WinampConfig(this);
    this.playlist = new PlEdit(this);
    this.vm = new Vm(this);
    this.setlistenMouseMove(true);
  }
  getId() {
    return this._id;
  }
  guid2alias(guid) {
    const knownContainerGuids = {
      "{0000000a-000c-0010-ff7b-01014263450c}": "vis",
      "{45f3f7c1-a6f3-4ee6-a15e-125e92fc3f8d}": "pl",
      "{6b0edf80-c9a5-11d3-9f26-00c04f39ffc6}": "ml",
      "{7383a6fb-1d01-413b-a99a-7e6f655f4591}": "con",
      "{7a8b2d76-9531-43b9-91a1-ac455a7c8242}": "lir",
      "{a3ef47bd-39eb-435a-9fb3-a5d87f6f17a5}": "dl",
      "{f0816d7b-fffc-4343-80f2-e8199aa15cc3}": "video"
    };
    if (guid.includes(":")) {
      guid = guid.split(":")[1];
    }
    guid = guid.toLowerCase();
    return knownContainerGuids[guid] || guid;
  }
  on(event, callback) {
    return this._eventListener.on(event, callback);
  }
  trigger(event, ...args) {
    this._eventListener.trigger(event, ...args);
  }
  off(event, callback) {
    this._eventListener.off(event, callback);
  }
  reset() {
    this.deinitSkin();
    this.dispose();
    this._bitmaps = {};
    this._imageManager.dispose();
    this._imageManager = new ImageManager(this);
    this._fonts = [];
    this._colors = [];
    this._groupDefs = {};
    this._gammaSets = new Map();
    this._xuiGroupDefs = {};
    this._activeGammaSet = [];
    this._containers = [];
    this._systemObjects = [];
    this._gammaNames = {};
    this._buckets = [];
    this._bucketEntries = {};
    this._xFades = [];
    this._additionalCss = [];
    removeAllChildNodes(this._div);
    this._objects = [];
  }
  deinitSkin() {
    for (const container of this._containers) {
      container.dispose();
    }
    for (const systemObj of this._systemObjects) {
      systemObj.dispose();
    }
  }
  getRootDiv() {
    return this._div;
  }
  getImageManager() {
    return this._imageManager;
  }
  setImageManager(imageManager) {
    this._imageManager = imageManager;
  }
  addObject(obj) {
    this._objects.push(obj);
  }
  addBitmap(bitmap) {
    const id = bitmap.getId().toLowerCase();
    this._bitmaps[id] = bitmap;
  }
  getBitmap(id) {
    let lowercaseId = id.toLowerCase();
    if (!this.hasBitmap(lowercaseId)) {
      lowercaseId = this._elementAlias[lowercaseId];
    }
    const found = this._bitmaps[lowercaseId];
    assume(found != null, `Could not find bitmap with id ${id}.`);
    return found;
  }
  removeBitmap(id) {
    delete this._bitmaps[id.toLowerCase()];
  }
  getBitmaps() {
    return this._bitmaps;
  }
  hasBitmapFilepath(filePath) {
    for (const bitmap of Object.values(this._bitmaps)) {
      if (bitmap.getFile() == filePath) {
        return true;
      }
    }
    return false;
  }
  hasBitmap(id) {
    const lowercaseId = id.toLowerCase();
    const found = this._bitmaps[lowercaseId];
    return found ? true : false;
  }
  addFont(font) {
    this._fonts.push(font);
  }
  getFont(id) {
    const found = findLast(this._fonts, (font) => font.getId().toLowerCase() === id.toLowerCase());
    if (found == null) {
      console.warn(`Could not find true type font with id ${id}.`);
    }
    return found ?? null;
  }
  getFonts() {
    return this._fonts;
  }
  addColor(color) {
    this._colors.push(color);
  }
  addAlias(id, target) {
    this._elementAlias[id.toLowerCase()] = target.toLowerCase();
  }
  getAlias(id) {
    return this._elementAlias[id.toLowerCase()];
  }
  addDimension(id, size) {
    this._dimensions[id] = size;
  }
  addWidth(id, bitmapId) {
    const bitmap = this.getBitmap(bitmapId);
    if (bitmap) {
      this.addDimension(id, bitmap.getWidth());
    }
  }
  addHeight(id, bitmapId) {
    const bitmap = this.getBitmap(bitmapId);
    if (bitmap) {
      this.addDimension(id, bitmap.getHeight());
    }
  }
  getColor(id) {
    const lowercaseId = id.toLowerCase();
    const found = findLast(this._colors, (color) => color._id.toLowerCase() === lowercaseId);
    assume(found != null, `Could not find color with id ${id}.`);
    return found;
  }
  addComponentBucket(bucket) {
    this._buckets.push(bucket);
  }
  addBucketEntry(windowType, entry) {
    if (!this._bucketEntries[windowType]) {
      this._bucketEntries[windowType] = [];
    }
    this._bucketEntries[windowType].push(entry);
  }
  getBucketEntries(windowType) {
    return this._bucketEntries[windowType] || [];
  }
  addXFade(xfade) {
    this._xFades.push(xfade);
  }
  getXFades() {
    return this._xFades;
  }
  addGroupDef(groupDef) {
    const groupdef_id = groupDef.attributes.id.toLowerCase();
    this._groupDefs[groupdef_id] = groupDef;
    if (groupDef.attributes.xuitag) {
      this.addXuitagGroupDefId(groupDef.attributes.xuitag, groupdef_id);
    }
  }
  addXuitagGroupDefId(xuitag, groupdef_id) {
    this._xuiGroupDefs[xuitag.toLowerCase()] = groupdef_id.toLowerCase();
  }
  getGroupDef(id) {
    if (!id)
      return null;
    const groupdef_id = id.toLowerCase();
    return this._groupDefs[groupdef_id];
  }
  addContainers(container) {
    this._containers.push(container);
    return container;
  }
  getContainers() {
    return this._containers;
  }
  iterContainers(callback) {
    for (const container of this._containers) {
      if (callback(container))
        return container;
    }
  }
  findContainer(id) {
    return this.iterContainers((ct) => {
      return ct.hasId(id);
    });
  }
  addGammaSet(id, gammaSet) {
    const lower = id.toLowerCase();
    this._gammaNames[lower] = id;
    this._gammaSets.set(lower, gammaSet);
  }
  enableGammaSet(id) {
    if (id) {
      console.log(`Enabling gammaset: '${id}'`);
      const found = this._gammaSets.get(id.toLowerCase());
      assume(found != null, `Could not find gammaset for id "${id}" from set of ${Array.from(this._gammaSets.keys()).join(", ")}`);
      this._activeGammaSetName = id;
      this._activeGammaSet = found || [];
      PRIVATE_CONFIG.setPrivateString(this.getSkinName(), "_gammagroup_", id);
    }
    this.trigger("colorthemechanged", id || "");
    this._setCssVars();
  }
  enableDefaultGammaSet() {
    const start = performance.now();
    const gammaSetNames = Array.from(this._gammaSets.keys());
    const firstName = gammaSetNames[0] || "";
    const lastGamma = PRIVATE_CONFIG.getPrivateString(this.getSkinName(), "_gammagroup_", firstName);
    this.enableGammaSet(lastGamma);
    const end = performance.now();
    console.log(`Loading initial gamma took: ${(end - start) / 1e3}s`);
  }
  _getGammaGroup(id) {
    if (!id) {
      return this._getGammaGroupDummy();
    }
    const lower = id.toLowerCase();
    const found = findLast(this._activeGammaSet, (gammaGroup) => {
      return gammaGroup.getId().toLowerCase() === lower;
    });
    return found ?? this._getGammaGroupDummy();
  }
  _getGammaGroupDummy() {
    if (!this._dummyGammaGroup) {
      this._dummyGammaGroup = new GammaGroup();
      this._dummyGammaGroup.setXmlAttributes({
        id: "dummy",
        value: "0,0,0"
      });
    }
    return this._dummyGammaGroup;
  }
  _getBitmapAliases() {
    const aliases = {};
    for (const [aliasId, targetId] of Object.entries(this._elementAlias)) {
      if (this.hasBitmap(targetId)) {
        if (!aliases[targetId]) {
          aliases[targetId] = [];
        }
        aliases[targetId].push(aliasId);
      }
    }
    return aliases;
  }
  async _setCssVars() {
    const cssRules = [];
    const bitmapAliases = this._getBitmapAliases();
    const maybeBitmapAliases = (bitmap) => {
      const aliases = bitmapAliases[bitmap.getId().toLowerCase()];
      if (aliases != null) {
        for (const alias of aliases) {
          cssRules.push(`${genCssVar(alias)}: var(${bitmap.getCSSVar()});`);
        }
      }
    };
    const bitmapFonts = this._fonts.filter((font) => font instanceof BitmapFont && !font.useExternalBitmap());
    for (const bitmap of [...Object.values(this._bitmaps), ...bitmapFonts]) {
      cssRules.push(await bitmap.getGammaTransformedUrl(this));
      maybeBitmapAliases(bitmap);
    }
    for (const color of this._colors) {
      const groupId = color.getGammaGroup();
      const gammaGroup = this._getGammaGroup(groupId);
      const url = gammaGroup.transformColor(color.getValue());
      cssRules.push(`  ${color.getCSSVar()}: ${url};`);
    }
    for (const [dimension, size] of Object.entries(this._dimensions)) {
      cssRules.push(`  --dim-${dimension}: ${size}px;`);
    }
    for (const additionalRule of this._additionalCss) {
      cssRules.push(additionalRule);
    }
    const cssId = `${this._id}-bitmap-css`;
    let cssEl = document.querySelector(`style#${cssId}`);
    if (!cssEl) {
      cssEl = document.createElement("style");
      cssEl.setAttribute("type", "text/css");
      cssEl.setAttribute("id", cssId);
      document.head.appendChild(cssEl);
    }
    cssEl.textContent = `#${this._id} {${cssRules.join("\n")}}`;
  }
  addAdditionalCss(css) {
    this._additionalCss.push(css);
  }
  getXuiElement(xuitag) {
    const lowercaseName = xuitag.toLowerCase();
    const groupdef_id = this._xuiGroupDefs[lowercaseName];
    return this.getGroupDef(groupdef_id);
  }
  loadTrueTypeFonts() {
    const cssRules = [];
    const truetypeFonts = this._fonts.filter((font) => font instanceof TrueTypeFont);
    for (const ttf of truetypeFonts) {
      if (!ttf.hasUrl()) {
        continue;
      }
      cssRules.push(`@font-face {
        font-family: '${ttf.getId()}';
        src: url(${ttf.getBase64()}) format('truetype');
        font-weight: normal;
        font-style: normal;
      }`);
    }
    const cssEl = document.getElementById("truetypefont-css");
    cssEl.textContent = cssRules.join("\n");
  }
  dispatch(action, param, actionTarget) {
    switch (action.toLowerCase()) {
      case "play":
        this.audio.play();
        break;
      case "pause":
        this.audio.pause();
        break;
      case "stop":
        this.audio.stop();
        break;
      case "next":
        this.next();
        break;
      case "prev":
        this.previous();
        break;
      case "eject":
        this.eject();
        break;
      case "vis_next":
      case "vis_prev":
      case "vis_f5":
        if (this._avss.length) {
          for (const avs of this._avss) {
            avs.dispatchAction(action, param, actionTarget);
          }
        }
        break;
      case "eq_toggle":
        this.eq_toggle();
        this.trigger("eq_toggle");
        break;
      case "toggle":
        this.toggleContainer(param);
        this.trigger("toggle");
        break;
      case "close":
        this.closeContainer();
        break;
      case "menu":
        getWa5Popup(param, this).popatmouse();
        break;
      case "controlmenu":
        getWa5Popup("ControlMenu", this).popatmouse();
        break;
      case "sysmenu":
        getWa5Popup("Main", this).popatmouse();
        break;
      case "pe_add":
        getWa5Popup("Add", this).popatmouse();
        break;
      case "pe_rem":
        getWa5Popup("Remove", this).popatmouse();
        break;
      case "pe_sel":
        getWa5Popup("Select", this).popatmouse();
        break;
      case "pe_misc":
        getWa5Popup("MiscOpt", this).popatmouse();
        break;
      case "pe_list":
        getWa5Popup("Playlist", this).popatmouse();
        break;
      default:
        assume(false, `Unknown global action: ${action}`);
    }
  }
  getActionState(action, param, actionTarget = "") {
    if (action != null) {
      switch (action.toLowerCase()) {
        case "eq_toggle":
          return this.audio.getEqEnabled();
        case "toggle":
          return this.getContainerVisible(param);
      }
    }
    return null;
  }
  next() {
    const currentTrack = this.playlist.getcurrentindex();
    if (currentTrack < this.playlist.getnumtracks() - 1) {
      this.playlist.playtrack(currentTrack + 1);
    }
    this.audio.play();
  }
  previous() {
    const currentTrack = this.playlist.getcurrentindex();
    if (currentTrack > 0) {
      this.playlist.playtrack(currentTrack - 1);
    }
    this.audio.play();
  }
  eject() {
    this._input.click();
  }
  eq_toggle() {
    this.audio.setEqEnabled(!this.audio.getEqEnabled());
  }
  toggleContainer(param) {
    const container = this.findContainer(param);
    assume(container != null, `Can not toggle on unknown container: ${param}`);
    container.toggle();
  }
  getContainerVisible(param) {
    const container = this.findContainer(param);
    if (container != null) {
      return container.getVisible();
    }
  }
  closeContainer() {
    const btn = document.activeElement;
    const containerEl = btn.closest("container");
    const container_id = containerEl.getAttribute("id").toLowerCase();
    for (const container of this._containers) {
      if (container._id.toLowerCase() == container_id) {
        container.close();
      }
    }
  }
  draw() {
    this._div.setAttribute("id", this._id);
    this._div.style.imageRendering = "pixelated";
    for (const container of this.getContainers()) {
      container.draw();
      this._div.appendChild(container.getDiv());
    }
  }
  dispose() {
    this._div.remove();
    for (const obj of this._objects) {
      obj.dispose();
    }
  }
  setlistenMouseMove(listen) {
    const update = (e) => {
      this._mousePos = {
        x: e.pageX,
        y: e.pageY
      };
    };
    window.document[`${listen ? "add" : "remove"}EventListener`]("mousemove", update);
  }
  setZip(zip) {
    this._zip = zip;
    this._preferZip = zip != null;
  }
  getZip() {
    return this._zip;
  }
  setPreferZip(prefer) {
    this._preferZip = prefer;
  }
  setSkinDir(skinPath) {
    this._skinPath = skinPath;
  }
  getSkinDir() {
    return this._skinPath;
  }
  setFileExtractor(fe) {
    this._fileExtractor = fe;
  }
  async getFileAsString(filePath) {
    return await this._fileExtractor.getFileAsString(filePath);
  }
  async getFileAsBytes(filePath) {
    return await this._fileExtractor.getFileAsBytes(filePath);
  }
  async getFileAsBlob(filePath) {
    return await this._fileExtractor.getFileAsBlob(filePath);
  }
  addSystemObject(systemObj) {
    this._systemObjects.push(systemObj);
  }
  init() {
    for (const systemObject of this._systemObjects) {
      systemObject.init();
    }
    this.logMessage("Initializing Maki...");
    for (const container of this.getContainers()) {
      container.init();
    }
    this.playlist.init();
  }
  setSkinInfo(skinInfo) {
    const url = this._skinInfo.url;
    this._skinInfo = {...skinInfo, url};
  }
  setSkinUrl(url) {
    this._skinInfo.url = url;
  }
  getSkinUrl() {
    return this._skinInfo.url;
  }
  getSkinInfo() {
    return this._skinInfo;
  }
  getSkinName() {
    return this.getSkinInfo()["name"];
  }
  async switchSkin(skin) {
    const parentDiv = this.getRootDiv().parentElement;
    this.reset();
    parentDiv.appendChild(this.getRootDiv());
    const name = typeof skin === "string" ? skin : skin.name;
    const skinPath = typeof skin === "string" ? skin : skin.url;
    this.setSkinUrl(skinPath);
    let skinFetched = false;
    let SkinEngineClass2 = null;
    let SkinEngineClasses = await getSkinEngineClass(skinPath);
    if (SkinEngineClasses.length > 1) {
      await this._loadSkinPathToUiroot(skinPath, null);
      skinFetched = true;
      SkinEngineClass2 = await getSkinEngineClassByContent(SkinEngineClasses, skinPath, this);
    } else {
      SkinEngineClass2 = SkinEngineClasses[0];
    }
    if (SkinEngineClass2 == null) {
      throw new Error(`Skin not supported`);
    }
    this.SkinEngineClass = SkinEngineClass2;
    const parser = new SkinEngineClass2(this);
    if (!skinFetched)
      await this._loadSkinPathToUiroot(skinPath, parser);
    await parser.buildUI();
  }
  async _loadSkinPathToUiroot(skinPath, skinEngine) {
    let response;
    let fileExtractor;
    if (skinPath.endsWith("/")) {
      fileExtractor = new PathFileExtractor();
    } else {
      response = await fetch(skinPath);
      if (response.status == 404) {
        throw new Error(`Skin does not exist`);
      }
      if (skinEngine != null) {
        fileExtractor = skinEngine.getFileExtractor();
      }
    }
    if (fileExtractor == null) {
      if (response.headers.get("content-type").startsWith("application/")) {
        fileExtractor = new ZipFileExtractor();
      } else {
        fileExtractor = new PathFileExtractor();
      }
    }
    await fileExtractor.prepare(skinPath, response);
    this.setFileExtractor(fileExtractor);
  }
  set SkinEngineClass(Engine) {
    this._skinEngineClass = Engine;
  }
  get SkinEngineClass() {
    return this._skinEngineClass;
  }
  get APPLICATION() {
    return this._application;
  }
  get CONFIG() {
    return this._config;
  }
  get WINAMP_CONFIG() {
    return this._winampConfig;
  }
  logMessage(message) {
    this.trigger("onlogmessage", message);
  }
}
