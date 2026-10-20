"use strict";
// Shared by the browser and the dependency-free movement checks.
const GameWorld = (() => {
  const width = 960, height = 600, radius = 19;
  function vector(x, y, deadzone = 0) {
    const length = Math.hypot(x, y);
    if (length <= deadzone) return { x: 0, y: 0 };
    const scale = Math.max(1, length);
    return { x: x / scale, y: y / scale };
  }
  function blocked(x, y, obstacles) {
    return x < 30 || x > width - 30 || y < 80 || y > height - 28 ||
      obstacles.some(o => x + radius > o.x && x - radius < o.x + o.w && y + radius > o.y && y - radius < o.y + o.h);
  }
  function move(point, input, dt, obstacles) {
    const v = vector(input.x, input.y);
    const distance = 180 * Math.min(Math.max(dt, 0), 0.04);
    const result = { ...point };
    const x = point.x + v.x * distance;
    if (!blocked(x, point.y, obstacles)) result.x = x;
    const y = point.y + v.y * distance;
    if (!blocked(result.x, y, obstacles)) result.y = y;
    return result;
  }
  function nearest(point, items, range = 112) {
    return items.filter(item => Math.hypot(point.x - item.x, point.y - item.y) < range)
      .sort((a, b) => Math.hypot(point.x - a.x, point.y - a.y) - Math.hypot(point.x - b.x, point.y - b.y))[0] || null;
  }
  return { width, height, vector, blocked, move, nearest };
})();
if (typeof module !== "undefined") module.exports = GameWorld;
