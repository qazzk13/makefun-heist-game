// Velvet Fox — the rules of the heist: the state machine (menu, playing,
// paused, caught, level clear, won), guard patrols, camera sweeps,
// detection feeding the alarm meter, the smoke and coin tools, and scoring.
import {
  VIEW_W, VIEW_H, PLAYER_RADIUS, PLAYER_SPEED, GUARD_RADIUS,
  GUARD_RANGE, GUARD_HALF_ANGLE, CAMERA_RANGE, CAMERA_HALF_ANGLE,
  ALARM_MAX, ALARM_DECAY_PER_SEC, ALARM_GUARD_PER_SEC, ALARM_CAMERA_PER_SEC,
  ALARM_LOOT_GRAB, SMOKE_SECONDS, COIN_LURE_RADIUS, COIN_INVESTIGATE_SECONDS,
} from './config.js';
import { LEVELS } from './levels.js';
import { canSee, moveCircleOutOfWalls, angleDifference } from './vision.js';
import {
  soundCoin, soundLoot, soundAlarmPulse, soundCaught, soundWin, soundSmoke,
} from './audio.js';
import { screenButtons, HUD_H } from './render.js';

const BOUNDS = { x: 16, y: 16, w: VIEW_W - 32, h: VIEW_H - 32 };

function wallsOf(level) {
  return level.walls;
}

export function createGame() {
  const game = {
    screen: 'menu',
    levelIndex: 0,
    totalLevels: LEVELS.length,
    level: LEVELS[0],
    player: { x: 80, y: 560, angle: -Math.PI / 2 },
    guards: [],
    cameras: [],
    alarm: 0,
    score: 0,
    levelTime: 0,
    totalTime: 0,
    lootTaken: false,
    coinsLeft: [],
    smokes: [],
    thrownCoin: null,
    tools: { smoke: 2, coins: 3 },
    spotted: false,
    lastRoomBonus: 0,
    now: 0,
    alarmPulseT: 0,
  };

  function loadLevel(index) {
    const level = LEVELS[index];
    game.levelIndex = index;
    game.level = level;
    game.player = { x: level.player.x, y: level.player.y, angle: -Math.PI / 2 };
    game.guards = level.guards.map((g) => ({
      x: g.path[0][0],
      y: g.path[0][1],
      angle: 0,
      r: GUARD_RADIUS,
      path: g.path,
      wpIndex: 1,
      speed: g.speed,
      pause: g.pause,
      pauseT: 0,
      mode: 'patrol',
      investigateT: 0,
      target: null,
      seesPlayer: false,
    }));
    game.cameras = level.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      baseAngle: c.baseAngle,
      arc: c.arc,
      speed: c.speed,
      angle: c.baseAngle,
      phase: Math.random() * Math.PI * 2,
    }));
    game.alarm = 0;
    game.levelTime = 0;
    game.lootTaken = false;
    game.coinsLeft = level.coins.map((c) => ({ ...c }));
    game.smokes = [];
    game.thrownCoin = null;
    game.tools = { ...level.tools };
    game.spotted = false;
    game.lastRoomBonus = 0;
  }

  function startRun() {
    game.score = 0;
    game.totalTime = 0;
    loadLevel(0);
    game.screen = 'playing';
  }

  function throwCoinAt(x, y) {
    if (game.screen !== 'playing' || game.tools.coins <= 0) return;
    game.tools.coins -= 1;
    game.thrownCoin = { x, y, t: COIN_INVESTIGATE_SECONDS };
    let best = null;
    let bestDist = COIN_LURE_RADIUS;
    for (const guard of game.guards) {
      const d = Math.hypot(guard.x - x, guard.y - y);
      if (d < bestDist) {
        best = guard;
        bestDist = d;
      }
    }
    if (best) {
      best.mode = 'investigate';
      best.target = { x, y };
      best.investigateT = COIN_INVESTIGATE_SECONDS;
      best.pauseT = 0;
    }
  }

  function dropSmoke() {
    if (game.screen !== 'playing' || game.tools.smoke <= 0) return;
    game.tools.smoke -= 1;
    game.smokes.push({ x: game.player.x, y: game.player.y, t: SMOKE_SECONDS });
    soundSmoke();
  }

  function updateGuards(dt) {
    for (const guard of game.guards) {
      if (guard.pauseT > 0) {
        guard.pauseT -= dt;
        continue;
      }
      let tx;
      let ty;
      if (guard.mode === 'investigate' && guard.target) {
        tx = guard.target.x;
        ty = guard.target.y;
      } else {
        const wp = guard.path[guard.wpIndex];
        tx = wp[0];
        ty = wp[1];
      }
      const dx = tx - guard.x;
      const dy = ty - guard.y;
      const dist = Math.hypot(dx, dy);
      const step = guard.speed * dt;
      if (dist <= Math.max(step, 2)) {
        guard.x = tx;
        guard.y = ty;
        if (guard.mode === 'investigate') {
          guard.investigateT -= dt;
          if (guard.investigateT <= 0) {
            guard.mode = 'patrol';
            guard.target = null;
          }
        } else {
          guard.pauseT = guard.pause;
          guard.wpIndex = (guard.wpIndex + 1) % guard.path.length;
        }
      } else {
        const nx = dx / dist;
        const ny = dy / dist;
        guard.x += nx * step;
        guard.y += ny * step;
        const want = Math.atan2(dy, dx);
        const diff = angleDifference(want, guard.angle);
        guard.angle += diff * Math.min(1, dt * 8);
      }
    }
  }

  function updateCameras(dt) {
    for (const cam of game.cameras) {
      cam.angle = cam.baseAngle + cam.arc * Math.sin(cam.phase + game.now * cam.speed);
    }
  }

  function updateDetection(dt) {
    const walls = wallsOf(game.level);
    let seen = false;
    for (const guard of game.guards) {
      const sees = canSee(guard, game.player, GUARD_RANGE, GUARD_HALF_ANGLE, walls, game.smokes);
      guard.seesPlayer = sees;
      if (sees) {
        seen = true;
        game.alarm += ALARM_GUARD_PER_SEC * dt;
      }
      const bump = Math.hypot(guard.x - game.player.x, guard.y - game.player.y);
      if (bump < GUARD_RADIUS + PLAYER_RADIUS + 4) {
        seen = true;
        game.alarm += 80 * dt;
      }
    }
    for (const cam of game.cameras) {
      if (canSee(cam, game.player, CAMERA_RANGE, CAMERA_HALF_ANGLE, walls, game.smokes)) {
        seen = true;
        game.alarm += ALARM_CAMERA_PER_SEC * dt;
      }
    }
    game.spotted = seen;
    if (seen) {
      game.alarmPulseT -= dt;
      if (game.alarmPulseT <= 0) {
        soundAlarmPulse();
        game.alarmPulseT = 0.55;
      }
    } else {
      game.alarm = Math.max(0, game.alarm - ALARM_DECAY_PER_SEC * dt);
    }
    if (game.alarm >= ALARM_MAX) {
      game.alarm = ALARM_MAX;
      game.screen = 'caught';
      soundCaught();
    }
  }

  function updatePlayer(dt, input) {
    const move = input.moveVector();
    const p = game.player;
    if (move.x !== 0 || move.y !== 0) {
      p.x += move.x * PLAYER_SPEED * dt;
      p.y += move.y * PLAYER_SPEED * dt;
      p.angle = Math.atan2(move.y, move.x);
    }
    moveCircleOutOfWalls(p, PLAYER_RADIUS, wallsOf(game.level), BOUNDS);

    for (let i = game.coinsLeft.length - 1; i >= 0; i -= 1) {
      const coin = game.coinsLeft[i];
      if (Math.hypot(coin.x - p.x, coin.y - p.y) < 22) {
        game.coinsLeft.splice(i, 1);
        game.score += 100;
        soundCoin();
      }
    }

    if (!game.lootTaken) {
      const loot = game.level.loot;
      if (Math.hypot(loot.x - p.x, loot.y - p.y) < 26) {
        game.lootTaken = true;
        game.score += loot.value;
        // Grabbing the prize trips its case alarm: a jolt, never a catch.
        game.alarm = Math.min(95, game.alarm + ALARM_LOOT_GRAB);
        soundLoot();
      }
    }

    if (game.lootTaken) {
      const ex = game.level.exit;
      if (p.x > ex.x - 6 && p.x < ex.x + ex.w + 6 && p.y > ex.y - 6 && p.y < ex.y + ex.h + 6) {
        const timeBonus = Math.max(0, Math.round((game.level.parSeconds - game.levelTime) * 10));
        const stealthBonus = Math.round((ALARM_MAX - game.alarm) * 2);
        game.lastRoomBonus = timeBonus + stealthBonus;
        game.score += game.lastRoomBonus;
        game.totalTime += game.levelTime;
        game.screen = 'levelClear';
        soundWin();
      }
    }
  }

  function updatePlaying(dt, input) {
    game.levelTime += dt;
    game.now += dt;
    for (let i = game.smokes.length - 1; i >= 0; i -= 1) {
      game.smokes[i].t -= dt;
      if (game.smokes[i].t <= 0) game.smokes.splice(i, 1);
    }
    if (game.thrownCoin) {
      game.thrownCoin.t -= dt;
      if (game.thrownCoin.t <= 0) game.thrownCoin = null;
    }
    if (input.wasPressed('KeyQ')) dropSmoke();
    if (input.wasPressed('KeyE')) {
      const m = input.mousePos();
      throwCoinAt(m.x, m.y - HUD_H);
    }
    const click = input.consumeClick();
    if (click) throwCoinAt(click.x, click.y - HUD_H);
    updatePlayer(dt, input);
    updateGuards(dt);
    updateCameras(dt);
    updateDetection(dt);
  }

  function clickButton(id) {
    if (id === 'start' || id === 'again') startRun();
    else if (id === 'retry') {
      loadLevel(game.levelIndex);
      game.screen = 'playing';
    } else if (id === 'menu') {
      loadLevel(0);
      game.screen = 'menu';
    } else if (id === 'next') {
      if (game.levelIndex + 1 < game.totalLevels) {
        loadLevel(game.levelIndex + 1);
        game.screen = 'playing';
      } else {
        game.screen = 'won';
      }
    } else if (id === 'resume') {
      game.screen = 'playing';
    }
  }

  function update(dt, input) {
    if (game.screen === 'playing') {
      if (input.wasPressed('KeyP')) {
        game.screen = 'paused';
        return;
      }
      if (input.wasPressed('KeyR')) {
        loadLevel(game.levelIndex);
        return;
      }
      if (input.wasPressed('Escape')) {
        game.screen = 'menu';
        return;
      }
      updatePlaying(dt, input);
      return;
    }

    if (game.screen === 'paused') {
      game.now += dt;
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
        game.screen = 'playing';
        return;
      }
    } else {
      game.now += dt;
    }

    if (input.wasPressed('Enter') || input.wasPressed('Space')) {
      if (game.screen === 'menu') startRun();
      else if (game.screen === 'caught') clickButton('retry');
      else if (game.screen === 'levelClear') clickButton('next');
      else if (game.screen === 'won') startRun();
      return;
    }
    if (input.wasPressed('KeyR') && (game.screen === 'caught' || game.screen === 'levelClear')) {
      clickButton(game.screen === 'caught' ? 'retry' : 'next');
      return;
    }
    const click = input.consumeClick();
    if (click) {
      const buttons = screenButtons(game.screen, game.levelIndex, game.totalLevels);
      for (const b of buttons) {
        if (click.x >= b.x && click.x <= b.x + b.w && click.y >= b.y && click.y <= b.y + b.h) {
          clickButton(b.id);
          break;
        }
      }
    }
  }

  loadLevel(0);
  return {
    state: game,
    loadLevel,
    startRun,
    update,
    // Test hooks: the play-test drives the real game through these.
    debugPlacePlayer(x, y) {
      game.player.x = x;
      game.player.y = y;
      moveCircleOutOfWalls(game.player, PLAYER_RADIUS, wallsOf(game.level), BOUNDS);
    },
  };
}
