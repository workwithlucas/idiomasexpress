/**
 * Converte qualquer áudio que o navegador saiba decodificar em WAV PCM
 * 16 bits, mono, 16 kHz — o formato pedido pela API REST do Azure Speech.
 */
const TARGET_RATE = 16_000;

export async function toWav16kMono(blob: Blob): Promise<Blob> {
  const decoded = await decode(await blob.arrayBuffer());
  const length = Math.max(1, Math.ceil(decoded.duration * TARGET_RATE));
  // OfflineAudioContext com 1 canal e 16 kHz faz o downmix e o resample.
  const offline = new OfflineAudioContext(1, length, TARGET_RATE);
  const src = offline.createBufferSource();
  src.buffer = decoded;
  src.connect(offline.destination);
  src.start();
  const rendered = await offline.startRendering();
  return new Blob([encodePcm16Wav(rendered.getChannelData(0), TARGET_RATE)], { type: 'audio/wav' });
}

async function decode(data: ArrayBuffer): Promise<AudioBuffer> {
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    return await ctx.decodeAudioData(data);
  } finally {
    void ctx.close();
  }
}

export function encodePcm16Wav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const v = new DataView(buffer);
  const str = (offset: number, s: string) => [...s].forEach((c, i) => v.setUint8(offset + i, c.charCodeAt(0)));

  str(0, 'RIFF');
  v.setUint32(4, 36 + dataSize, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  v.setUint32(16, 16, true); // tamanho do bloco fmt
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  v.setUint16(32, bytesPerSample, true); // block align
  v.setUint16(34, 16, true); // bits por amostra
  str(36, 'data');
  v.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}
