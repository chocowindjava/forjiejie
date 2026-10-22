const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const world = require("./game-world.js");
const start = { x: 450, y: 350 };
const right = world.move(start, { x: 1, y: 0 }, 0.02, []);
const diagonal = world.move(start, { x: 1, y: 1 }, 0.02, []);
assert(Math.abs(Math.hypot(diagonal.x - start.x, diagonal.y - start.y) - (right.x - start.x)) < 1e-9, "No faster diagonal movement");
assert.deepEqual(world.vector(0.05, 0, 0.12), { x: 0, y: 0 }, "Joystick dead zone");
assert.equal(Math.hypot(...Object.values(world.vector(3, 4))), 1, "Joystick stays in circular range");
assert.deepEqual(world.move(start, { x: 0, y: 0 }, 0.04, []), start, "Release stops movement");
assert.equal(world.move({ x: 929, y: 350 }, { x: 1, y: 0 }, 0.04, []).x, 929, "World boundary");
const obstacles = [{ x: 470, y: 300, w: 100, h: 100 }];
assert.equal(world.move(start, { x: 1, y: 0 }, 1, obstacles).x, start.x, "Cannot cross furniture even after delayed frame");
const sliding = world.move(start, { x: 1, y: 1 }, 0.04, obstacles);
assert.equal(sliding.x, start.x); assert(sliding.y > start.y, "Slide along furniture");
assert.equal(world.move(start, { x: 1, y: 0 }, 30, []).x, start.x + 7.2, "Frame delta is bounded");
assert.equal(world.nearest(start, [{ x: 900, y: 350 }]), null, "Cannot interact at distance");
assert.equal(world.nearest(start, [{ x: 520, y: 350, label: "far" }, { x: 460, y: 350, label: "near" }]).label, "near");
for (const file of ["game.html", "index.html"]) {
  const html = fs.readFileSync(path.join(__dirname, file), "utf8");
  for (const [, resource] of html.matchAll(/(?:src|href)="\.\/([^"#]+)(?:#[^"]*)?"/g))
    assert(fs.existsSync(path.join(__dirname, resource)), `Missing ${resource}`);
}
console.log("PASS: joystick vectors, release, diagonal speed, boundaries, furniture collision, frame cap, interaction distance, both entry points.");

// Exercise actual input handlers without needing a browser installation.
const vm = require("node:vm");
const elements = {};
function element(id) {
  return elements[id] ||= {
    style: {}, dataset: {}, children: [], handlers: {}, captures: new Set(), open: false,
    classList: { toggle() {} },
    addEventListener(name, fn) { this.handlers[name] = fn; },
    setAttribute() {}, focus() {}, getContext() { return {}; },
    replaceChildren() { this.children = []; }, append(child) { this.children.push(child); },
    getBoundingClientRect() { return { left: 0, top: 0, width: 100, height: 100 }; },
    setPointerCapture(id) { this.captures.add(id); },
    hasPointerCapture(id) { return this.captures.has(id); },
    releasePointerCapture(id) { this.captures.delete(id); },
    showModal() { this.open = true; }, close() { this.open = false; this.handlers.close?.(); }
  };
}
const winHandlers = {}, docHandlers = {};
const sandbox = vm.createContext({
  GameWorld: world, console, storyContent: vm.runInNewContext(fs.readFileSync(path.join(__dirname, "story-content.js"), "utf8") + "\nstoryContent"), letterLines: ["這封信還沒寫好。"],
  document: {
    getElementById: element, querySelectorAll: () => [],
    createElement: () => element(`button-${Object.keys(elements).length}`),
    addEventListener(name, fn) { docHandlers[name] = fn; }
  },
  window: { addEventListener(name, fn) { winHandlers[name] = fn; } },
  requestAnimationFrame() {}
});
vm.runInContext(fs.readFileSync(path.join(__dirname, "game.js"), "utf8"), sandbox);
const read = expression => vm.runInContext(expression, sandbox);
const joystick = elements.joystick;
const pointer = id => ({ pointerId: id, button: 0, clientX: 80, clientY: 50, preventDefault() {} });
for (const end of ["pointerup", "pointercancel", "lostpointercapture"]) {
  joystick.handlers.pointerdown(pointer(1));
  assert(read("axis.x") > 0, "Drag drives movement");
  joystick.handlers[end](pointer(1));
  assert.equal(read("axis.x"), 0, `${end} stops movement`);
  assert.equal(read("pointerId"), null, `${end} resets pointer`);
}
joystick.handlers.pointerdown(pointer(2));
joystick.handlers.pointerdown(pointer(3));
assert.equal(read("pointerId"), 2, "Second touch must not steal control");
winHandlers.blur();
assert.equal(read("axis.x"), 0, "Window blur stops movement");
joystick.handlers.pointerdown(pointer(4));
docHandlers.visibilitychange();
assert.equal(read("axis.x"), 0, "Background stops movement");
joystick.handlers.pointerdown(pointer(5));
read('openStory({title:"test",lines:["one","two"]})');
assert.equal(read("axis.x"), 0, "Opening a story releases joystick");
joystick.handlers.pointerdown(pointer(6));
assert.equal(read("pointerId"), null, "Dialog blocks movement input");
elements["next-story"].handlers.click();
assert.equal(elements["story-text"].textContent, "two");
elements["next-story"].handlers.click();
assert.equal(elements.story.open, false);
read('chooseScene("park")');
assert.equal(elements.interact.disabled, true, "Scene switch clears stale interaction");
assert.equal(elements["place-name"].textContent, "成大光復門對面的小路");
console.log("PASS: pointer release/cancel/capture-loss, multi-touch, blur, background, dialog pause/pages, scene reset.");
const letterSource = fs.readFileSync(path.join(__dirname, "letter.js"), "utf8");
for (const paragraphs of [[], ["姐姐，", "我想自己說。\n<這是文字>"]]) {
  const rendered = [];
  const letterScope = vm.createContext({
    storyContent: {"home.letter": {lines: paragraphs}},
    document: {
      getElementById: () => ({ replaceChildren(...children) { rendered.push(...children); } }),
      createElement: () => ({ style: {} })
    }
  });
  vm.runInContext(letterSource, letterScope);
  const expected = paragraphs.length ? paragraphs : ["這封信還沒寫好。"];
  assert.deepEqual(rendered.map(p => p.textContent), expected, "Letter renders author paragraphs as plain text");
  assert.deepEqual(JSON.parse(vm.runInContext("JSON.stringify(letterLines)", letterScope)), expected, "Game uses the same letter");
}
assert(!htmlContainsOldMeeting());
function htmlContainsOldMeeting() {
  return ["index.html", "game.html", "game.js"].some(file => fs.readFileSync(path.join(__dirname, file), "utf8").includes("林默娘"));
}
console.log("PASS: shared letter placeholder/authored text, corrected meeting location.");
read('chooseScene("walk"); openStory(scene.items.find(item => item.icon === "ticket"))');
assert.equal(elements["story-title"].textContent, "噗噗噗，跑去找姐姐");
assert.match(elements["story-text"].textContent, /騎腳踏車去火車站/);
elements["next-story"].handlers.click();
assert.match(elements["story-text"].textContent, /網咖/);
console.log("PASS: birthday ticket opens shared story and advances to the next page.");
read('chooseScene("home"); openStory(scene.items[0])');
assert.equal(elements['story-photos'].hidden, false);
assert.equal(elements['photo-count'].textContent, '1 / 3');
const firstPhoto = elements['story-photo'].src;
elements['next-photo'].handlers.click();
assert.notEqual(elements['story-photo'].src, firstPhoto);
assert.equal(read('page'), 0, 'Photos do not advance story');
elements['previous-photo'].handlers.click();
assert.equal(elements['story-photo'].src, firstPhoto);
elements['previous-photo'].handlers.click();
assert.equal(elements['photo-count'].textContent, '3 / 3');
read('openStory(scene.items[1])');
assert.equal(elements['story-photos'].hidden, true);
elements.pet.handlers.click();
assert.equal(elements['photo-count'].textContent, '1 / 4');
for (const photo of JSON.parse(read('JSON.stringify(Object.values(catPhotos).flat())'))) {
  assert(fs.existsSync(path.join(__dirname, photo.src)), photo.src);
  assert(photo.alt.length > 0);
}
console.log('PASS: cat photo navigation, wraparound, independent story pages, reset/hide, local image paths.');
