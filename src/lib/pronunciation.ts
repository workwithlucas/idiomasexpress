import type { ApiError, ApiErrorCode, PronunciationResult } from '../../server/pronunciation';

export type { PronunciationResult, SyllableScore, WordScore } from '../../server/pronunciation';
export { checkSpeech, type SpeechCheck } from '../../server/audioCheck';

const ENDPOINT = '/api/pronunciation';
/** Um pouco acima do limite do servidor (15 s) para cobrir o upload. */
const REQUEST_TIMEOUT_MS = 20_000;

export type PronunciationErrorCode = ApiErrorCode | 'offline' | 'network';

export class PronunciationError extends Error {
  constructor(public code: PronunciationErrorCode, message: string) {
    super(message);
  }
}

/**
 * Estado da nota por som:
 *  - configured: chave aceita (ou não deu para conferir — o POST decide);
 *  - invalid_key: o Azure recusou a chave ou a região;
 *  - not_configured: o servidor não tem chave;
 *  - offline / unreachable: sem internet / sem resposta do servidor.
 */
export type AzureStatus = 'configured' | 'invalid_key' | 'not_configured' | 'offline' | 'unreachable';

export async function azureStatus(): Promise<AzureStatus> {
  if (!navigator.onLine) return 'offline';
  try {
    const res = await fetch(ENDPOINT, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return 'unreachable';
    const data = (await res.json()) as { configured?: boolean; valid?: boolean | null };
    if (!data.configured) return 'not_configured';
    return data.valid === false ? 'invalid_key' : 'configured';
  } catch {
    return 'unreachable';
  }
}

export async function assessPronunciation(wav: Blob, referenceText: string): Promise<PronunciationResult> {
  if (!navigator.onLine) throw new PronunciationError('offline', 'Sem internet.');
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?text=${encodeURIComponent(referenceText)}`, {
      method: 'POST',
      headers: { 'content-type': 'audio/wav' },
      body: wav,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (e) {
    const name = (e as DOMException)?.name;
    if (name === 'TimeoutError') throw new PronunciationError('timeout', 'O serviço de avaliação demorou demais para responder.');
    throw new PronunciationError(navigator.onLine ? 'network' : 'offline', `Falha de rede: ${(e as Error).message}`);
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!isJson) {
    const code: PronunciationErrorCode = res.status === 504 || res.status === 408 ? 'timeout' : 'upstream';
    throw new PronunciationError(code, `Serviço de avaliação indisponível (HTTP ${res.status}).`);
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    const e = (data ?? {}) as Partial<ApiError>;
    throw new PronunciationError(e.error ?? 'upstream', e.message ?? `Erro HTTP ${res.status}`);
  }
  return data as PronunciationResult;
}

/**
 * Mensagem para a pessoa (curta, sem jargão) e se vale oferecer "tentar de
 * novo" com a MESMA gravação. O detalhe técnico fica no console.
 */
export function describePronunciationError(code: PronunciationErrorCode): { text: string; retry: boolean; regravar?: boolean } {
  switch (code) {
    case 'too_short':
      return { text: 'A gravação ficou curta demais. Grave de novo falando a frase inteira.', retry: false, regravar: true };
    case 'silent':
      return { text: 'Não deu pra ouvir sua voz na gravação. Grave de novo, mais perto do microfone.', retry: false, regravar: true };
    case 'no_speech':
      return { text: 'Não deu pra entender a frase. Grave de novo, com calma e mais perto do microfone.', retry: false, regravar: true };
    case 'timeout':
      return { text: 'A nota demorou demais pra chegar. A melodia acima continua valendo.', retry: true };
    case 'offline':
      return { text: 'Sem internet agora: a nota volta quando conectar. A melodia acima continua valendo.', retry: false };
    case 'network':
      return { text: 'A conexão caiu no meio do caminho. A melodia acima continua valendo.', retry: true };
    case 'busy':
      return { text: 'Muitas notas seguidas: espere alguns segundos. A melodia acima continua valendo.', retry: true };
    case 'quota':
      return { text: 'O limite gratuito do Azure deste mês acabou. A nota volta no próximo ciclo; a melodia acima continua valendo.', retry: false };
    case 'auth':
      return { text: 'A nota por som está desligada: a chave do Azure não foi aceita (veja o README). A melodia acima continua valendo.', retry: false };
    case 'forbidden':
      return { text: 'Não deu pra calcular a nota por aqui. Abra o app pelo endereço oficial. A melodia acima continua valendo.', retry: false };
    case 'not_configured':
      return { text: 'A nota por som ainda não foi ligada neste app (veja o README). A melodia acima funciona sem ela.', retry: false };
    default:
      return { text: 'Não deu pra calcular a nota agora. A melodia acima continua valendo.', retry: true };
  }
}
