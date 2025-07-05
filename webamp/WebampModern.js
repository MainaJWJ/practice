import {
  PathFileExtractor,
  ZipFileExtractor
} from "./skin/FileExtractor.js";
import {classResolver} from "./skin/resolver.js";
import {
  getSkinEngineClass,
  getSkinEngineClassByContent
} from "./skin/SkinEngine.js";
import {UIRoot} from "./UIRoot.js";
import {WebAmpModern} from "./WebampModernInteface.js";
function hack() {
  classResolver("A funny joke about why this is needed.");
}
const DEFAULT_OPTIONS = {
  skin: "assets/WinampModern566.wal",
  tracks: []
};
let DIV_UNIQUER = 0;
export class Webamp5 extends WebAmpModern {
  constructor(parent, options = {}) {
    super(parent, options);
    this._parent = parent || document.body;
    this._options = {...DEFAULT_OPTIONS, ...options};
    DIV_UNIQUER++;
    this._uiRoot = new UIRoot(`ui-root-${DIV_UNIQUER}`);
    parent.appendChild(this._uiRoot.getRootDiv());
    this.switchSkin(this._options.skin);
    for (const song of this._options.tracks) {
      this._uiRoot.playlist.enqueuefile(song);
    }
  }
  async switchSkin(skinPath) {
    this._uiRoot.reset();
    this._parent.appendChild(this._uiRoot.getRootDiv());
    let skinFetched = false;
    let SkinEngineClass = null;
    let SkinEngineClasses = await getSkinEngineClass(skinPath);
    if (SkinEngineClasses.length > 1) {
      await this._loadSkinPathToUiroot(skinPath, this._uiRoot, null);
      skinFetched = true;
      SkinEngineClass = await getSkinEngineClassByContent(SkinEngineClasses, skinPath, this._uiRoot);
    } else {
      SkinEngineClass = SkinEngineClasses[0];
    }
    if (SkinEngineClass == null) {
      throw new Error(`Skin not supported`);
    }
    this._uiRoot.SkinEngineClass = SkinEngineClass;
    const parser = new SkinEngineClass(this._uiRoot);
    if (!skinFetched)
      await this._loadSkinPathToUiroot(skinPath, this._uiRoot, parser);
    await parser.buildUI();
  }
  async _loadSkinPathToUiroot(skinPath, uiRoot, skinEngine) {
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
    uiRoot.setFileExtractor(fileExtractor);
  }
  playSong(songurl) {
  }
  onLogMessage(callback) {
    this._uiRoot.on("onlogmessage", callback);
  }
}
async function main() {
  window.WebampModern = Webamp5;
}
main();
