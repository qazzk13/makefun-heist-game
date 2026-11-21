// Velvet Fox — bootstrap: size the canvas to the window, wire input, run the
// frame loop, and stage a screenshot moment when ?shot= is given. The game
// exposes a small test hook (window.__heist) so an automated play-test can
// read the live state and drive the real keyboard path.
import { createGame } from './game.js';
import { createInput } from './input.js';
import { drawGame, CANVAS_W, CANVAS_H } from './render.js';
import { applyShot } from './shots.js';
import { toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const input = createInput(canvas);
const api = createGame();
const game = api.state;

function fitCanvas() {
  const scale = Math.min(
    window.innerWidth / CANVAS_W,
    window.innerHeight / CANVAS_H,
  );
  canvas.style.width = `${Math.floor(CANVAS_W * scale)}px`;
  canvas.style.height = `${Math.floor(CANVAS_H * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) applyShot(api, shot);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (input.wasPressed('KeyM')) toggleMute();
  api.update(dt, input);
  drawGame(ctx, game, input.mousePos());
  input.endFrame();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook for the automated play-test (read-only state plus the same
// placement helper the screenshot staging uses).
window.__heist = {
  game,
  screen: () => game.screen,
  alarm: () => game.alarm,
  player: () => ({ x: game.player.x, y: game.player.y }),
  lootTaken: () => game.lootTaken,
  score: () => game.score,
  levelIndex: () => game.levelIndex,
  guards: () => game.guards.map((g) => ({ x: g.x, y: g.y, sees: g.seesPlayer })),
  place: (x, y) => api.debugPlacePlayer(x, y),
  start: () => api.startRun(),
};
