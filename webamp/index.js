function getUrlQuery(location, variable) {
  return new URL(location.href).searchParams.get(variable);
}
const STATUS = document.getElementById("status");
function setStatus(status) {
  STATUS.innerText = status;
}
const DEFAULT_SKIN = "assets/skins/skin.wsz";
var webamp;
async function main() {
  initializeSkinListMenu();
  const skinPath = getUrlQuery(window.location, "skin") || DEFAULT_SKIN;
  const option = {
    skin: skinPath,
    tracks: [
      "assets/Just_Plain_Ant_-_05_-_Stumble.mp3",
      "assets/Just_Plain_Ant_-_05_-_Stumble.mp3"
    ]
  };
  setStatus("Downloading MP3...");
  webamp = new window.WebampModern(document.getElementById("web-amp"), option);
  webamp.onLogMessage(setStatus);
  setStatus("");
}
async function changeSkinByUrl() {
  setStatus("Downloading skin...");
  const skinPath = getUrlQuery(window.location, "skin") || DEFAULT_SKIN;
  webamp.switchSkin(skinPath);
  setStatus("");
}
function gql(strings) {
  return strings[0];
}
async function initializeSkinListMenu() {
  const query = gql`
    query {
      modern_skins(first: 1000) {
        nodes {
          filename
          download_url
        }
      }
    }
  `;
  let bankskin1 = [];
  try {
    const response = await fetch("https://api.webampskins.org/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      mode: "cors",
      credentials: "include",
      body: JSON.stringify({query, variables: {}})
    });
    const data = await response.json();
    bankskin1 = data.data.modern_skins.nodes;
  } catch (e) {
    console.warn("faile to load skins from api.webampskins.org");
  }
  const select = document.createElement("select");
  select.style.position = "absolute";
  select.style.bottom = "0";
  select.style.width = "300px";
  const downloadLink = document.createElement("a");
  downloadLink.style.position = "absolute";
  downloadLink.style.bottom = "0";
  downloadLink.style.left = "320px";
  downloadLink.text = "Download";
  const current = getUrlQuery(window.location, "skin");
  const internalSkins = [
    {filename: "[Winamp] default", download_url: ""},
    {filename: "[Winamp] MMD3", download_url: "assets/skins/MMD3.wal"},
    {
      filename: "[Winamp] MMD3+Thinger",
      download_url: "assets/skins/MMD3+Thinger/"
    },
    {filename: "[Winamp] BigBento", download_url: "assets/skins/BigBento/"},
    {
      filename: "CornerAmp_Redux",
      download_url: "assets/skins/CornerAmp_Redux.wal"
    },
    {
      filename: "[Winamp Classic]",
      download_url: "assets/skins/base-2.91.wsz"
    },
    {
      filename: "[Winamp Classic] MacOSXAqua1-5",
      download_url: "assets/skins/MacOSXAqua1-5.698dd4ab.wsz"
    },
    {
      filename: "[Winamp Classic] Green-Dimension-V2",
      download_url: "assets/skins/Green-Dimension-V2.6f88d5c3.wsz"
    },
    {
      filename: "[wmp] Quicksilver WindowsMediaPlayer!",
      download_url: "assets/skins/Quicksilver.wmz"
    },
    {
      filename: "[wmp] Windows XP",
      download_url: "assets/skins/Windows-XP.wmz"
    },
    {
      filename: "[wmp] Famous Headspace",
      download_url: "assets/skins/Headspace.wmz"
    },
    {
      filename: "[wmp] Disney Mix Central",
      download_url: "assets/skins/DisneyMixCentral.wmz"
    },
    {
      filename: "[Audion Face] Smoothface 2",
      download_url: "assets/skins/Smoothface2.face"
    },
    {
      filename: "[Audion Face] Gizmo 2.0",
      download_url: "assets/skins/Gizmo2.0.face"
    },
    {
      filename: "[Audion Face] Tokyo Bay",
      download_url: "assets/skins/TokyoBay.face"
    },
    {
      filename: "[K-Jofol] Default",
      download_url: "assets/skins/Default.kjofol"
    },
    {
      filename: "[K-Jofol] Illusion 1.0",
      download_url: "assets/skins/Illusion1-0.kjofol"
    },
    {
      filename: "[K-Jofol] K-Nine 05r",
      download_url: "assets/skins/K-Nine05r.kjofol"
    },
    {
      filename: "[K-Jofol] Limus 2.0",
      download_url: "assets/skins/Limus2-0.zip"
    },
    {filename: "[Sonique] Default", download_url: "assets/skins/sonique.sgf"},
    {
      filename: "[Sonique] Scifi-Stories",
      download_url: "assets/skins/scifi-stories.sgf"
    },
    {
      filename: "[Sonique] Panthom (SkinBuilder)",
      download_url: "assets/skins/phantom.sgf"
    },
    {
      filename: "[Sonique] ChainZ and",
      download_url: "assets/skins/ChainZ-and.sgf"
    },
    {
      filename: "[JetAudio] Small Bar",
      download_url: "assets/skins/DefaultBar_s.jsk"
    },
    {
      filename: "[Cowon JetAudio] Gold",
      download_url: "assets/skins/Gold.uib"
    },
    {
      filename: "[AIMP] Flo-4K",
      download_url: "assets/skins/AIMP-Flo-4K.acs5"
    }
  ];
  const skins = [...internalSkins, ...bankskin1];
  for (const skin of skins) {
    const option = document.createElement("option");
    option.value = skin.download_url;
    option.textContent = skin.filename;
    if (current === skin.download_url) {
      option.selected = true;
      downloadLink.href = skin.download_url;
    }
    select.appendChild(option);
  }
  select.addEventListener("change", (e) => {
    const url = new URL(window.location.href);
    url.searchParams.set("skin", e.target.value);
    const title = e.target.text;
    const newPath = url.href.substring(url.origin.length);
    window.history.pushState({pageTitle: title}, title, newPath);
    changeSkinByUrl();
    downloadLink.href = e.target.value;
  });
  window.onpopstate = function(e) {
    if (e.state) {
      document.title = e.state.pageTitle;
    }
    changeSkinByUrl();
  };
  document.body.appendChild(select);
  document.body.appendChild(downloadLink);
}
main();
