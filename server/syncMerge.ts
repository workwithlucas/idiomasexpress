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
