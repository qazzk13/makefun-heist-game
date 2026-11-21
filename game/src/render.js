// Velvet Fox — everything the eye sees: the room, the HUD, the vision cones,
// the thief, the guards, the cameras, and the menu / win / caught screens.
// All drawing is plain canvas 2D; the playfield is 960x640 under a 60px HUD.
import {
  VIEW_W, VIEW_H, PALETTE, ALARM_MAX, GUARD_RANGE, GUARD_HALF_ANGLE,
  CAMERA_RANGE, CAMERA_HALF_ANGLE, SMOKE_RADIUS,
} from './config.js';

export const HUD_H = 60;
export const CANVAS_W = VIEW_W;
export const CANVAS_H = VIEW_H + HUD_H;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle - halfAngle) * range, y + Math.sin(angle - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(angle + halfAngle) * range, y + Math.sin(angle + halfAngle) * range);
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawDiamond(ctx, x, y, size, color) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.8, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.8, y);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function screenButtons(screen, levelIndex, totalLevels) {
  const cx = CANVAS_W / 2;
  if (screen === 'menu') {
    return [{ id: 'start', x: cx - 110, y: 480, w: 220, h: 52, label: 'START THE HEIST' }];
  }
  if (screen === 'caught') {
    return [
      { id: 'retry', x: cx - 230, y: 470, w: 210, h: 52, label: 'RETRY LEVEL' },
      { id: 'menu', x: cx + 20, y: 470, w: 210, h: 52, label: 'MAIN MENU' },
    ];
  }
  if (screen === 'levelClear') {
    const label = levelIndex + 1 < totalLevels ? 'NEXT ROOM' : 'SEE THE TAKE';
    return [{ id: 'next', x: cx - 110, y: 470, w: 220, h: 52, label }];
  }
  if (screen === 'won') {
    return [{ id: 'again', x: cx - 110, y: 500, w: 220, h: 52, label: 'PLAY AGAIN' }];
  }
  if (screen === 'paused') {
    return [
      { id: 'resume', x: cx - 230, y: 470, w: 210, h: 52, label: 'RESUME' },
      { id: 'menu', x: cx + 20, y: 470, w: 210, h: 52, label: 'MAIN MENU' },
    ];
  }
  return [];
}

function drawButton(ctx, b, hover) {
  ctx.fillStyle = hover ? '#c9a227' : '#8a6d1f';
  roundRect(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.fillStyle = '#10151a';
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
}

function drawOverlay(ctx, title, lines, buttons, mouse) {
  ctx.fillStyle = 'rgba(6, 12, 15, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.loot;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, CANVAS_W / 2, 150);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '17px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, CANVAS_W / 2, 215 + i * 30);
  });
  for (const b of buttons) {
    const hover = mouse.x >= b.x && mouse.x <= b.x + b.w && mouse.y >= b.y && mouse.y <= b.y + b.h;
    drawButton(ctx, b, hover);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.fillRect(0, 0, CANVAS_W, HUD_H);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, HUD_H - 2, CANVAS_W, 2);

  const level = game.level;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(level.name.toUpperCase(), 16, 20);
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Room ${game.levelIndex + 1} of ${game.totalLevels}   ·   ${formatTime(game.levelTime)}`, 16, 42);

  // Loot status.
  const lootX = 330;
  ctx.fillStyle = game.lootTaken ? PALETTE.exit : PALETTE.loot;
  drawDiamond(ctx, lootX, 30, 9, game.lootTaken ? PALETTE.exit : PALETTE.loot);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(game.lootTaken ? 'LOOT ✓' : 'LOOT', lootX + 16, 30);

  // Alarm meter.
  const meterX = 460;
  const meterW = 190;
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', meterX, 18);
  ctx.fillStyle = '#1c2b33';
  roundRect(ctx, meterX, 28, meterW, 16, 4);
  ctx.fill();
  const frac = Math.max(0, Math.min(1, game.alarm / ALARM_MAX));
  const alarmColor = frac < 0.4 ? PALETTE.alarmLow : frac < 0.75 ? PALETTE.alarmMid : PALETTE.alarmHigh;
  if (frac > 0.01) {
    ctx.fillStyle = alarmColor;
    roundRect(ctx, meterX, 28, Math.max(8, meterW * frac), 16, 4);
    ctx.fill();
  }
  ctx.strokeStyle = '#43565f';
  ctx.lineWidth = 1;
  roundRect(ctx, meterX, 28, meterW, 16, 4);
  ctx.stroke();
  ctx.fillStyle = alarmColor;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(`${Math.round(game.alarm)}%`, meterX + meterW + 10, 36);

  // Score and tools.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`SCORE ${game.score}`, CANVAS_W - 16, 20);
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.textDim;
  ctx.fillText(
    `smoke ${'●'.repeat(game.tools.smoke)}${'○'.repeat(Math.max(0, 3 - game.tools.smoke))}   coins ${'●'.repeat(game.tools.coins)}${'○'.repeat(Math.max(0, 4 - game.tools.coins))}`,
    CANVAS_W - 16,
    42,
  );
  ctx.textAlign = 'left';
}

export function drawGame(ctx, game, mouse) {
  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.fillStyle = '#0a0f13';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  drawHud(ctx, game);

  ctx.save();
  ctx.translate(0, HUD_H);

  const level = game.level;
  const t = game.now;

  // Floor: two-tone checker with a faint grid.
  const tile = 40;
  for (let y = 0; y < VIEW_H; y += tile) {
    for (let x = 0; x < VIEW_W; x += tile) {
      ctx.fillStyle = ((x / tile + y / tile) % 2 === 0) ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= VIEW_W; x += tile) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, VIEW_H); ctx.stroke();
  }
  for (let y = 0; y <= VIEW_H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW_W, y); ctx.stroke();
  }

  // Exit door.
  const ex = level.exit;
  ctx.fillStyle = game.lootTaken ? PALETTE.exit : '#274b3a';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = game.lootTaken ? '#bff5d6' : '#4a7a63';
  ctx.lineWidth = 3;
  ctx.strokeRect(ex.x + 2, ex.y + 2, ex.w - 4, ex.h - 4);
  ctx.fillStyle = game.lootTaken ? '#062b18' : '#9fc4ae';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(game.lootTaken ? 'EXIT' : 'LOCKED', ex.x + ex.w / 2, ex.y + ex.h / 2);
  if (game.lootTaken) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.strokeStyle = `rgba(57, 217, 138, ${0.25 + pulse * 0.45})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(ex.x - 5, ex.y - 5, ex.w + 10, ex.h + 10);
  }

  // Loot.
  if (!game.lootTaken) {
    const lx = level.loot.x;
    const ly = level.loot.y;
    const glow = 26 + 8 * Math.sin(t * 3);
    const grad = ctx.createRadialGradient(lx, ly, 4, lx, ly, glow + 18);
    grad.addColorStop(0, PALETTE.lootGlow);
    grad.addColorStop(1, 'rgba(255, 211, 77, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(lx, ly, glow + 18, 0, Math.PI * 2);
    ctx.fill();
    drawDiamond(ctx, lx, ly, 15, PALETTE.loot);
    ctx.fillStyle = '#fff7d6';
    drawDiamond(ctx, lx, ly - 3, 6, '#fff7d6');
    ctx.fillStyle = PALETTE.loot;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(level.loot.name.toUpperCase(), lx, ly + 32);
  }

  // Bonus coins.
  for (const coin of game.coinsLeft) {
    ctx.fillStyle = PALETTE.coin;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7c5a10';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vision cones first, so walls drawn over them read as cover.
  for (const guard of game.guards) {
    drawCone(ctx, guard.x, guard.y, guard.angle, GUARD_RANGE, GUARD_HALF_ANGLE,
      PALETTE.guardCone, PALETTE.guardConeEdge);
  }
  for (const cam of game.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE,
      PALETTE.cameraCone, PALETTE.cameraConeEdge);
  }

  // Walls with a gold top edge.
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = PALETTE.wallTrim;
    if (wall.w >= wall.h) ctx.fillRect(wall.x, wall.y, wall.w, 3);
    else ctx.fillRect(wall.x, wall.y, 3, wall.h);
  }
  // Border walls.
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, 0, VIEW_W, 16);
  ctx.fillRect(0, VIEW_H - 16, VIEW_W, 16);
  ctx.fillRect(0, 0, 16, VIEW_H);
  ctx.fillRect(VIEW_W - 16, 0, 16, VIEW_H);
  ctx.fillStyle = PALETTE.wallTrim;
  ctx.fillRect(0, 13, VIEW_W, 3);
  ctx.fillRect(0, VIEW_H - 16, VIEW_W, 3);
  ctx.fillRect(13, 0, 3, VIEW_H);
  ctx.fillRect(VIEW_W - 16, 0, 3, VIEW_H);

  // Smoke clouds.
  for (const smoke of game.smokes) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(smoke.x, smoke.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(smoke.x - 20, smoke.y - 12, 26, 0, Math.PI * 2);
    ctx.arc(smoke.x + 24, smoke.y + 14, 30, 0, Math.PI * 2);
    ctx.fill();
  }

  // Thrown coin and its lure ring.
  if (game.thrownCoin) {
    ctx.strokeStyle = PALETTE.coin;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(game.thrownCoin.x, game.thrownCoin.y, 12 + 4 * Math.sin(t * 6), 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.coin;
    ctx.beginPath();
    ctx.arc(game.thrownCoin.x, game.thrownCoin.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cameras: wall domes with a red lens.
  for (const cam of game.cameras) {
    ctx.fillStyle = '#1f2937';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Guards: orange patrolmen with a facing tick and a "!" when they see you.
  for (const guard of game.guards) {
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y + 2, guard.r + 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, guard.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7ed';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.angle) * (guard.r + 7), guard.y + Math.sin(guard.angle) * (guard.r + 7));
    ctx.stroke();
    if (guard.seesPlayer) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText('!', guard.x, guard.y - guard.r - 12);
    }
  }

  // The thief: a hooded figure in a dark cloak.
  const p = game.player;
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 9, 13, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.playerCloak;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - 14);
  ctx.lineTo(p.x + 12, p.y + 11);
  ctx.lineTo(p.x - 12, p.y + 11);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 4, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * 3, p.y - 4 + Math.sin(p.angle) * 3, 3, 0, Math.PI * 2);
  ctx.fill();
  if (game.spotted) {
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText('!', p.x, p.y - 22);
  }

  // Alarm flash at the edges when the meter is high.
  if (game.alarm > 70) {
    const a = ((game.alarm - 70) / 30) * (0.22 + 0.1 * Math.sin(t * 8));
    ctx.strokeStyle = `rgba(229, 72, 77, ${a})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, VIEW_W - 10, VIEW_H - 10);
  }

  ctx.restore();

  // Screens on top of the room.
  if (game.screen === 'menu') {
    drawOverlay(ctx, 'VELVET FOX', [
      'A midnight heist in three rooms. You are Wren, the Velvet Fox.',
      'Dodge the guards’ amber cones and the cameras’ red sweeps,',
      'lift the loot, then slip out the green exit before the alarm fills.',
      '',
      'Move: WASD / arrows      Smoke (Q) hides you      Coin (E or click) lures a guard',
      'Grab coins for points. A full alarm means you are caught.',
    ], screenButtons('menu'), mouse);
  } else if (game.screen === 'paused') {
    drawOverlay(ctx, 'PAUSED', ['Take a breath. The guards keep their rounds.'],
      screenButtons('paused'), mouse);
  } else if (game.screen === 'caught') {
    drawOverlay(ctx, 'CAUGHT!', [
      `The alarm hit 100% in ${level.name}. The night watch has you.`,
      `Score so far: ${game.score}. The loot is still in there — go again.`,
    ], screenButtons('caught'), mouse);
  } else if (game.screen === 'levelClear') {
    drawOverlay(ctx, 'CLEAN GETAWAY', [
      `${level.loot.name} secured in ${formatTime(game.levelTime)}.`,
      `Room bonus: ${game.lastRoomBonus}   ·   Total score: ${game.score}`,
      levelIndexText(game),
    ], screenButtons('levelClear', game.levelIndex, game.totalLevels), mouse);
  } else if (game.screen === 'won') {
    drawOverlay(ctx, 'THE VELVET FOX WINS', [
      'All three rooms cleaned out. The Marlow Gallery, the Halcyon Vault,',
      'the Gilded Penthouse — and not a single guard saw your face.',
      `Final score: ${game.score}   ·   Total time: ${formatTime(game.totalTime)}`,
    ], screenButtons('won'), mouse);
  }
}

function levelIndexText(game) {
  if (game.levelIndex + 1 < game.totalLevels) return 'One more room between you and the night.';
  return 'That was the last room. Time to count the take.';
}
