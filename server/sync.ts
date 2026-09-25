/**
 * Sincronização do progresso entre aparelhos por "código de casal".
 *
 * Contrato HTTP (dev e produção):
 *   POST /api/sync   corpo: { code: string, states: ReviewState[], progress?: MomentoProgress[] }
 *        → 200 { states, progress, updated_at } (conjuntos já mesclados)
 *        → 4xx { error, message }
 *
 * O servidor guarda UM documento por código (a chave é o hash do código; o
 * código em si não é guardado). Cada sincronização: lê, mescla, grava só se
 * ninguém gravou no meio (ETag) — senão tenta de novo. Nenhuma revisão se perde
 * mesmo com os dois aparelhos sincronizando ao mesmo tempo.
 */
import { createHash } from 'node:crypto';
import { rateLimiter, sameOrigin } from './guard.ts';
import { looksLikeProgress, looksLikeState, mergeProgress, mergeStates, type SyncProgress, type SyncState } from './syncMerge.ts';

export interface SyncDoc {
  v: 1;
  states: SyncState[];
  /** Momentos concluídos. Documentos antigos não têm (continuam válidos). */
  progress?: SyncProgress[];
  updated_at: string;
}

/** Onde o documento mora: Netlify Blobs em produção, memória em dev/testes. */
export interface SyncStore {
  read(key: string): Promise<{ doc: SyncDoc; etag?: string } | null>;
  /** etag = null → só grava se ainda não existir; string → só se não mudou. Devolve se gravou. */
  write(key: string, doc: SyncDoc, etag: string | null): Promise<boolean>;
}

export type SyncErrorCode = 'forbidden' | 'busy' | 'bad_code' | 'bad_request' | 'conflict' | 'method' | 'upstream';

const MIN_CODE = 8;
const MAX_CODE = 64;
const MAX_STATES = 20_000;
const MAX_BODY = 8 * 1024 * 1024;
const limiter = rateLimiter(60, 10 * 60_000);

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const err = (error: SyncErrorCode, message: string, status: number) => json({ error, message }, status);

/** "  Lu-Edu 2026 " → "lu-edu 2026": maiúsculas e espaços extras não mudam o código. */
export function normalizeCode(code: string): string {
  return code.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function storeKey(code: string): string {
  return createHash('sha256').update(`poliglotas-sync:v1:${normalizeCode(code)}`).digest('hex');
}

export async function handleSync(req: Request, store: SyncStore): Promise<Response> {
  if (req.method !== 'POST') return err('method', 'Use POST.', 405);
  if (!sameOrigin(req)) return err('forbidden', 'Pedido de fora do app.', 403);
  if (limiter.limited(req)) return err('busy', 'Muitas sincronizações seguidas; espere alguns minutos.', 429);

  const raw = await req.text();
  if (raw.length > MAX_BODY) return err('bad_request', 'Progresso grande demais.', 413);
  let body: { code?: unknown; states?: unknown; progress?: unknown };
  try {
    body = JSON.parse(raw);
  } catch {
    return err('bad_request', 'Corpo não é JSON.', 400);
  }
  const code = typeof body.code === 'string' ? normalizeCode(body.code) : '';
  if (code.length < MIN_CODE || code.length > MAX_CODE) return err('bad_code', `O código precisa ter de ${MIN_CODE} a ${MAX_CODE} caracteres.`, 400);
  if (!Array.isArray(body.states) || body.states.length > MAX_STATES) return err('bad_request', 'Lista de estados inválida.', 400);
  const incoming = body.states.filter(looksLikeState);
  if (body.progress !== undefined && (!Array.isArray(body.progress) || body.progress.length > MAX_STATES)) return err('bad_request', 'Lista de momentos inválida.', 400);
  const incomingProgress = ((body.progress as unknown[] | undefined) ?? []).filter(looksLikeProgress);

  const key = storeKey(code);
  for (let attempt = 0; attempt < 5; attempt++) {
    let current;
    try {
      current = await store.read(key);
    } catch (e) {
      return err('upstream', `Armazenamento indisponível: ${(e as Error).message}`, 502);
    }
    const states = mergeStates(current?.doc.states ?? [], incoming);
    const progress = mergeProgress(current?.doc.progress ?? [], incomingProgress);
    const doc: SyncDoc = { v: 1, states, progress, updated_at: new Date().toISOString() };
    let saved: boolean;
    try {
      saved = await store.write(key, doc, current ? current.etag ?? '' : null);
    } catch (e) {
      return err('upstream', `Armazenamento indisponível: ${(e as Error).message}`, 502);
    }
    if (saved) return json({ states, progress, updated_at: doc.updated_at });
    // Outro aparelho gravou no meio: relê e mescla de novo.
  }
  return err('conflict', 'Muitas sincronizações ao mesmo tempo; tente de novo.', 409);
}

/** Loja em memória (dev, preview e testes), com ETag para imitar o Blobs. */
export function memoryStore(): SyncStore {
  const docs = new Map<string, { doc: SyncDoc; etag: string }>();
  let n = 0;
  return {
    async read(key) {
      const d = docs.get(key);
      return d ? { doc: structuredClone(d.doc), etag: d.etag } : null;
    },
    async write(key, doc, etag) {
      const cur = docs.get(key);
      if (etag === null ? cur : cur?.etag !== etag) return false;
      docs.set(key, { doc: structuredClone(doc), etag: `m${++n}` });
      return true;
    },
  };
}
