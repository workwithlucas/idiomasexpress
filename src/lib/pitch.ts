/**
 * Detecção de frequência fundamental (F0, "altura" da voz) por autocorrelação
 * normalizada — sem bibliotecas. Funções puras, testáveis fora do navegador.
 *
 * Para cada janela de ~40 ms:
 *   r(τ) = Σ x[i]·x[i+τ] / √(Σ x[i]² · Σ x[i+τ]²)
 * O primeiro pico de r(τ) que chega a 90% do maior pico dá o período τ
 * (escolher o primeiro evita "erros de oitava" para baixo); a interpolação
 * parabólica refina τ entre amostras. Janelas com pouca energia ou sem
 * periodicidade clara (r < 0,5) são "não vozeadas" (null).
 */

export const PITCH_MIN_HZ = 70;
export const PITCH_MAX_HZ = 450;
/** Taxa usada na análise: 16 kHz sobra para voz e deixa o cálculo leve no celular. */
export const ANALYSIS_RATE = 16_000;

export interface PitchFrame {
  /** Instante do centro da janela, em segundos desde o início da gravação. */
  t: number;
  /** F0 em Hz, ou null quando não há voz periódica. */
  hz: number | null;
  /** Energia (RMS) da janela, 0–1. */
  rms: number;
}

export function rms(x: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, x.length));
}

/** Reduz a taxa por um fator inteiro com média simples (filtro passa-baixa grosseiro). */
export function decimate(x: Float32Array, factor: number): Float32Array {
  if (factor <= 1) return x;
  const out = new Float32Array(Math.floor(x.length / factor));
  for (let i = 0; i < out.length; i++) {
    let s = 0;
    for (let j = 0; j < factor; j++) s += x[i * factor + j];
    out[i] = s / factor;
  }
  return out;
}

export function detectPitch(frame: Float32Array, sampleRate: number, minRms = 0.008): number | null {
  const n = frame.length;
  if (rms(frame) < minRms) return null;

  // Remove componente contínua.
  let mean = 0;
  for (let i = 0; i < n; i++) mean += frame[i];
  mean /= n;
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = frame[i] - mean;

  const minLag = Math.max(2, Math.floor(sampleRate / PITCH_MAX_HZ));
  const maxLag = Math.min(Math.ceil(sampleRate / PITCH_MIN_HZ), Math.floor(n / 2));
  if (maxLag <= minLag + 2) return null;

  // Somas de quadrados acumuladas: energia de qualquer trecho em O(1).
  const sq = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) sq[i + 1] = sq[i] + x[i] * x[i];

  const r = new Float64Array(maxLag + 2);
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let num = 0;
    const len = n - lag;
    for (let i = 0; i < len; i++) num += x[i] * x[i + lag];
    const e1 = sq[len];
    const e2 = sq[n] - sq[lag];
    r[lag] = e1 > 0 && e2 > 0 ? num / Math.sqrt(e1 * e2) : 0;
  }

  let best = 0;
  const peaks: number[] = [];
  for (let lag = minLag; lag <= maxLag; lag++) {
    if (r[lag] > r[lag - 1] && r[lag] >= r[lag + 1] && r[lag] > 0) {
      peaks.push(lag);
      if (r[lag] > best) best = r[lag];
    }
  }
  if (best < 0.5) return null;
  const lag = peaks.find((p) => r[p] >= 0.9 * best)!;

  // Interpolação parabólica em torno do pico.
  const a = r[lag - 1];
  const b = r[lag];
  const c = r[lag + 1];
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const hz = sampleRate / (lag + Math.max(-0.5, Math.min(0.5, shift)));
  return hz >= PITCH_MIN_HZ && hz <= PITCH_MAX_HZ ? hz : null;
}

/** Analisa um sinal inteiro (usado como plano B quando a captura ao vivo falha, e nos testes). */
export function analyzeSamples(samples: Float32Array, sampleRate: number, hopSec = 0.01, winSec = 0.04): PitchFrame[] {
  const factor = Math.max(1, Math.round(sampleRate / ANALYSIS_RATE));
  const x = decimate(samples, factor);
  const sr = sampleRate / factor;
  const win = Math.round(winSec * sr);
  const hop = Math.round(hopSec * sr);
  const frames: PitchFrame[] = [];
  for (let start = 0; start + win <= x.length; start += hop) {
    const w = x.subarray(start, start + win);
    frames.push({ t: (start + win / 2) / sr, hz: detectPitch(w, sr), rms: rms(w) });
  }
  return frames;
}
