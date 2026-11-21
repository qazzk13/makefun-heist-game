// Velvet Fox — all sound is synthesised with WebAudio: short blips, a
// two-note alarm pulse while the thief is spotted, and little win/lose
// phrases. No audio files, no network requests. Silent until the first
// key or click, so browsers never block it.
let audioCtx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function ctx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    } catch (err) {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function tone(freq, seconds, type, gainValue, when = 0) {
  if (muted) return;
  const ac = ctx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    const start = ac.currentTime + when;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  } catch (err) {
    // Sound is garnish: a failed beep never stops the game.
  }
}

export function soundStep() {
  tone(190, 0.05, 'sine', 0.03);
}

export function soundCoin() {
  tone(880, 0.09, 'triangle', 0.08);
  tone(1318, 0.14, 'triangle', 0.08, 0.07);
}

export function soundLoot() {
  tone(523, 0.12, 'triangle', 0.1);
  tone(659, 0.12, 'triangle', 0.1, 0.1);
  tone(784, 0.2, 'triangle', 0.1, 0.2);
}

export function soundAlarmPulse() {
  tone(660, 0.1, 'square', 0.05);
  tone(440, 0.12, 'square', 0.05, 0.11);
}

export function soundCaught() {
  tone(392, 0.16, 'sawtooth', 0.09);
  tone(311, 0.16, 'sawtooth', 0.09, 0.15);
  tone(233, 0.34, 'sawtooth', 0.09, 0.3);
}

export function soundWin() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => tone(freq, 0.18, 'triangle', 0.1, i * 0.12));
}

export function soundSmoke() {
  tone(220, 0.3, 'sine', 0.06);
  tone(180, 0.35, 'sine', 0.05, 0.08);
}
