// audio.js — all sound is synthesized with WebAudio oscillators; no audio files.

export function createAudio() {
  let ac = null;
  function ctx() {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
    }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, dur, type = 'square', vol = 0.12, when = 0) {
    const a = ctx();
    if (!a) return;
    const t0 = a.currentTime + when;
    const osc = a.createOscillator();
    const gain = a.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(a.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }
  return {
    resume() { ctx(); },
    step() { tone(140 + Math.random() * 40, 0.05, 'triangle', 0.05); },
    beep(kind) {
      if (kind === 'start') { tone(330, 0.09, 'square', 0.1); tone(440, 0.12, 'square', 0.1, 0.09); }
    },
    alarm() {
      for (let i = 0; i < 4; i++) {
        tone(880, 0.12, 'sawtooth', 0.14, i * 0.22);
        tone(660, 0.12, 'sawtooth', 0.14, i * 0.22 + 0.11);
      }
    },
    win() {
      const notes = [523, 659, 784, 1047];
      notes.forEach((f, i) => tone(f, 0.18, 'triangle', 0.12, i * 0.13));
    },
  };
}
