// Velvet Fox — keyboard and mouse input. WASD and arrows move, Q drops a
// smoke pellet, E throws a coin at the mouse, Enter confirms, R restarts,
// Esc goes back to the menu, M mutes, P pauses. Clicks are also buttons:
// the game asks this module where the mouse is and whether it was pressed.
const MOVE_KEYS = {
  KeyW: [0, -1],
  ArrowUp: [0, -1],
  KeyS: [0, 1],
  ArrowDown: [0, 1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  const mouse = { x: 0, y: 0, clicked: false, clickedX: 0, clickedY: 0 };

  function toGameCoords(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    if (!event.repeat) pressed.add(event.code);
    keys.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    keys.delete(event.code);
  });
  window.addEventListener('blur', () => {
    keys.clear();
  });
  canvas.addEventListener('mousemove', (event) => {
    const p = toGameCoords(event);
    mouse.x = p.x;
    mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = toGameCoords(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.clicked = true;
    mouse.clickedX = p.x;
    mouse.clickedY = p.y;
  });

  return {
    moveVector() {
      let x = 0;
      let y = 0;
      for (const code of keys) {
        const dir = MOVE_KEYS[code];
        if (dir) {
          x += dir[0];
          y += dir[1];
        }
      }
      if (x !== 0 || y !== 0) {
        const len = Math.hypot(x, y);
        return { x: x / len, y: y / len };
      }
      return { x: 0, y: 0 };
    },
    wasPressed(code) {
      return pressed.has(code);
    },
    consumeClick() {
      if (!mouse.clicked) return null;
      mouse.clicked = false;
      return { x: mouse.clickedX, y: mouse.clickedY };
    },
    mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    endFrame() {
      pressed.clear();
    },
  };
}
