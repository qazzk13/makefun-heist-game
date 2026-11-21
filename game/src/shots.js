// Velvet Fox — screenshot staging. The ?shot= query picks a fixed moment of
// the game so the maker's screenshots are repeatable: start (the menu),
// play (mid-heist with cones, cameras, loot and alarm in one frame),
// alarm (caught in a guard's cone with the meter nearly full) and win
// (the final take). Normal play without a query is untouched.
export function applyShot(api, name) {
  const game = api.state;
  if (name === 'play') {
    api.startRun();
    api.debugPlacePlayer(560, 180);
    game.alarm = 35;
    game.now = 2.4;
  } else if (name === 'alarm') {
    api.startRun();
    api.debugPlacePlayer(480, 120);
    game.alarm = 82;
    game.now = 1.1;
  } else if (name === 'win') {
    api.startRun();
    game.score = 4850;
    game.totalTime = 248;
    game.levelIndex = 2;
    game.screen = 'won';
    game.now = 3;
  } else {
    api.loadLevel(0);
    game.screen = 'menu';
    game.now = 1.5;
  }
}
