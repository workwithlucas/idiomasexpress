import { getDB, getMeta, type ContentOrder } from './database';
import type {
  Activity, CognateRule, FalseCognate, Frame, MinimalPair, ModuleId, ReadingRule, ReviewResult, ReviewState, Scene, User, Word,
} from './schema';
import { dayKey, endOfLocalDay, now, startOfLocalDay } from '../lib/clock';
import { isValidReviewState, newReviewState, review as fsrsReview, MATURE_STABILITY_DAYS } from '../lib/fsrs';

/** Conteúdo é pequeno (~500 palavras) e só muda com um seed novo:
 *  carregamos tudo em memória uma vez para as telas ficarem instantâneas. */
export interface Content {
  words: Word[];
  wordById: Map<string, Word>;
  cognateRules: CognateRule[];
  ruleById: Map<string, CognateRule>;
  falseCognates: FalseCognate[];
  readingRules: ReadingRule[];
  minimalPairs: MinimalPair[];
  frames: Frame[];
  frameById: Map<string, Frame>;
  scenes: Scene[];
  sceneById: Map<string, Scene>;
}

let contentCache: Content | null = null;

export async function loadContent(force = false): Promise<Content> {
  if (contentCache && !force) return contentCache;
  const db = await getDB();
  const [words, cognateRules, falseCognates, readingRules, minimalPairs, frames, scenes] = await Promise.all([
    db.getAllFromIndex('words', 'by_rank'),
    db.getAll('cognate_rules'),
    db.getAll('false_cognates'),
    db.getAll('reading_rules'),
    db.getAll('minimal_pairs'),
    db.getAll('frames'),
    db.getAll('scenes'),
  ]);
  // As stores devolvem por id; restauramos a ordem pedagógica do seed.
  const order = (await getMeta<ContentOrder>('content_order')) ?? {};
  const byOrder = <T extends { id: string }>(list: T[], ids?: string[]) => {
    if (!ids) return list;
    const pos = new Map(ids.map((id, i) => [id, i]));
    return list.sort((a, b) => (pos.get(a.id) ?? 1e9) - (pos.get(b.id) ?? 1e9));
  };
  byOrder(cognateRules, order.cognate_rules);
  byOrder(readingRules, order.reading_rules);
  byOrder(frames, order.frames);
  byOrder(scenes, order.scenes);
  byOrder(minimalPairs, order.minimal_pairs);
  contentCache = {
    words,
    wordById: new Map(words.map((w) => [w.id, w])),
    cognateRules,
    ruleById: new Map(cognateRules.map((r) => [r.id, r])),
    falseCognates,
    readingRules,
    minimalPairs,
    frames,
    frameById: new Map(frames.map((f) => [f.id, f])),
    scenes,
    sceneById: new Map(scenes.map((s) => [s.id, s])),
  };
  return contentCache;
}

export function content(): Content {
  if (!contentCache) throw new Error('Conteúdo ainda não carregado');
  return contentCache;
}

export async function markAudioGenerated(wordId: string): Promise<void> {
  const word = contentCache?.wordById.get(wordId);
  if (!word || word.audio_generated) return;
  word.audio_generated = true;
  const db = await getDB();
  const stored = await db.get('words', wordId);
  if (stored && !stored.audio_generated) await db.put('words', { ...stored, audio_generated: true });
}

// ---- Usuários --------------------------------------------------------------

export async function listUsers(): Promise<User[]> {
  const users = await (await getDB()).getAll('users');
  return users.sort((a, b) => a.name.localeCompare(b.name));
}

// ---- Revisão espaçada ------------------------------------------------------

/**
 * Estado utilizável: campos válidos para o FSRS e palavra existente no conteúdo
 * atual. Estados órfãos (palavra removida de um seed) ficam guardados, mas não
 * entram em filas nem contadores.
 */
function usable(rs: ReviewState | undefined): rs is ReviewState {
  return !!rs && isValidReviewState(rs) && !!contentCache?.wordById.has(rs.word_id);
}

export async function getReviewState(userId: string, wordId: string): Promise<ReviewState | undefined> {
  const rs = await (await getDB()).get('review_states', [userId, wordId]);
  return usable(rs) ? rs : undefined;
}

export async function getUserReviewStates(userId: string): Promise<ReviewState[]> {
  return (await (await getDB()).getAllFromIndex('review_states', 'by_user', userId)).filter(usable);
}

/** Estados com due_at <= instante (padrão: agora). */
export async function getDueStates(userId: string, until: Date = now()): Promise<ReviewState[]> {
  const range = IDBKeyRange.bound([userId, ''], [userId, until.toISOString()]);
  return (await (await getDB()).getAllFromIndex('review_states', 'by_user_due', range)).filter(usable);
}

/**
 * Recupera estados de revisão corrompidos (campos ausentes/NaN, datas inválidas):
 * a palavra volta a ser "nova" em vez de travar a tela de revisão.
 * Retorna quantos foram reparados.
 */
export async function repairReviewStates(): Promise<number> {
  const db = await getDB();
  const tx = db.transaction('review_states', 'readwrite');
  let repaired = 0;
  let cursor = await tx.store.openCursor();
  while (cursor) {
    const rs = cursor.value;
    if (!isValidReviewState(rs) && typeof rs?.user_id === 'string' && typeof rs.word_id === 'string') {
      const fresh = newReviewState(rs.user_id, rs.word_id, now());
      if (typeof rs.created_at === 'string' && !Number.isNaN(Date.parse(rs.created_at))) fresh.created_at = rs.created_at;
      await cursor.update(fresh);
      repaired++;
    }
    cursor = await cursor.continue();
  }
  await tx.done;
  return repaired;
}

/** Próximas palavras novas (sem ReviewState), em ordem de frequência. */
export async function getNewWords(userId: string, limit: number): Promise<Word[]> {
  if (limit <= 0) return [];
  const known = new Set((await getUserReviewStates(userId)).map((r) => r.word_id));
  return content().words.filter((w) => !known.has(w.id)).slice(0, limit);
}

/** Quantas palavras entraram na revisão hoje (para respeitar o limite diário). */
export async function countIntroducedToday(userId: string): Promise<number> {
  const start = startOfLocalDay(now()).toISOString();
  const end = endOfLocalDay(now()).toISOString();
  return (await getUserReviewStates(userId)).filter((r) => r.created_at >= start && r.created_at <= end).length;
}

/** Adiciona a palavra à revisão (vencendo agora), se ainda não estiver. */
export async function addToReview(userId: string, wordId: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('review_states', [userId, wordId]);
  if (existing) return false;
  await db.put('review_states', newReviewState(userId, wordId, now()));
  return true;
}

export async function rateWord(userId: string, wordId: string, result: ReviewResult): Promise<ReviewState> {
  const db = await getDB();
  const at = now();
  const stored = await db.get('review_states', [userId, wordId]);
  const current = stored && isValidReviewState(stored) ? stored : newReviewState(userId, wordId, at);
  const next = fsrsReview(current, result, at);
  await db.put('review_states', next);
  await logActivity(userId, 'review', 'rate', { word_id: wordId, correct: result !== 'again' });
  return next;
}

export interface ReviewStats {
  inStudy: number;
  mature: number;
  dueNow: number;
  dueToday: number;
  nextDue: Date | null;
}

export async function getReviewStats(userId: string): Promise<ReviewStats> {
  const states = await getUserReviewStates(userId);
  const t = now();
  const nowIso = t.toISOString();
  const endIso = endOfLocalDay(t).toISOString();
  let dueNow = 0;
  let dueToday = 0;
  let mature = 0;
  let nextDue: string | null = null;
  for (const s of states) {
    if (s.due_at <= nowIso) dueNow++;
    if (s.due_at <= endIso) dueToday++;
    if (s.stability >= MATURE_STABILITY_DAYS) mature++;
    if (s.due_at > nowIso && (!nextDue || s.due_at < nextDue)) nextDue = s.due_at;
  }
  return { inStudy: states.length, mature, dueNow, dueToday, nextDue: nextDue ? new Date(nextDue) : null };
}

// ---- Atividade -------------------------------------------------------------

export async function logActivity(
  userId: string,
  module: ModuleId,
  kind: string,
  extra: Partial<Pick<Activity, 'correct' | 'word_id' | 'score'>> = {},
): Promise<void> {
  const entry: Activity = { id: crypto.randomUUID(), user_id: userId, at: now().toISOString(), module, kind, ...extra };
  await (await getDB()).put('activity', entry);
}

export async function getActivity(userId: string): Promise<Activity[]> {
  const range = IDBKeyRange.bound([userId, ''], [userId, '￿']);
  return (await getDB()).getAllFromIndex('activity', 'by_user_at', range);
}

/** Dias seguidos com alguma atividade, terminando hoje (ou ontem, se hoje ainda está vazio). */
export function computeStreak(activity: Activity[], today: Date = now()): number {
  const days = new Set(activity.map((a) => dayKey(new Date(a.at))));
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function modulesPracticedToday(activity: Activity[], today: Date = now()): Set<ModuleId> {
  const key = dayKey(today);
  return new Set(activity.filter((a) => dayKey(new Date(a.at)) === key).map((a) => a.module));
}

/**
 * Regras (de cognato ou de leitura) que o perfil já descobriu. Registradas
 * como atividade "discover:<id>" — sem tabela nova.
 */
export async function getDiscovered(userId: string): Promise<Set<string>> {
  const out = new Set<string>();
  for (const a of await getActivity(userId)) if (a.kind.startsWith('discover:')) out.add(a.kind.slice('discover:'.length));
  return out;
}
