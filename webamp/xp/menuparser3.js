const menuContent = `256 MENUEX
LANGUAGE LANG_ENGLISH, SUBLANG_ENGLISH_US
{
  POPUP "File", 65535, MFT_STRING, MFS_ENABLED, 0
  {
    MENUITEM SEPARATOR
    MENUITEM "Play &file...   	L", 40029, MFT_STRING, MFS_ENABLED
    MENUITEM "Play &URL...	Ctrl+L", 40185, MFT_STRING, MFS_ENABLED
    MENUITEM "Play &folder...	Shift+L", 40187, MFT_STRING, MFS_ENABLED
    POPUP "Play &bookmark", 65535, MFT_STRING, MFS_ENABLED, 0
    {
      MENUITEM "&Edit bookmarks...	Ctrl+Alt+I", 40320, MFT_STRING, MFS_ENABLED
      MENUITEM "&Add current as bookmark	Ctrl+Alt+B", 40321, MFT_STRING, MFS_ENABLED
      MENUITEM "", 0, MFT_SEPARATOR, MFS_ENABLED
    }
    MENUITEM "E&xit	Alt+F4", 40001, MFT_STRING, MFS_ENABLED
  }
  POPUP "ML_View", 65535, MFT_STRING, MFS_ENABLED, 0
  {
    MENUITEM "Media Library &Preferences...", 40372, MFT_STRING | MFT_RIGHTJUSTIFY, MFS_ENABLED
  }
  POPUP "&Bookmarks"
  {
      MENUITEM "&Edit bookmarks...	Ctrl+Alt+I",  40320
      MENUITEM "&Add current as bookmark	Ctrl+Alt+B",  40321
      MENUITEM SEPARATOR
      POPUP "&Tools",  GRAYED
      {
        MENUITEM "Migrate/Import...",  40009
        MENUITEM "Register Winamp...",  40010
      }
  }
}
`;
const another_sample = `IDC_WIN32CUSTOMMENUBARAEROTHEME MENUEX
BEGIN
    POPUP "&File",                          65535,MFT_STRING,MFS_ENABLED
    BEGIN
        MENUITEM "E&xit",                       IDM_EXIT,MFT_STRING,MFS_ENABLED
    END
    POPUP "&Another",                       65535,MFT_STRING,MFS_ENABLED
    BEGIN
        MENUITEM "&One",                        ID_ANOTHER_ONE,MFT_STRING,MFS_ENABLED
        MENUITEM "&Two",                        ID_ANOTHER_TWO,MFT_STRING,MFS_ENABLED
    END
    MENUITEM "&Disabled",                   ID_DISABLED,MFT_STRING,MFS_GRAYED
    MENUITEM "&Grayed",                     ID_GRAYED,  MFT_STRING,MFS_GRAYED
    POPUP "&Help",                          65535,MFT_STRING | MFT_RIGHTJUSTIFY,MFS_ENABLED
    BEGIN
        MENUITEM "&About ...",                  IDM_ABOUT,MFT_STRING,MFS_ENABLED
    END
END`;
function parseMenuToJson(menuContent2) {
  const root = [];
  let container = root;
  let levelStack = [root];
  for (let line of menuContent2.split("\n")) {
    if (!line || line.trim().startsWith("//")) {
      continue;
    }
    const menuMatch = line.match(/\s*(POPUP|MENUITEM)\s+(SEPARATOR|"([^"]*)")(?:\s*,\s*(\w+)[\s,]*(.*))?/i);
    if (menuMatch) {
      let [, tag, t1, t2, id, flags] = menuMatch;
      const type = tag == "POPUP" ? "popup" : t1 == "SEPARATOR" || (flags || "").indexOf("MFT_SEPARATOR") >= 0 ? "separator" : "menuitem";
      flags = flags || "";
      const menu = {
        type
      };
      container.push(menu);
      switch (menu.type) {
        case "popup":
          menu.caption = t2;
          menu.children = [];
          container = menu.children;
          if (flags.indexOf("GRAYED") >= 0)
            menu.disabled = true;
          levelStack.push(container);
          break;
        case "menuitem":
          menu.caption = t2;
          menu.id = id;
          flags.indexOf("GRAYED") >= 0 && (menu.disabled = true);
          break;
        default:
          break;
      }
      console.log("m", menu);
    } else if (["}", "END"].includes(line.trim())) {
      levelStack.pop();
      container = levelStack[levelStack.length - 1];
    }
  }
  return root;
}
var m = parseMenuToJson(menuContent);
console.log(m);
var m = parseMenuToJson(another_sample);
console.log(m);
