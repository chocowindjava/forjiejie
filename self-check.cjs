const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const html = fs.readFileSync(path.join(__dirname, "index.html"), "utf8");
const source = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, "IDs must be unique");
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(id), `Missing anchor ${id}`);
for (const [, file] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)) assert(fs.existsSync(path.join(__dirname, file)));
assert(!/(?:src|href)="https?:\/\//.test(html), "No external runtime assets");

function setup(audioSupported = true) {
  const elements = {};
  const handlers = {};
  let audio;
  const element = id => elements[id] ||= {
    textContent: "", attributes: {}, dataset: {}, events: {},
    classList: { add() {}, remove() {} },
    addEventListener(name, fn) { this.events[name] = fn; },
    setAttribute(name, value) { this.attributes[name] = value; }
  };
  const cats = ["kiro", "Kirin"].map(name => Object.assign(element(name), { dataset: { cat: name } }));
  class Audio {
    constructor(src) { this.src = src; this.paused = true; this.events = {}; audio = this; }
    async play() {
      if (this.blocked) { const error = new Error("Gesture required"); error.name = "NotAllowedError"; throw error; }
      if (!audioSupported) throw new Error("Playback failed");
      this.paused = false;
    }
    pause() { this.paused = true; }
    addEventListener(name, fn) { this.events[name] = fn; }
  }
  const document = { hidden: false, querySelectorAll: () => cats, getElementById: element, addEventListener: (name, fn) => handlers[name] = fn };
  vm.runInNewContext(source, {
    document, Audio, window: { addEventListener: (name, fn) => handlers[name] = fn },
    setTimeout: () => 1, clearTimeout() {}
  });
  return { elements, handlers, audio, document };
}
(async () => {
  const env = setup();
  for (const name of ["kiro", "Kirin"]) {
    const seen = new Set();
    for (let i = 0; i < 4; i++) {
      env.elements[name].events.click();
      seen.add(env.elements[`${name}-story`].textContent);
    }
    assert.equal(seen.size, 4, `${name} has four distinct memories`);
    env.elements[name].events.click();
    assert(seen.has(env.elements[`${name}-story`].textContent), "Stories wrap");
  }
  const music = env.elements.music;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(music.attributes["aria-pressed"], "true");
  assert.equal(env.audio.paused, false);
  assert.equal(env.audio.volume, 0.15);
  assert.equal(env.audio.loop, true);
  assert(fs.existsSync(path.join(__dirname, env.audio.src)));
  await music.events.click();
  assert.equal(music.attributes["aria-pressed"], "false");
  assert.equal(env.audio.paused, true);
  await music.events.click();
  env.document.hidden = true;
  env.handlers.visibilitychange();
  assert.equal(env.audio.paused, true);
  assert.equal(music.attributes["aria-pressed"], "false");
  env.document.hidden = false;
  const pending = music.events.click();
  env.handlers.pagehide();
  await pending;
  assert.equal(env.audio.paused, true, "Pending play cannot restart after leaving");
  assert.equal(music.attributes["aria-pressed"], "false");
  env.audio.events.error();
  assert(env.elements["audio-status"].textContent.includes("無法播放"));
  const unsupported = setup(false);
  await new Promise(resolve => setImmediate(resolve));
  await unsupported.elements.music.events.click();
  assert(unsupported.elements["audio-status"].textContent.includes("無法播放"));
  assert.equal(unsupported.elements.music.disabled, false);
  const blocked = setup();
  await new Promise(resolve => setImmediate(resolve));
  await blocked.elements.music.events.click();
  blocked.audio.blocked = true;
  await blocked.elements.music.events.click();
  assert(blocked.elements["audio-status"].textContent.includes("按鍵"));
  blocked.audio.blocked = false;
  await blocked.handlers.click({ target: {} });
  assert.equal(blocked.audio.paused, false, "Gesture retries blocked playback");
  await blocked.elements.music.events.click();
  await blocked.handlers.keydown({ target: {} });
  assert.equal(blocked.audio.paused, true, "Manual off stays off after gestures");
  console.log("PASS: local assets, anchors, cat story cycles, audio on/off, hidden-page stop, audio fallback.");
})().catch(error => { console.error(error); process.exitCode = 1; });
