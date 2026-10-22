const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const path = require("node:path");
const source = fs.readFileSync(path.join(__dirname, "story-content.js"), "utf8");
const content = vm.runInNewContext(source + "\nstoryContent");
const editorSource = fs.readFileSync(path.join(__dirname, "editor.js"), "utf8");
const elements = {}, storage = new Map();
function element(id) {
  return elements[id] ||= {
    value: "", textContent: "", handlers: {}, children: [],
    append(child) { this.children.push(child); },
    addEventListener(name, handler) { this.handlers[name] = handler; }
  };
}
const sandbox = vm.createContext({
  storyContent: content,
  document: { getElementById: element, createElement: () => ({}) },
  localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) }
});
vm.runInContext(editorSource, sandbox);
const run = expression => vm.runInContext(expression, sandbox);
assert.equal(elements.item.children.length, 13);
elements.label.value = "新的枕頭";
elements.title.value = '想說的「話」';
elements.body.value = "第一行\n第二行\n\n另一頁 <script> & \"引號\" \\\\";
elements.body.handlers.input();
assert.equal(elements["page-count"].textContent, "1 / 2");
elements.next.handlers.click();
assert.equal(elements["preview-body"].textContent, '另一頁 <script> & "引號" \\\\');
const exported = run("contentFile(draft)");
const reloaded = vm.runInNewContext(exported + "\nstoryContent");
assert.equal(reloaded["home.bed"].label, "新的枕頭");
assert.equal(reloaded["home.bed"].lines.length, 2);
assert(!exported.includes("<script>"), "Markup cannot become embedded script");
const restored = JSON.parse(storage.values().next().value);
assert.equal(restored.content["home.bed"].title, '想說的「話」');
elements.title.value = ""; elements.title.handlers.input();
assert.doesNotThrow(() => run("validateContent(draft, true)"), "Incomplete drafts survive");
assert.throws(() => run("contentFile(draft)"), "Export rejects missing title");
assert.throws(() => run("validateContent({})"), "Bad imports rejected");
assert.equal(JSON.stringify(run('splitPages("a\\r\\nb\\r\\n\\r\\nc")')), '["a\\nb","c"]');
console.log("PASS: 13 editable objects, paragraph preview, draft preservation, safe export round-trip, invalid import/export validation.");
