# 這些小小的日子

純 HTML、CSS、JavaScript 的互動繪本，無套件、無建置步驟、無後端。直接用瀏覽器開啟 `index.html` 即可。

## 放上 GitHub Pages

1. 在 GitHub 建立一個專屬 repository，例如 `little-days`。
2. 把 ZIP 解壓縮後的所有檔案放到 repository 最外層，不要再包一層 `Project009_ForJiejie` 資料夾。新版包含共用文字檔與文字編輯頁，請整包更新。
3. 到 repository 的 **Settings → Pages**。
4. 在 **Build and deployment → Source** 選擇 **Deploy from a branch**。
5. 選擇存放這些檔案的分支（通常是 `main`）與 **/(root)**，按 **Save**。
6. 等待部署完成後，從 Pages 設定頁取得正式網址。網址一般為 `https://你的帳號.github.io/little-days/`。

所有資源均使用相對路徑，也支援 GitHub Pages 的 repository 子路徑，不需改程式。

GitHub Free 可使用公開 repository 發佈 Pages。一般 Pages 網站公開可讀；私人 repository 不代表網頁有密碼保護。這個版本使用暱稱與插畫，已加入小貓照片，亦不蒐集點擊或回覆。`noindex` 只是搜尋引擎提示，不是存取限制。

官方操作參考：[設定 GitHub Pages 發佈來源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)。

## 修改內容

- `index.html`：主文、回憶、改變、信件版面與首頁 SVG 插畫。
- `editor.html`：文字編輯頁；可修改全部 12 個物件／互動，包含信件。
- `story-content.js`：共用文字內容，由編輯頁下載產生；遊戲與繪本對應回憶使用同一份內容。
- `letter.js`、`storybook-content.js`：將共用內容顯示在繪本。信件目前留白。
- `style.css`：配色、貓咪造型、電腦／手機版面、減少動態效果支援。
- `app.js`：兩隻貓咪各四段日常，以及本機合成的簡單音樂盒旋律。
- `game.html`、`game.css`：新增的遊戲入口與方向桿版面，繪本仍保留於 `index.html`。
- `game.js`：三個地點、互動故事、角色繪製、跟隨與對話。
- `game-world.js`：移動、邊界、家具碰撞與互動距離。

## 遊戲操作

電腦使用方向鍵或 WASD 移動、空白鍵互動。手機拖曳左下方向桿移動，放開即停，靠近物件時按右側按鈕。方向桿支援 pointer capture、取消觸控與離開視窗停止，手機上會跟著角色移動視角。

場景物件也能點擊：角色會直線走過去，遇家具停下時請自行繞行。上方可自由切換小貓的家、成大光復門對面的小路、車站旁的小路，對話可隨時關閉；桌上的信沒有解鎖條件。畫面下方提供直接閱讀完整信件與摸摸胖胖熊的入口。沒有存檔、收集進度或追蹤。場景為回憶插畫，並非實景地圖。

背景音樂使用你提供的王矜霖〈我很窮〉（`我很窮.mp3`）。進入頁面時嘗試自動播放；若瀏覽器阻擋，會提示並在第一次點擊或按鍵後播放。音量為 15%，歌曲結束後循環播放；切換到其他分頁或離開網頁時暫停，再點開會接續播放。實際音量仍受装置影響。音檔必須與 `index.html`、`game.html` 放在同一層，更新 ZIP 已包含音檔。在「姐姐的枕頭」可翻看 3 張 kiro 照片；「胖胖熊的角落」及「摸摸胖胖熊」可翻看 4 張 Kirin 照片。照片箭頭與文字翻頁各自獨立。上傳網站時請保留 photos 資料夾與檔名。

## 自己輸入互動文字

1. 用瀏覽器開啟 `editor.html`，選擇物件或「桌上的信」。
2. 修改物件名稱、對話標題與文字。空一行分成下一頁，右側可逐頁預覽。
3. 按「下載文字檔」，取得 `story-content.js`。
4. 將下載檔放回網站資料夾，替換同名檔案。若瀏覽器下載時改名為 `story-content (1).js`，請改回 `story-content.js`。
5. 重新整理遊戲；GitHub Pages 則需將新檔上傳至原 repository，等待部署更新。

瀏覽器暫存不等於更新網站。建議另外下載「草稿備份」，可在其他瀏覽器匯入。匯入前會送出現有草稿備份下載；請確認下載確實完成。編輯器沒有伺服器寫入權限，其他訪客不能透過它更改你的 GitHub 網站。編輯頁不放在遊戲導覽裡，但若上傳它，網址本身不是私密後台。

網站執行所需檔案：`index.html`、`style.css`、`app.js`、`story-content.js`、`storybook-content.js`、`letter.js`、`game.html`、`game.css`、`game-world.js`、`game.js`、`.nojekyll`。編輯頁另需 `editor.html`、`editor.css`、`editor.js`；更新 ZIP 已包含上述檔案。

## 檢查

安裝 Node.js 的開發環境可執行：

```text
node --check app.js
node self-check.cjs
node game-check.cjs
node editor-check.cjs
```

`self-check.cjs` 檢查貓咪故事循環、音樂開關與離頁停止、音效不支援時的提示、頁內連結及本機資源。這是隔離檢查，不代替瀏覽器與實際音量確認。

網站本身不需要 Node.js 或 Python。部署時也不需要上傳 `self-check.cjs`。
