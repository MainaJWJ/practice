import {Edges} from "./skin/Clippath.js";
document.getElementById("clickable").onclick = (ev) => {
  alert("click on green!");
};
document.getElementById("img1").onclick = (event) => {
  alert("click on IMAGE.");
  event.stopPropagation();
};
const GRIDSIZE = 4;
const SCALE = 30;
function prepareGrid() {
  const grid = document.getElementById("grid");
  const polygon = document.getElementById("polygon");
  grid.style.width = `${GRIDSIZE * SCALE}px`;
  grid.style.height = `${GRIDSIZE * SCALE}px`;
  grid.style.setProperty("--cell-size", `${SCALE + 1}px`);
  const img = document.getElementById("result");
  const zoom = document.getElementById("zoom");
  zoom.style.transform = `scale(${SCALE})`;
  const border = document.getElementById("border");
  border.style.width = `${GRIDSIZE * SCALE}px`;
  border.style.height = `${GRIDSIZE * SCALE}px`;
  const canvas = document.getElementById("working");
  canvas.width = GRIDSIZE;
  canvas.height = GRIDSIZE;
  canvas.setAttribute("width", String(GRIDSIZE));
  canvas.setAttribute("height", String(GRIDSIZE));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ff00ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  const dot = document.getElementById("dot");
  const coordinateHover = (e) => {
    const el = e.target;
    const [ax, ay] = el.textContent.split(",").map((v) => parseInt(v));
    dot.style.left = `${ax * SCALE}px`;
    dot.style.top = `${ay * SCALE}px`;
  };
  const toggleCell = (e) => {
    const el = e.target;
    var color;
    if (el.classList.contains("black")) {
      el.classList.remove("black");
      color = [255, 0, 255];
    } else {
      el.classList.add("black");
      color = [0, 0, 0];
    }
    const id = parseInt(el.getAttribute("id"));
    const x = id % GRIDSIZE;
    const y = Math.floor(id / GRIDSIZE);
    const idata = ctx.createImageData(1, 1);
    const data = idata.data;
    data[0] = color[0];
    data[1] = color[1];
    data[2] = color[2];
    data[3] = 255;
    ctx.putImageData(idata, x, y);
    img.setAttribute("src", canvas.toDataURL());
    const showCoordinates = (el2, data2) => {
      const El = document.getElementById(el2);
      El.textContent = "";
      const rows = data2.replace(/px/gi, "").replace(/\,\s/gi, "\n").replace(/\ /g, ", ").split("\n");
      for (const row of rows) {
        const div = document.createElement("div");
        div.textContent = row;
        div.addEventListener("mousemove", coordinateHover);
        El.appendChild(div);
      }
    };
    const edge = new Edges();
    edge.parseCanvasTransparencyByColor(canvas, "#ff00ff");
    showCoordinates("top", edge.gettop());
    showCoordinates("right", edge.getright());
    showCoordinates("bottom", edge.getbottom());
    showCoordinates("left", edge.getleft());
    showCoordinates("polygon", edge.getPolygon());
    zoom.style.clipPath = edge.getPolygon();
  };
  for (var i = 0; i < GRIDSIZE * GRIDSIZE; i++) {
    const div = document.createElement("div");
    div.setAttribute("id", `${i}`);
    div.addEventListener("click", toggleCell);
    grid.appendChild(div);
    const x = i % GRIDSIZE;
    const y = Math.floor(i / GRIDSIZE);
    if (x == 0 && y == 0) {
      div.classList.add("x-0-axis");
      div.style.setProperty("--0-axis", `'0'`);
    }
    if (y == 0) {
      div.textContent = String(x);
      div.classList.add("x-axis");
      div.style.setProperty("--x-axis", `'${x + 1}'`);
    }
    if (x == 0) {
      div.textContent = String(y);
      div.classList.add("y-axis");
      div.style.setProperty("--y-axis", `'${y}'`);
      if (y == GRIDSIZE - 1) {
        div.classList.add("y-axis-z");
        div.style.setProperty("--y-axis-z", `'${y + 1}'`);
      }
    }
    if (i < GRIDSIZE * GRIDSIZE / 2) {
      div.classList.add("black");
    }
  }
  toggleCell({target: document.getElementById("4")});
}
function prepareDrop() {
  const dropBox = document.getElementById("drop-box");
  const cropped = document.getElementById("cropped");
  const polygon = document.getElementById("polygon");
  const canvas = document.getElementById("tracing");
  var image = document.getElementById("drop-preview");
  function highlight(e) {
    e.preventDefault();
    dropBox.classList.add("highlight");
  }
  function unhighlight(e) {
    dropBox.classList.remove("highlight");
  }
  dropBox.addEventListener("dragover", highlight, false);
  dropBox.addEventListener("dragleave", unhighlight, false);
  function handleDrop(e) {
    e.preventDefault();
    let dt = e.dataTransfer;
    let files = dt.files;
    handleFile(files[0]);
  }
  dropBox.addEventListener("drop", handleDrop);
  function handleFile(file) {
    if (file.type === "image" || file.type.startsWith("image")) {
      image.onload = imgLoaded;
      const url = URL.createObjectURL(file);
      image.setAttribute("src", url);
    }
  }
  function imgLoaded() {
    console.log("img Loaded!");
    canvas.width = image.width;
    canvas.height = image.width;
    canvas.setAttribute("width", image.width.toString());
    canvas.setAttribute("height", image.height.toString());
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const showCoordinates = (el, data) => {
      const El = document.getElementById(el);
      El.textContent = "";
      const rows = data.replace(/px/gi, "").replace(/\,\s/gi, "\n").replace(/\ /g, ", ").split("\n");
      for (const row of rows) {
        const div = document.createElement("div");
        div.textContent = row;
        div.addEventListener("mousemove", coordinateHover);
        El.appendChild(div);
      }
    };
    const edge = new Edges();
    edge.parseCanvasTransparency(canvas, image.width, image.height);
    cropped.style.clipPath = edge.getPolygon();
    showCoordinates("top", edge.gettop());
    showCoordinates("right", edge.getright());
    showCoordinates("bottom", edge.getbottom());
    showCoordinates("left", edge.getleft());
    showCoordinates("polygon", edge.getPolygon());
  }
  const dot = document.getElementById("dot2");
  const coordinateHover = (e) => {
    const el = e.target;
    const [ax, ay] = el.textContent.split(",").map((v) => parseInt(v));
    dot.style.left = `${ax}px`;
    dot.style.top = `${ay}px`;
  };
}
function main() {
  prepareGrid();
  prepareDrop();
  return;
  const oriImg = document.getElementById("img1");
  const preferedWidth = parseInt(oriImg.getAttribute("data-width"));
  const preferedHeight = parseInt(oriImg.getAttribute("data-height"));
  const img2 = new Image();
  img2.onload = (ev) => {
    const canvas = document.getElementById("canvas");
    canvas.width = img2.width;
    canvas.height = img2.height;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img2, 0, 0);
    const edge = new Edges();
    edge.parseCanvasTransparency(canvas, preferedWidth, preferedHeight);
    document.getElementById("top").textContent = edge.gettop().replace(/px/gi, "").replace(/\,\s/gi, "\n");
    document.getElementById("right").textContent = edge.getright().replace(/px/gi, "").replace(/\,\s/gi, "\n");
    document.getElementById("bottom").textContent = edge.getbottom().replace(/px/gi, "").replace(/\,\s/gi, "\n");
    document.getElementById("left").textContent = edge.getleft().replace(/px/gi, "").replace(/\,\s/gi, "\n");
    document.getElementById("app").style.clipPath = edge.getPolygon();
  };
  img2.setAttribute("src", oriImg.getAttribute("src"));
}
main();
