import { getDB, getMeta, setMeta } from '../db/database';
import type { MomentoProgress, ReviewState } from '../db/schema';
import { content } from '../db/repo';
import { isNewer, looksLikeProgress, mergeProgressPair, progressChanged } from '../../server/syncMerge';
import { isValidReviewState } from './fsrs';

/**
 * Sincronização do progresso (ReviewState, com reps, e Momentos concluídos) entre aparelhos pelo
 * "código de casal". É um extra: sem código, sem rede ou com o servidor fora
 * do ar, o app segue igual — nada aqui bloqueia a interface.
 */
const ENDPOINT = '/api/sync';
const CODE_KEY = 'sync_code';
const LAST_KEY = 'sync_last';

export interface SyncResult {
  at: string;
  /** Estados enviados deste aparelho. */
  sent: number;
  /** Estados e Momentos que chegaram mais novos e foram gravados aqui. */
  updated: number;
}

export type SyncErrorCode = 'no_code' | 'offline' | 'network' | 'timeout' | 'bad_code' | 'forbidden' | 'busy' | 'conflict' | 'upstream';

export class SyncError extends Error {
  constructor(public code: SyncErrorCode, message: string) {
    super(message);
  }
}

export const getSyncCode = () => getMeta<string>(CODE_KEY);
export const getLastSync = () => getMeta<SyncResult>(LAST_KEY);

export async function setSyncCode(code: string | null): Promise<void> {
  await setMeta(CODE_KEY, code ? code.trim() : null);
  if (!code) await setMeta(LAST_KEY, null);
}

/** Código sugerido: 12 letras/números sem ambiguidade (sem 0/o, 1/l/i), em 3 blocos. */
export function generateSyncCode(): string {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = [...bytes].map((b) => abc[b % abc.length]).join('');
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8)}`;
}

let running: Promise<SyncResult> | null = null;

/** Envia os estados deste aparelho, recebe o conjunto mesclado e grava o que chegou mais novo. */
export function syncNow(): Promise<SyncResult> {
  running ??= doSync().finally(() => {
    running = null;
  });
  return running;
}

async function doSync(): Promise<SyncResult> {
  const code = await getSyncCode();
  if (!code) throw new SyncError('no_code', 'Sem código de sincronização.');
  if (!navigator.onLine) throw new SyncError('offline', 'Sem internet.');

  const db = await getDB();
  const local = (await db.getAll('review_states')).filter(isValidReviewState);
  const localProgress = await db.getAll('momento_progress');
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code, states: local, progress: localProgress }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (e) {
    const name = (e as DOMException)?.name;
    throw new SyncError(name === 'TimeoutError' ? 'timeout' : navigator.onLine ? 'network' : 'offline', (e as Error).message);
  }
  const data = (await res.json().catch(() => null)) as { states?: unknown[]; progress?: unknown[]; error?: SyncErrorCode; message?: string } | null;
  if (!res.ok || !data || !Array.isArray(data.states)) {
    throw new SyncError(data?.error ?? 'upstream', data?.message ?? `HTTP ${res.status}`);
  }

  // Grava só o que é válido, de uma palavra que existe aqui, e mais novo que o local.
  const words = content().wordById;
  const tx = db.transaction('review_states', 'readwrite');
  let updated = 0;
  for (const s of data.states as ReviewState[]) {
    if (!isValidReviewState(s) || !words.has(s.word_id)) continue;
    const incoming = s;
    const mine = await tx.store.get([incoming.user_id, incoming.word_id]);
    if (!mine || isNewer(incoming as never, mine as never)) {
      await tx.store.put(incoming);
      updated++;
    }
  }
  await tx.done;

  // Momentos: concluído continua concluído; a frase mais recente vale.
  const moTx = db.transaction('momento_progress', 'readwrite');
  for (const p of (Array.isArray(data.progress) ? data.progress : []) as MomentoProgress[]) {
    if (!looksLikeProgress(p)) continue;
    const mine = await moTx.store.get([p.user_id, p.momento_id]);
    const merged = mine ? mergeProgressPair(mine, p) : p;
    if (progressChanged(mine, merged)) {
      await moTx.store.put(merged);
      updated++;
    }
  }
  await moTx.done;

  const result: SyncResult = { at: new Date().toISOString(), sent: local.length, updated };
  await setMeta(LAST_KEY, result);
  return result;
}

/** Mensagem curta para Ajustes. */
export function describeSyncError(code: SyncErrorCode): string {
  switch (code) {
    case 'offline':
      return 'Sem internet agora. O app sincroniza na próxima abertura com conexão.';
    case 'bad_code':
      return 'O código precisa ter pelo menos 8 caracteres.';
    case 'busy':
      return 'Muitas sincronizações seguidas. Espere alguns minutos.';
    case 'conflict':
      return 'Os dois aparelhos sincronizaram ao mesmo tempo. Tente de novo.';
    case 'no_code':
      return 'Defina um código primeiro.';
    default:
      return 'Não deu pra sincronizar agora. O progresso deste aparelho continua salvo.';
  }
}
