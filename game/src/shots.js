// Velvet Fox — screenshot staging. The ?shot= query picks a fixed moment of
// the game so the maker's screenshots are repeatable: start (the menu),
// play (mid-heist with cones, cameras, loot and alarm in one frame),
// alarm (caught in a guard's cone with the meter nearly full) and win
// (the final take). Normal play without a query is untouched.
export function applyShot(api, name) {
  const game = api.state;
  if (name === 'play') {
    api.startRun();
    // Safe corner: the whole room — cones, camera, loot, exit, HUD — is in
    // frame from anywhere, and here no watcher sees the thief, so the
    // staged moment stays alive for the shutter.
    api.debugPlacePlayer(200, 500);
    game.alarm = 55;
    game.now = 2.4;
  } else if (name === 'alarm') {
    api.startRun();
    // Inside the camera's cone (guard B faces away for the first seconds),
    // meter high and climbing: shoot before it fills.
    api.debugPlacePlayer(560, 180);
    game.alarm = 60;
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
