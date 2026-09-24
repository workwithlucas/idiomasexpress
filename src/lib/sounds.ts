import { prefs } from './prefs';

/**
 * Micro-feedback sonoro: toques curtos e baixos gerados na hora (sem arquivos,
 * funciona offline). Desligável em Ajustes.
 */
type Cue = 'right' | 'almost' | 'tap' | 'done';

const CUES: Record<Cue, { notes: number[]; step: number; len: number; gain: number; type: OscillatorType }> = {
  right: { notes: [660, 880], step: 0.08, len: 0.16, gain: 0.05, type: 'sine' },
  almost: { notes: [392, 349], step: 0.09, len: 0.16, gain: 0.04, type: 'triangle' },
  tap: { notes: [520], step: 0, len: 0.05, gain: 0.025, type: 'sine' },
  done: { notes: [523, 659, 784], step: 0.1, len: 0.22, gain: 0.05, type: 'sine' },
};

let ctx: AudioContext | null = null;

export function cue(name: Cue): void {
  if (!prefs().sounds) return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctx ??= new Ctx();
    if (ctx.state === 'suspended') void ctx.resume();
    const c = CUES[name];
    const t0 = ctx.currentTime + 0.01;
    c.notes.forEach((f, i) => {
      const osc = ctx!.createOscillator();
      const g = ctx!.createGain();
      osc.type = c.type;
      osc.frequency.value = f;
      const start = t0 + i * c.step;
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(c.gain, start + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, start + c.len);
      osc.connect(g).connect(ctx!.destination);
      osc.start(start);
      osc.stop(start + c.len + 0.02);
    });
  } catch {
    /* áudio indisponível: segue sem som */
  }
  if (name === 'right' || name === 'almost') navigator.vibrate?.(name === 'right' ? 12 : [8, 40, 8]);
}
