/**
 * Mescla de estados de revisão (ReviewState) entre aparelhos. Usada pela
 * sincronização (servidor e app) e pela importação manual, para que as duas
 * decidam conflitos do mesmo jeito.
 *
 * Regra por (user_id, word_id): vence a revisão mais recente (last_review);
 * empate → mais repetições (reps). O estado vencedor vai INTEIRO — inclusive
 * reps, que decide a alternância reconhecer/produzir — nunca campo a campo.
 */
export interface SyncState {
  user_id: string;
  word_id: string;
  last_review: string | null;
  reps: number;
  created_at: string;
  [k: string]: unknown;
}

const key = (s: SyncState) => `${s.user_id}\u0000${s.word_id}`;

/** O estado b deve substituir a? */
export function isNewer(b: SyncState, a: SyncState): boolean {
  const lb = b.last_review ?? '';
  const la = a.last_review ?? '';
  return lb > la || (lb === la && (b.reps ?? 0) > (a.reps ?? 0));
}

/** Formato mínimo aceitável (o app valida o resto antes de gravar). */
export function looksLikeState(x: unknown): x is SyncState {
  const s = x as SyncState;
  return (
    !!s && typeof s === 'object' &&
    typeof s.user_id === 'string' && s.user_id.length > 0 && s.user_id.length <= 64 &&
    typeof s.word_id === 'string' && s.word_id.length > 0 && s.word_id.length <= 128 &&
    (s.last_review === null || typeof s.last_review === 'string') &&
    typeof s.reps === 'number' && Number.isFinite(s.reps) && s.reps >= 0 &&
    typeof s.created_at === 'string'
  );
}

/** Mescla duas listas; o resultado tem um estado por (user_id, word_id). */
export function mergeStates(base: SyncState[], incoming: SyncState[]): SyncState[] {
  const out = new Map<string, SyncState>();
  for (const s of base) out.set(key(s), s);
  for (const s of incoming) {
    const cur = out.get(key(s));
    if (!cur || isNewer(s, cur)) out.set(key(s), s);
  }
  return [...out.values()];
}

/**
 * Momentos concluídos (momento_progress). Regra por (user_id, momento_id):
 *  - concluído continua concluído (união: nada some);
 *  - completed_at: vale o mais antigo;
 *  - built_phrase: vale o do registro com updated_at mais recente.
 */
export interface SyncProgress {
  user_id: string;
  momento_id: string;
  completed_at: string;
  built_phrase: string;
  updated_at: string;
}

export function looksLikeProgress(x: unknown): x is SyncProgress {
  const p = x as SyncProgress;
  return (
    !!p && typeof p === 'object' &&
    typeof p.user_id === 'string' && p.user_id.length > 0 && p.user_id.length <= 64 &&
    typeof p.momento_id === 'string' && p.momento_id.length > 0 && p.momento_id.length <= 64 &&
    typeof p.completed_at === 'string' && typeof p.updated_at === 'string' &&
    typeof p.built_phrase === 'string' && p.built_phrase.length <= 500
  );
}

export function mergeProgressPair(a: SyncProgress, b: SyncProgress): SyncProgress {
  const newer = b.updated_at > a.updated_at ? b : a;
  return {
    user_id: a.user_id,
    momento_id: a.momento_id,
    completed_at: a.completed_at < b.completed_at ? a.completed_at : b.completed_at,
    built_phrase: newer.built_phrase,
    updated_at: newer.updated_at,
  };
}

const pkey = (p: SyncProgress) => `${p.user_id}\u0000${p.momento_id}`;

export function mergeProgress(base: SyncProgress[], incoming: SyncProgress[]): SyncProgress[] {
  const out = new Map<string, SyncProgress>();
  for (const p of [...base, ...incoming]) {
    const cur = out.get(pkey(p));
    out.set(pkey(p), cur ? mergeProgressPair(cur, p) : p);
  }
  return [...out.values()];
}

/** O registro mesclado difere do local (precisa gravar aqui)? */
export function progressChanged(local: SyncProgress | undefined, merged: SyncProgress): boolean {
  return !local || local.completed_at !== merged.completed_at || local.built_phrase !== merged.built_phrase || local.updated_at !== merged.updated_at;
}
