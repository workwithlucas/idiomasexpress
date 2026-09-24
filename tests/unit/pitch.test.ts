import { describe, expect, it } from 'vitest';
import { analyzeSamples, detectPitch } from '../../src/lib/pitch';
import { compareProsody, countSyllables, targetContour, userContour } from '../../src/lib/prosody';

const SR = 16_000;

/** Sinal "tipo voz": série harmônica com F0 que pode variar no tempo. */
function voice(f0: (t: number) => number, seconds: number, sr = SR, amp = 0.3): Float32Array {
  const n = Math.round(seconds * sr);
  const out = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    phase += (2 * Math.PI * f0(i / sr)) / sr;
    let v = 0;
    for (let h = 1; h <= 8; h++) v += Math.sin(h * phase) / h;
    out[i] = amp * v * 0.5;
  }
  return out;
}

describe('detecção de pitch (autocorrelação)', () => {
  it.each([90, 120, 180, 240, 320])('acha F0 de %i Hz com erro < 2%%', (f) => {
    const hz = detectPitch(voice(() => f, 0.045), SR);
    expect(hz).not.toBeNull();
    expect(Math.abs(hz! - f) / f).toBeLessThan(0.02);
  });

  it('funciona em 48 kHz com decimação (caminho do microfone)', () => {
    const frames = analyzeSamples(voice(() => 200, 0.5, 48_000), 48_000);
    const med = frames.map((f) => f.hz!).filter(Boolean).sort((a, b) => a - b)[Math.floor(frames.length / 2)];
    expect(Math.abs(med - 200)).toBeLessThan(4);
  });

  it('silêncio e ruído não viram "voz"', () => {
    expect(detectPitch(new Float32Array(720), SR)).toBeNull();
    const noise = new Float32Array(720).map(() => (Math.random() - 0.5) * 0.6);
    expect(detectPitch(noise, SR)).toBeNull();
  });

  it('acompanha uma voz que sobe', () => {
    const frames = analyzeSamples(voice((t) => 120 + 120 * t, 1), SR).filter((f) => f.hz);
    expect(frames.at(-1)!.hz! - frames[0].hz!).toBeGreaterThan(90);
  });
});

describe('modelo de entonação', () => {
  it('conta sílabas de palavras comuns', () => {
    expect(countSyllables('bonjour')).toBe(2);
    expect(countSyllables('manger')).toBe(2);
    expect(countSyllables('pharmacie')).toBe(3);
    expect(countSyllables('porte')).toBe(1);
    expect(countSyllables('je')).toBe(1);
    expect(countSyllables("c'est")).toBe(1);
  });

  it('afirmativa desce no fim; pergunta de sim/não sobe; pergunta com "où" desce', () => {
    const end = (text: string) => {
      const p = targetContour(text).points;
      return p.at(-1)!.st - p.at(-2)!.st;
    };
    expect(end('Je veux manger.')).toBeLessThan(-2);
    expect(end('Vous êtes prêt ?')).toBeGreaterThan(3);
    expect(end('Où est la gare ?')).toBeLessThan(-2);
    expect(targetContour('Vous êtes prêt ?').finalMove).toBe('rise');
  });

  it('última sílaba do grupo é a mais longa', () => {
    const { points } = targetContour('Je veux manger.');
    const durs = [];
    for (let i = 0; i < points.length; i += 2) durs.push(points[i + 1].t - points[i].t);
    expect(durs.at(-1)!).toBeGreaterThan(Math.max(...durs.slice(0, -1)));
  });

  it('usa o ritmo real da voz nativa quando disponível', () => {
    const t = targetContour('Je veux manger.', { duration: 1.2, wordStarts: [{ charIndex: 0, t: 0 }, { charIndex: 3, t: 0.2 }, { charIndex: 8, t: 0.5 }] });
    expect(t.timing).toBe('native');
    expect(t.duration).toBe(1.2);
  });
});

describe('contorno da gravação e comparação', () => {
  it('detecta fim descendente e ritmo', () => {
    const sig = voice((t) => 200 - 60 * Math.max(0, t - 0.6), 1.0);
    const frames = analyzeSamples(sig, SR);
    const u = userContour(frames)!;
    expect(u).not.toBeNull();
    const fb = compareProsody(targetContour('Je veux manger.'), u);
    expect(fb.melodyOk).toBe(true);
    expect(fb.lines).toHaveLength(2);
  });

  it('sem voz: não inventa contorno', () => {
    expect(userContour(analyzeSamples(new Float32Array(SR), SR))).toBeNull();
  });
});
