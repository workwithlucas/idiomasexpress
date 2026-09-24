/**
 * Gravação de voz com MediaRecorder. O formato nativo varia por navegador
 * (webm/opus no Chrome/Firefox, mp4/aac no Safari); a conversão para WAV
 * 16 kHz exigida pelo Azure é feita depois, em wav.ts.
 */
export const recordingSupported =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';

/** getUserMedia só existe em HTTPS ou localhost; fora disso a causa é essa, não o navegador. */
export function recordingUnavailableReason(): string {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'A gravação só funciona em conexão segura (HTTPS). Abra o app pelo endereço da Netlify ou por localhost.';
  }
  return 'Este navegador não permite gravar áudio. Use Chrome, Edge, Firefox ou Safari atualizados.';
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export class VoiceRecorder {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  /** Fluxo do microfone em uso (para a análise de melodia ao vivo). */
  get mediaStream(): MediaStream | null {
    return this.stream;
  }

  get recording(): boolean {
    return this.recorder?.state === 'recording';
  }

  async start(): Promise<void> {
    this.release(); // nunca deixa um microfone anterior aberto
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m));
    this.recorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined);
    this.chunks = [];
    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start();
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const rec = this.recorder;
      if (!rec || rec.state === 'inactive') {
        this.release();
        reject(new Error('Nenhuma gravação em andamento.'));
        return;
      }
      rec.onstop = () => {
        const blob = new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' });
        this.release();
        resolve(blob);
      };
      rec.stop();
    });
  }

  /** Libera o microfone (apaga o indicador de gravação do sistema). */
  release(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.recorder = null;
  }
}

export function describeMicError(e: unknown): string {
  const name = (e as DOMException)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError')
    return 'Permissão de microfone negada. Libere o microfone para este site nas configurações do navegador.';
  if (name === 'NotFoundError') return 'Nenhum microfone encontrado neste aparelho.';
  if (name === 'NotReadableError' || name === 'AbortError') return 'O microfone está em uso por outro app. Feche-o e tente de novo.';
  return `Não foi possível acessar o microfone (${name || 'erro desconhecido'}). Verifique a permissão de microfone deste site e tente de novo.`;
}
