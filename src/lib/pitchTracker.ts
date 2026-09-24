import { ANALYSIS_RATE, decimate, detectPitch, rms, type PitchFrame } from './pitch';

/**
 * Captura o contorno de altura da voz AO VIVO enquanto a pessoa grava:
 * MediaStream → AnalyserNode → a cada ~20 ms lê a forma de onda e roda a
 * autocorrelação de pitch.ts. Tudo local: não depende de rede.
 */
export class PitchTracker {
  private ctx: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private timer: number | undefined;
  private startTime = 0;
  frames: PitchFrame[] = [];

  /**
   * Cria o AudioContext. Chame DENTRO do toque do usuário (antes de qualquer
   * await): o iOS só libera áudio assim.
   */
  prepare(): void {
    if (this.ctx) return;
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    void this.ctx.resume().catch(() => undefined);
  }

  start(stream: MediaStream): void {
    this.frames = [];
    if (!this.ctx) this.prepare();
    const ctx = this.ctx;
    if (!ctx) return;
    this.source = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048; // ~43 ms a 48 kHz
    this.source.connect(this.analyser);
    const buf = new Float32Array(this.analyser.fftSize);
    const factor = Math.max(1, Math.round(ctx.sampleRate / ANALYSIS_RATE));
    const sr = ctx.sampleRate / factor;
    this.startTime = ctx.currentTime;
    this.timer = window.setInterval(() => {
      if (!this.analyser || !this.ctx) return;
      this.analyser.getFloatTimeDomainData(buf);
      const x = decimate(buf, factor);
      this.frames.push({ t: this.ctx.currentTime - this.startTime, hz: detectPitch(x, sr), rms: rms(x) });
    }, 20);
  }

  stop(): PitchFrame[] {
    window.clearInterval(this.timer);
    this.timer = undefined;
    try {
      this.source?.disconnect();
    } catch {
      /* já desconectado */
    }
    this.source = null;
    this.analyser = null;
    return this.frames;
  }

  dispose(): void {
    this.stop();
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
