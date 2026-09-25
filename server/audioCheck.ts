/**
 * Checagem rápida de uma gravação ANTES de mandar para o Azure: áudio curto
 * demais ou silencioso volta com "grave de novo" sem gastar a cota do plano
 * gratuito. Roda no navegador (logo depois de parar a gravação) e de novo no
 * servidor (defesa, caso algum cliente pule a checagem). Sem dependências.
 */
export type SpeechCheck = 'ok' | 'too_short' | 'silent';

/** Menos que isso não dá nem uma palavra. */
export const MIN_SECONDS = 0.5;
/** Tempo mínimo com voz de verdade (acima do limiar) na gravação toda. */
export const MIN_VOICED_SECONDS = 0.25;
/** Pico abaixo de ~-40 dBFS = microfone mudo ou longe demais. */
const MIN_PEAK = 0.01;
/** Janela de 20 ms com RMS acima disto conta como "voz". */
const VOICED_RMS = 0.01;

export function checkSpeech(samples: ArrayLike<number>, sampleRate: number): SpeechCheck {
  if (samples.length / sampleRate < MIN_SECONDS) return 'too_short';
  let peak = 0;
  for (let i = 0; i < samples.length; i++) peak = Math.max(peak, Math.abs(samples[i]));
  if (peak < MIN_PEAK) return 'silent';
  const win = Math.round(sampleRate * 0.02);
  let voiced = 0;
  for (let start = 0; start + win <= samples.length; start += win) {
    let sum = 0;
    for (let i = start; i < start + win; i++) sum += samples[i] * samples[i];
    if (Math.sqrt(sum / win) >= VOICED_RMS) voiced++;
  }
  return (voiced * win) / sampleRate < MIN_VOICED_SECONDS ? 'silent' : 'ok';
}

/** Lê um WAV PCM 16 bits mono (o formato que o app envia) em amostras −1…1. */
export function readPcm16Wav(buf: ArrayBuffer): { samples: Float32Array; sampleRate: number } | null {
  if (buf.byteLength < 44) return null;
  const v = new DataView(buf);
  const tag = (o: number) => String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;
  let o = 12;
  let rate = 0;
  let bits = 0;
  let channels = 0;
  while (o + 8 <= buf.byteLength) {
    const id = tag(o);
    const size = v.getUint32(o + 4, true);
    if (id === 'fmt ') {
      channels = v.getUint16(o + 10, true);
      rate = v.getUint32(o + 12, true);
      bits = v.getUint16(o + 22, true);
    } else if (id === 'data') {
      if (bits !== 16 || channels !== 1 || !rate) return null;
      const n = Math.floor(Math.min(size, buf.byteLength - o - 8) / 2);
      const samples = new Float32Array(n);
      for (let i = 0; i < n; i++) samples[i] = v.getInt16(o + 8 + i * 2, true) / 0x8000;
      return { samples, sampleRate: rate };
    }
    o += 8 + size + (size % 2);
  }
  return null;
}
