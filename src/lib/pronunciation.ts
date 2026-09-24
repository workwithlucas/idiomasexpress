import type { ApiError, PronunciationResult } from '../../server/pronunciation';

export type { PronunciationResult, WordScore } from '../../server/pronunciation';

const ENDPOINT = '/api/pronunciation';

export class PronunciationError extends Error {
  constructor(public code: ApiError['error'] | 'offline' | 'network', message: string) {
    super(message);
  }
}

/** Verifica se o servidor tem a chave do Azure configurada. */
export async function azureStatus(): Promise<'configured' | 'not_configured' | 'unreachable'> {
  if (!navigator.onLine) return 'unreachable';
  try {
    const res = await fetch(ENDPOINT, { cache: 'no-store' });
    if (!res.ok) return 'unreachable';
    const data = (await res.json()) as { configured?: boolean };
    return data.configured ? 'configured' : 'not_configured';
  } catch {
    return 'unreachable';
  }
}

export async function assessPronunciation(wav: Blob, referenceText: string): Promise<PronunciationResult> {
  if (!navigator.onLine) {
    throw new PronunciationError('offline', 'Sem internet: a avaliação do Azure precisa de conexão. A gravação continua disponível para você ouvir.');
  }
  let res: Response;
  try {
    res = await fetch(`${ENDPOINT}?text=${encodeURIComponent(referenceText)}`, {
      method: 'POST',
      headers: { 'content-type': 'audio/wav' },
      body: wav,
    });
  } catch (e) {
    throw new PronunciationError('network', `Falha de rede: ${(e as Error).message}`);
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  if (!isJson) {
    throw new PronunciationError('upstream', `Serviço de avaliação indisponível (HTTP ${res.status}).`);
  }
  const data = await res.json();
  if (!res.ok) {
    const e = data as ApiError;
    throw new PronunciationError(e.error ?? 'upstream', e.message ?? `Erro HTTP ${res.status}`);
  }
  return data as PronunciationResult;
}
