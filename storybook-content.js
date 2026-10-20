"use strict";
document.querySelectorAll("[data-stories]").forEach(container => {
  container.closest("details").querySelector("h3").textContent = storyContent[container.dataset.stories.split(" ")[0]].title;
  const paragraphs = container.dataset.stories.split(" ").flatMap(key =>
    storyContent[key].lines.map(text => {
      const p = document.createElement("p");
      p.textContent = text;
      p.style.whiteSpace = "pre-line";
      return p;
    })
  );
  container.replaceChildren(...paragraphs);
});
