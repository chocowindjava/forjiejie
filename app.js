"use strict";

const catStories = {
  kiro: [
    "最喜歡姐姐了，會窩進姐姐的臂彎，找到自己的睡覺位置。",
    "有時候鑽進衣服裡，黏得好近好近。第一隻來到我們身邊的小貓。",
    "不太愛吃東西，卻很愛黏人。姐姐的身邊，總有一小團橘白色。",
    "又尿床了。從一開始的生氣，到後來的「哎呀，哈哈，又尿了」，也是我們一起照顧牠的日常。"
  ],
  Kirin: [
    "摸一摸，就把呼嚕聲開得好大。圓圓白白的，是我們的胖胖熊。",
    "很愛吃，也很愛蹭我們的腳。有時候蹭一蹭，還會偷偷啃上一口。",
    "喜歡睡在牆角，有時候也睡在我們的腳邊，變成一團白白的暖暖。",
    "kiro 往哪裡跑，胖胖熊就跟著跑。去年領養回來之後，家裡多了這個小跟班。"
  ]
};

document.querySelectorAll("[data-cat]").forEach(button => {
  let index = 0;
  let animationTimer;
  button.addEventListener("click", () => {
    const name = button.dataset.cat;
    index = (index + 1) % catStories[name].length;
    document.getElementById(`${name}-story`).textContent = catStories[name][index];
    button.classList.remove("petting");
    void button.offsetWidth;
    button.classList.add("petting");
    clearTimeout(animationTimer);
    animationTimer = setTimeout(() => button.classList.remove("petting"), 750);
  });
});

const musicButton = document.getElementById("music");
const audioStatus = document.getElementById("audio-status");
const music = new Audio("./我很窮.mp3");
music.preload = "none";
music.loop = true;
music.volume = 0.15;
let musicOn = false;
let playbackRequest = 0;
let waitingForGesture = false;

function stopMusic() {
  waitingForGesture = false;
  playbackRequest++;
  music.pause();
  musicOn = false;
  musicButton.setAttribute("aria-pressed", "false");
  musicButton.textContent = "♫ 音樂：關";
}
function musicError() {
  stopMusic();
  audioStatus.textContent = "暫時無法播放〈我很窮〉，請確認音檔已放在網站資料夾內；仍然可以安靜地閱讀。";
}
music.addEventListener("error", musicError);
async function startMusic() {
  if (document.hidden || musicButton.disabled) return;
  waitingForGesture = false;
  const request = ++playbackRequest;
  musicButton.disabled = true;
  try {
    await music.play();
    if (request !== playbackRequest || document.hidden) { music.pause(); return; }
    musicOn = true;
    musicButton.setAttribute("aria-pressed", "true");
    musicButton.textContent = "♫ 我很窮 · 播放中";
    audioStatus.textContent = "";
  } catch (error) {
    if (request === playbackRequest) {
      if (error.name === "NotAllowedError") {
        waitingForGesture = true;
        musicButton.textContent = "♫ 點一下開啟音樂";
        audioStatus.textContent = "瀏覽器需要妳先點一下或按鍵，才會開始播放音樂。";
      } else musicError();
    }
  } finally {
    musicButton.disabled = false;
  }
}
musicButton.addEventListener("click", () => {
  if (musicOn) { stopMusic(); return; }
  return startMusic();
});
function startAfterGesture(event) {
  if (waitingForGesture && event.target !== musicButton) return startMusic();
}
document.addEventListener("click", startAfterGesture);
document.addEventListener("keydown", startAfterGesture);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopMusic();
});
window.addEventListener("pagehide", stopMusic);
startMusic();
