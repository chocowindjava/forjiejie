"use strict";
const draftKey = "little-days-story-draft-v1";
const sourceText = JSON.stringify(storyContent);
const itemNames = {
  "home.bed": "小貓的家 · 姐姐的枕頭", "home.letter": "小貓的家 · 桌上的信",
  "home.star": "小貓的家 · 星星背包", "home.care": "小貓的家 · 保養品",
  "home.bowl": "小貓的家 · 胖胖熊的角落", "park.bench": "初次見面 · 小路",
  "park.car": "初次見面 · 路邊的車", "park.flower": "初次見面 · 聽聽風",
  "walk.bench": "車站旁 · 公園長椅", "walk.lamp": "車站旁 · 小路的燈",
  "walk.birthday": "車站旁 · 生日那天的車票",
  "walk.phone": "車站旁 · 放下手機", pet: "摸摸胖胖熊"
};
function validateContent(value, allowEmpty = false) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).length !== Object.keys(storyContent).length) throw new Error("備份的物件數量不符。");
  for (const key of Object.keys(storyContent)) {
    const entry = value[key];
    if (!entry || typeof entry.label !== "string" || (!allowEmpty && !entry.label.trim()) || entry.label.length > 40 ||
        typeof entry.title !== "string" || (!allowEmpty && !entry.title.trim()) || entry.title.length > 120 ||
        !Array.isArray(entry.lines) || entry.lines.length > 300 ||
        entry.lines.some(line => typeof line !== "string" || line.length > 30000)) throw new Error("備份格式或文字長度不符。");
  }
  return value;
}
function splitPages(text) {
  return text.replace(/\r\n?/g, "\n").split(/\n[ \t]*\n+/).map(part => part.trim()).filter(Boolean);
}
function contentFile(data) {
  validateContent(data);
  return '"use strict";\n// 使用 editor.html 編輯並下載這份檔案。\nconst storyContent = ' +
    JSON.stringify(data, null, 2).replace(/</g, "\\u003c").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029") + ";\n";
}
let draft = JSON.parse(sourceText), pageIndex = 0, selected = Object.keys(storyContent)[0];
const status = document.getElementById("save-state");
try {
  const saved = localStorage.getItem(draftKey);
  if (saved) {
    const envelope = JSON.parse(saved);
    // A newer downloaded content file must not be silently replaced by an older browser draft.
    if (envelope.source === sourceText) {
      draft = validateContent(envelope.content, true);
      status.textContent = "已恢復這個瀏覽器中的草稿。";
    } else status.textContent = "網站文字已更新，已載入目前檔案；舊暫存未套用。";
  }
} catch { status.textContent = "無法讀取瀏覽器草稿；目前顯示網站檔案，請以下載方式保存。"; }
const fields = Object.fromEntries(["label", "title", "body", "item"].map(id => [id, document.getElementById(id)]));
for (const key of Object.keys(storyContent)) {
  const option = document.createElement("option");
  option.value = key; option.textContent = itemNames[key]; fields.item.append(option);
}
function preview() {
  const entry = draft[selected];
  const pages = entry.lines.length ? entry.lines : [selected === "home.letter" ? "這封信還沒寫好。" : "這段回憶還沒寫好。"];
  pageIndex = Math.min(pageIndex, pages.length - 1);
  document.getElementById("preview-title").textContent = entry.title;
  document.getElementById("preview-body").textContent = pages[pageIndex];
  document.getElementById("page-count").textContent = `${pageIndex + 1} / ${pages.length}`;
  document.getElementById("previous").disabled = pageIndex === 0;
  document.getElementById("next").disabled = pageIndex === pages.length - 1;
}
function saveDraft() {
  try {
    localStorage.setItem(draftKey, JSON.stringify({ source: sourceText, content: draft }));
    status.textContent = "已暫存草稿。尚未套用到網站，請下載文字檔。";
  } catch { status.textContent = "瀏覽器無法暫存，請立即下載文字檔或草稿備份，以免遺失。"; }
}
function loadItem() {
  const entry = draft[selected];
  fields.label.value = entry.label; fields.title.value = entry.title; fields.body.value = entry.lines.join("\n\n");
  pageIndex = 0; preview();
}
fields.item.addEventListener("change", () => { selected = fields.item.value; loadItem(); });
for (const field of ["label", "title", "body"]) fields[field].addEventListener("input", () => {
  draft[selected] = { label: fields.label.value, title: fields.title.value, lines: splitPages(fields.body.value) };
  pageIndex = 0; preview(); saveDraft();
});
document.getElementById("previous").addEventListener("click", () => { pageIndex--; preview(); });
document.getElementById("next").addEventListener("click", () => { pageIndex++; preview(); });
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a"); a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
document.getElementById("download").addEventListener("click", () => {
  try {
    download("story-content.js", contentFile(draft), "text/javascript;charset=utf-8");
    status.textContent = "已送出下載。請用下載的 story-content.js 替換網站同名檔案，再重新整理或上傳 GitHub。";
  } catch (error) { status.textContent = `${error.message} 請確認每個物件都有名稱和標題。`; }
});
document.getElementById("backup").addEventListener("click", () => {
  download("little-days-draft.json", JSON.stringify(draft, null, 2), "application/json");
  status.textContent = "已送出草稿備份下載。這份 JSON 可在編輯頁匯入，不是上線用的文字檔。";
});
document.getElementById("import").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    if (file.size > 2000000) throw new Error("備份檔案過大。");
    const imported = validateContent(JSON.parse(await file.text()), true);
    // Preserve the current draft before replacing it with an imported one.
    download("little-days-before-import.json", JSON.stringify(draft, null, 2), "application/json");
    draft = imported; loadItem(); saveDraft();
    status.textContent = "已匯入草稿，並送出匯入前的備份下載。要套用到網站，請再下載文字檔。";
  } catch (error) { status.textContent = `未匯入：${error.message} 原本的草稿仍保留。`; }
  event.target.value = "";
});
loadItem();
