"use strict";

// 信件內容與遊戲物件一起在 editor.html 編輯。
const personalLetter = storyContent["home.letter"].lines;

const letterLines = personalLetter.length ? personalLetter : ["這封信還沒寫好。"];
const letterBody = document.getElementById("letter-body");
if (letterBody) {
  letterBody.replaceChildren(...letterLines.map(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    paragraph.style.whiteSpace = "pre-line";
    return paragraph;
  }));
}
