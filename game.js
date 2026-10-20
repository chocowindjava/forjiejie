"use strict";
const scenes = {
  home: {
    name: "小貓的家", mood: "陽光、小毯子，還有兩隻貓。", start: { x: 480, y: 365 },
    obstacles: [{ x: 70, y: 130, w: 205, h: 150 }, { x: 675, y: 120, w: 190, h: 95 }, { x: 682, y: 367, w: 150, h: 90 }],
    items: [
      { x: 180, y: 320, icon: "bed", ...storyContent["home.bed"] },
      { x: 770, y: 267, icon: "letter", ...storyContent["home.letter"], lines: letterLines },
      { x: 585, y: 175, icon: "star", ...storyContent["home.star"] },
      { x: 758, y: 505, icon: "care", ...storyContent["home.care"] },
      { x: 135, y: 490, icon: "bowl", ...storyContent["home.bowl"] },
    ]
  },
  park: {
    name: "成大光復門對面的小路", mood: "從第一次見面的地方，走一小段。", start: { x: 480, y: 485 },
    obstacles: [{ x: 160, y: 225, w: 180, h: 70 }, { x: 645, y: 195, w: 155, h: 100 }],
    items: [
      { x: 245, y: 340, icon: "bench", ...storyContent["park.bench"] },
      { x: 725, y: 340, icon: "car", ...storyContent["park.car"] },
      { x: 475, y: 160, icon: "flower", ...storyContent["park.flower"] },
    ]
  },
  walk: {
    name: "車站旁的小路", mood: "天色暗了，慢慢走就好。", start: { x: 475, y: 490 },
    obstacles: [{ x: 170, y: 200, w: 170, h: 70 }, { x: 670, y: 320, w: 100, h: 80 }],
    items: [
      { x: 255, y: 318, icon: "bench", ...storyContent["walk.bench"] },
      { x: 520, y: 155, icon: "lamp", ...storyContent["walk.lamp"] },
      { x: 325, y: 450, icon: "ticket", ...storyContent["walk.birthday"] },
      { x: 735, y: 450, icon: "phone", ...storyContent["walk.phone"] },
    ]
  }
};
const stage = document.getElementById("stage");
const canvas = document.getElementById("world");
const ctx = canvas.getContext("2d");
const objectLayer = document.getElementById("objects");
const dialog = document.getElementById("story");
const interact = document.getElementById("interact");
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const keys = new Set();
let sceneId = "home", scene = scenes.home, player = { ...scene.start };
let follower = { x: 420, y: 398 }, trail = [{ ...follower }, { ...player }];
let axis = { x: 0, y: 0 }, pointerId = null, nearby = null, target = null;
let view = { scale: 1, x: 0, y: 0, w: 960, h: 600 };
let activeStory, page = 0, returnFocus, lastTime = 0, walking = false, facing = 1;

function clearInput() {
  keys.clear(); axis = { x: 0, y: 0 }; target = null;
  if (pointerId !== null && joystick.hasPointerCapture(pointerId)) joystick.releasePointerCapture(pointerId);
  pointerId = null; stick.style.transform = "";
}
function openStory(item) {
  clearInput();
  returnFocus = document.activeElement;
  activeStory = { ...item, lines: item.lines.length ? item.lines : ["這段回憶還沒寫好。"] }; page = 0;
  document.getElementById("story-place").textContent = scene.name;
  document.getElementById("story-title").textContent = item.title;
  showPage();
  dialog.showModal();
  document.getElementById("next-story").focus();
}
function showPage() {
  document.getElementById("story-text").textContent = activeStory.lines[page];
  document.getElementById("story-page").textContent = `${page + 1} / ${activeStory.lines.length}`;
  document.getElementById("next-story").textContent = page === activeStory.lines.length - 1 ? "繼續散步" : "繼續讀";
}
document.getElementById("next-story").addEventListener("click", () => {
  if (++page >= activeStory.lines.length) dialog.close(); else showPage();
});
document.getElementById("close-story").addEventListener("click", () => dialog.close());
dialog.addEventListener("close", () => { clearInput(); if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true }); });
interact.addEventListener("click", () => { if (nearby) openStory(nearby); });
document.getElementById("pet").addEventListener("click", () => openStory(storyContent.pet));
document.getElementById("pet").textContent = `♡ ${storyContent.pet.label}`;
document.getElementById("help").addEventListener("click", () => openStory({ title: "跟著小貓，慢慢走", lines: ["電腦：方向鍵或 WASD 移動，靠近物件按空白鍵。\n手機：拖曳左下方向桿，放開就停；靠近時按右邊的互動按鈕。", "也可以直接點場景上的物件名稱，kiro 會走過去。\n上方可以自由切換地點，桌上的信從一開始就能讀。", "遇到對話，按「繼續讀」翻頁，或按右上角 ×／Escape 離開。\n沒有收集進度，也沒有必須完成的任務。"] }));
function chooseScene(id) {
  clearInput(); sceneId = id; scene = scenes[id]; player = { ...scene.start };
  follower = { x: player.x - 60, y: player.y + 25 };
  trail = [{ ...follower }, { ...player }]; nearby = null; interact.dataset.ready = "";
  interact.disabled = true; interact.textContent = "靠近看看";
  document.getElementById("nearby").textContent = "靠近小物件，發現一段日常。";
  document.getElementById("place-name").textContent = scene.name;
  document.getElementById("place-mood").textContent = scene.mood;
  document.querySelectorAll("[data-scene]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.scene === id)));
  objectLayer.replaceChildren();
  for (const item of scene.items) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "object"; button.textContent = item.label;
    button.setAttribute("aria-label", `前往${item.label}`);
    button.addEventListener("click", () => {
      if (Math.hypot(player.x - item.x, player.y - item.y) < 112) openStory(item);
      else { clearInput(); target = item; stage.focus({ preventScroll: true }); }
    });
    objectLayer.append(button);
  }
}
document.querySelectorAll("[data-scene]").forEach(button => button.addEventListener("click", () => chooseScene(button.dataset.scene)));
const movementKeys = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"];
window.addEventListener("keydown", event => {
  if (dialog.open || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (movementKeys.includes(key)) {
    event.preventDefault(); keys.add(key); target = null;
  } else if (event.code === "Space" && !event.repeat && event.target.tagName !== "BUTTON" && event.target.tagName !== "A") {
    event.preventDefault(); if (nearby) openStory(nearby);
  }
});
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));
window.addEventListener("blur", clearInput);
document.addEventListener("visibilitychange", clearInput);
function updateStick(event) {
  const rect = joystick.getBoundingClientRect();
  axis = GameWorld.vector((event.clientX - rect.left - rect.width / 2) / 31, (event.clientY - rect.top - rect.height / 2) / 31, 0.12);
  stick.style.transform = `translate(${axis.x * 31}px, ${axis.y * 31}px)`;
}
joystick.addEventListener("pointerdown", event => {
  if (pointerId !== null || dialog.open || event.button !== 0) return;
  event.preventDefault(); pointerId = event.pointerId; target = null; keys.clear();
  joystick.setPointerCapture(pointerId); updateStick(event);
});
joystick.addEventListener("pointermove", event => { if (event.pointerId === pointerId) updateStick(event); });
for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
  joystick.addEventListener(type, event => { if (event.pointerId === pointerId) clearInput(); });
}

function shape(x, y, w, h, color, radius = 12) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x, y, w, h, radius); ctx.fill();
}
function ellipse(x, y, rx, ry, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
}
function line(points, color, width = 3) {
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = "round"; ctx.beginPath();
  points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke();
}
function tree(x, y, night) {
  shape(x - 9, y, 18, 57, night ? "#777362" : "#a58f6b", 4);
  ellipse(x, y - 28, 51, 51, night ? "#6e806f" : "#a0b58b");
  ellipse(x - 28, y - 3, 35, 33, night ? "#718574" : "#acbf94");
  ellipse(x + 28, y - 3, 34, 36, night ? "#7e9078" : "#b3c297");
}
function drawRoom() {
  shape(0, 0, 960, 600, "#e7d5b6", 0);
  for (let y = 130; y < 600; y += 65) line([[0, y], [960, y]], "#d8c29f", 2);
  shape(0, 0, 960, 104, "#f0e6d2", 0); shape(0, 94, 960, 12, "#c8af88", 0);
  shape(350, 10, 175, 76, "#b4cabd", 5);
  line([[438, 12], [438, 85]], "#fff5db", 7); line([[350, 47], [525, 47]], "#fff5db", 6);
  shape(67, 127, 211, 155, "#a89276", 15); shape(76, 138, 194, 132, "#acb9c4", 12);
  shape(91, 145, 76, 43, "#e8e4d7", 10); shape(179, 145, 76, 43, "#e8e4d7", 10);
  for (let x = 96; x < 260; x += 38) ellipse(x, 224, 6, 6, "#e2c8c0");
  ellipse(461, 380, 149, 94, "#c0c4a6"); ellipse(461, 380, 129, 77, "#cbd0b4");
  shape(675, 120, 190, 95, "#b0906c"); shape(684, 125, 172, 70, "#c9ad87");
  shape(744, 143, 48, 32, "#fff9e4", 2); line([[744, 143], [768, 162], [792, 143]], "#bc9d89", 2);
  shape(682, 367, 150, 90, "#b99e7e"); shape(714, 377, 27, 43, "#d9b4af", 4);
  shape(752, 387, 26, 34, "#eef0d7", 5); shape(718, 372, 18, 8, "#987e70", 2);
  ellipse(127, 432, 41, 19, "#bda385"); ellipse(127, 427, 35, 12, "#f9edcf"); ellipse(127, 427, 23, 7, "#af835d");
  ctx.save(); ctx.translate(583, 116); ctx.fillStyle = "#e8c66c"; ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 18 : 37; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
  ellipse(574, 116, 2.5, 6, "#8e784d"); ellipse(591, 116, 2.5, 6, "#8e784d");
  shape(347, 555, 175, 45, "#bb967d", 5);
}
function drawOutside(night) {
  shape(0, 0, 960, 600, night ? "#9ba997" : "#c5d3ae", 0);
  shape(0, 0, 960, 78, night ? "#657684" : "#bcd5ce", 0);
  for (let x = 20; x < 940; x += 78) line([[x, 31], [x + 32, 31]], night ? "#91a5ad" : "#dce9d8", 2);
  line([[480, 600], [455, 450], [495, 290], [465, 110]], night ? "#c3bfa5" : "#e9dfbf", 102);
  line([[220, 290], [450, 340], [730, 280]], night ? "#bdbca0" : "#e9dfbf", 73);
  [[63, 155], [884, 118], [68, 448], [879, 481], [356, 96], [624, 513]].forEach(([x, y]) => tree(x, y, night));
  for (let i = 0; i < 30; i++) {
    const x = (i * 137 + 85) % 920 + 20, y = (i * 79) % 450 + 115;
    if (x > 380 && x < 575) continue;
    line([[x, y], [x + 3, y - 7], [x + 7, y]], night ? "#829776" : "#a5ba8e", 2);
    if (i % 4 === 0) ellipse(x + 3, y - 9, 4, 4, night ? "#d6c899" : "#f9e8be");
  }
  const bench = scene.obstacles[0];
  shape(bench.x, bench.y, bench.w, bench.h, "#a48c6d", 7);
  for (let y = bench.y + 10; y < bench.y + bench.h; y += 17) line([[bench.x + 9, y], [bench.x + bench.w - 9, y]], "#c6ae85", 8);
  if (!night) {
    shape(645, 195, 155, 100, "#c9a39b", 24); shape(672, 207, 101, 42, "#afc4be", 13);
    shape(638, 215, 12, 25, "#777065", 4); shape(795, 215, 12, 25, "#777065", 4);
    shape(668, 281, 28, 7, "#f3dfbb", 3); shape(751, 281, 28, 7, "#f3dfbb", 3);
  } else {
    shape(517, 91, 6, 46, "#685f53", 2); ellipse(520, 92, 18, 16, "#fae5a4");
    ellipse(520, 115, 43, 25, "#eedcab55");
    shape(670, 320, 100, 80, "#b3997c", 8); shape(701, 338, 28, 42, "#686d65", 5);
    shape(705, 342, 20, 28, "#adb9ad", 2);
  }
}
function cat(p, white, time) {
  const bob = walking && !matchMedia("(prefers-reduced-motion: reduce)").matches ? Math.sin(time / 95) * 2 : 0;
  const x = p.x, y = p.y + bob, fur = white ? "#fffaf0" : "#dba063", border = white ? "#b3ab9a" : "#af8153";
  ellipse(x, y + 13, 23, 10, "#5e624126");
  line([[x - 15 * facing, y + 3], [x - 32 * facing, y - 1], [x - 33 * facing, y - 17]], border, 9);
  ellipse(x, y, white ? 23 : 21, 26, fur); ellipse(x, y + 7, 12, 17, "#fffaf0");
  ctx.fillStyle = fur; ctx.strokeStyle = border; ctx.lineWidth = 1.5; ctx.beginPath();
  ctx.moveTo(x - 23, y - 23); ctx.lineTo(x - 25, y - 47); ctx.lineTo(x - 8, y - 35);
  ctx.quadraticCurveTo(x, y - 38, x + 8, y - 35); ctx.lineTo(x + 25, y - 47); ctx.lineTo(x + 23, y - 23);
  ctx.bezierCurveTo(x + 31, y + 2, x - 31, y + 2, x - 23, y - 23); ctx.fill(); ctx.stroke();
  line([[x - 19, y - 37], [x - 18, y - 29]], "#e2b2a6", 5);
  line([[x + 19, y - 37], [x + 18, y - 29]], "#e2b2a6", 5);
  if (!white) { ctx.fillStyle = "#fffaf0"; ctx.beginPath(); ctx.moveTo(x, y - 31); ctx.lineTo(x - 11, y - 9); ctx.quadraticCurveTo(x, y, x + 11, y - 9); ctx.closePath(); ctx.fill(); }
  ellipse(x - 11, y - 20, 2.5, 3.5, "#596052"); ellipse(x + 11, y - 20, 2.5, 3.5, "#596052");
  ellipse(x, y - 12, 3, 2, "#c8898c"); line([[x, y - 10], [x - 3, y - 7]], "#8c7666", 1);
  ellipse(x - 10, y + 20, 9, 5, "#fffaf0"); ellipse(x + 10, y + 20, 9, 5, "#fffaf0");
}
function draw(time) {
  const rect = stage.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(rect.width * ratio) || canvas.height !== Math.round(rect.height * ratio)) {
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
  }
  view.scale = Math.max(rect.width / 960, rect.height / 600);
  view.w = rect.width / view.scale; view.h = rect.height / view.scale;
  view.x = Math.max(0, Math.min(960 - view.w, player.x - view.w / 2));
  view.y = Math.max(0, Math.min(600 - view.h, player.y - view.h / 2));
  ctx.setTransform(ratio * view.scale, 0, 0, ratio * view.scale, -view.x * ratio * view.scale, -view.y * ratio * view.scale);
  if (sceneId === "home") drawRoom(); else drawOutside(sceneId === "walk");
  [{ p: player, white: false }, { p: follower, white: true }].sort((a, b) => a.p.y - b.p.y).forEach(c => cat(c.p, c.white, time));
  scene.items.forEach((item, index) => {
    const button = objectLayer.children[index];
    const x = (item.x - view.x) * view.scale, y = (item.y - view.y) * view.scale;
    button.style.left = `${x}px`; button.style.top = `${y}px`;
    button.hidden = x < 35 || x > rect.width - 35 || y < 22 || y > rect.height - 22;
    button.classList.toggle("near", nearby === item);
  });
  for (const [id, point] of [["kiro-tag", player], ["kirin-tag", follower]]) {
    const tag = document.getElementById(id);
    tag.style.left = `${(point.x - view.x) * view.scale}px`;
    tag.style.top = `${(point.y + 38 - view.y) * view.scale}px`;
  }
}
function frame(time) {
  const dt = Math.min((time - lastTime) / 1000 || 0, 0.04); lastTime = time;
  walking = false;
  if (!dialog.open && !document.hidden) {
    let input = { x: axis.x + Number(keys.has("arrowright") || keys.has("d")) - Number(keys.has("arrowleft") || keys.has("a")),
      y: axis.y + Number(keys.has("arrowdown") || keys.has("s")) - Number(keys.has("arrowup") || keys.has("w")) };
    if (target) {
      const dx = target.x - player.x, dy = target.y - player.y;
      if (Math.hypot(dx, dy) < 45) { const arrived = target; target = null; openStory(arrived); }
      else input = GameWorld.vector(dx, dy);
    }
    if (!dialog.open) {
      const next = GameWorld.move(player, input, dt, scene.obstacles);
      walking = Math.hypot(next.x - player.x, next.y - player.y) > 0.01;
      if (input.x) facing = Math.sign(input.x);
      if (walking) {
        player = next; trail.push({ ...player });
        let length = 0, cut = 0;
        for (let i = trail.length - 1; i > 0; i--) {
          length += Math.hypot(trail[i].x - trail[i - 1].x, trail[i].y - trail[i - 1].y);
          if (length >= 62) { follower = { ...trail[i - 1] }; cut = i - 1; break; }
        }
        if (cut) trail.splice(0, cut);
      } else if (target) {
        // shortcut: direct walking only; on an obstacle, let the visitor steer around it.
        target = null; document.getElementById("nearby").textContent = "前面有家具，試著用方向桿繞一下。";
      }
      const nextNearby = GameWorld.nearest(player, scene.items);
      if (nextNearby !== nearby || !interact.dataset.ready) {
        nearby = nextNearby; interact.dataset.ready = "true"; interact.disabled = !nearby;
        interact.textContent = nearby ? `看看${nearby.label}` : "靠近看看";
        document.getElementById("nearby").textContent = nearby ? `發現了：${nearby.label}` : "靠近小物件，發現一段日常。";
      }
    }
  }
  draw(time); requestAnimationFrame(frame);
}
chooseScene("home");
requestAnimationFrame(frame);
