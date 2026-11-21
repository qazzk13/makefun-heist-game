// Velvet Fox — shared constants: the logical room size, movement speeds,
// vision ranges and the colour language of the game (teal = safe cover,
// gold = loot, amber/red = danger). One job: constants, no logic.
export const VIEW_W = 960;
export const VIEW_H = 640;

export const PLAYER_RADIUS = 13;
export const PLAYER_SPEED = 178;

export const GUARD_RADIUS = 14;
export const CAMERA_RANGE = 265;
export const CAMERA_HALF_ANGLE = 0.52;

export const GUARD_RANGE = 235;
export const GUARD_HALF_ANGLE = 0.6;

export const ALARM_MAX = 100;
export const ALARM_DECAY_PER_SEC = 14;
export const ALARM_GUARD_PER_SEC = 62;
export const ALARM_CAMERA_PER_SEC = 50;
export const ALARM_LOOT_GRAB = 15;

export const SMOKE_RADIUS = 105;
export const SMOKE_SECONDS = 3.5;
export const COIN_LURE_RADIUS = 330;
export const COIN_INVESTIGATE_SECONDS = 3;

export const PALETTE = {
  floorA: '#16242b',
  floorB: '#122028',
  floorLine: '#1d323c',
  wall: '#2c3e50',
  wallTrim: '#c9a227',
  hudBg: '#0b1216',
  hudText: '#e8dcc0',
  alarmLow: '#3fae6a',
  alarmMid: '#e8b13c',
  alarmHigh: '#e5484d',
  loot: '#ffd34d',
  lootGlow: 'rgba(255, 211, 77, 0.35)',
  exit: '#39d98a',
  player: '#7dd3fc',
  playerCloak: '#312e81',
  guard: '#f97316',
  guardCone: 'rgba(249, 199, 0, 0.20)',
  guardConeEdge: 'rgba(249, 199, 0, 0.55)',
  cameraCone: 'rgba(229, 72, 77, 0.16)',
  cameraConeEdge: 'rgba(229, 72, 77, 0.5)',
  smoke: 'rgba(203, 213, 225, 0.55)',
  coin: '#fbbf24',
  textDim: '#9db4bd',
};
