import { getDB, getMeta, type ContentOrder } from './database';
import type {
  Activity, Chapter, CognateRule, FalseCognate, Frame, MinimalPair, ModuleId, Momento, MomentoProgress, PronunciationRecord, ReadingRule, ReviewResult, ReviewState, Scene, User, Word,
} from './schema';
import { dayKey, endOfLocalDay, now, startOfLocalDay } from '../lib/clock';
import { mixByOrigin, reviewWordIds, wordOrigins } from '../lib/momento';
import { isValidReviewState, newReviewState, review as fsrsReview } from '../lib/fsrs';
import { scoredWords } from '../lib/pronunciationHistory';
import type { PronunciationResult } from '../lib/pronunciation';

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
  chapters: Chapter[];
  momentos: Momento[];
  momentoById: Map<string, Momento>;
  /** Momento em que cada palavra aparece pela primeira vez. */
  wordOrigin: Map<string, string>;
  pairById: Map<string, MinimalPair>;
}

let contentCache: Content | null = null;

export async function loadContent(force = false): Promise<Content> {
  if (contentCache && !force) return contentCache;
  const db = await getDB();
  const [words, cognateRules, falseCognates, readingRules, minimalPairs, frames, scenes, chapters, momentos] = await Promise.all([
    db.getAllFromIndex('words', 'by_rank'),
    db.getAll('cognate_rules'),
    db.getAll('false_cognates'),
    db.getAll('reading_rules'),
    db.getAll('minimal_pairs'),
    db.getAll('frames'),
    db.getAll('scenes'),
    db.getAll('chapters'),
    db.getAll('momentos'),
  ]);
  chapters.sort((a, b) => a.order - b.order);
  momentos.sort((a, b) => a.order - b.order);
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
    chapters,
    momentos,
    momentoById: new Map(momentos.map((m) => [m.id, m])),
    wordOrigin: wordOrigins(momentos),
    pairById: new Map(minimalPairs.map((p) => [p.id, p])),
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

export async function rateWord(userId: string, wordId: string, result: ReviewResult): Promise<ReviewState> {
  const db = await getDB();
  const at = now();
  const stored = await db.get('review_states', [userId, wordId]);
  const current = stored && isValidReviewState(stored) ? stored : newReviewState(userId, wordId, at);
  const next = fsrsReview(current, result, at);
  await db.put('review_states', next);
  await logActivity(userId, 'reencontro', 'rate', { word_id: wordId, correct: result !== 'again' });
  return next;
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


// ---- Histórico de pronúncia ----------------------------------------------

/** Guarda a nota de cada palavra do banco presente na gravação. Devolve os registros salvos. */
export async function savePronunciation(
  userId: string,
  text: string,
  result: PronunciationResult,
  targetWordId?: string,
): Promise<PronunciationRecord[]> {
  const at = now().toISOString();
  const words = contentCache?.words ?? [];
  const records: PronunciationRecord[] = scoredWords(result, words, targetWordId).map((s) => ({
    id: crypto.randomUUID(),
    user_id: userId,
    at,
    text,
    overall: result.pronunciation,
    ...s,
  }));
  if (!records.length) return records;
  const tx = (await getDB()).transaction('pronunciation_history', 'readwrite');
  await Promise.all([...records.map((r) => tx.store.put(r)), tx.done]);
  return records;
}

/** Evolução de uma palavra, da nota mais antiga para a mais recente. */
export async function getPronunciationHistory(userId: string, wordId: string): Promise<PronunciationRecord[]> {
  const range = IDBKeyRange.bound([userId, wordId, ''], [userId, wordId, '\uffff']);
  return (await getDB()).getAllFromIndex('pronunciation_history', 'by_user_word_at', range);
}

// ---- Momentos ----------------------------------------------------------------

export async function getMomentoProgress(userId: string): Promise<MomentoProgress[]> {
  return (await getDB()).getAllFromIndex('momento_progress', 'by_user', userId);
}

/** Momentos concluídos, por id. */
export async function completedMomentos(userId: string): Promise<Map<string, MomentoProgress>> {
  return new Map((await getMomentoProgress(userId)).map((p) => [p.momento_id, p]));
}

/** O próximo Momento da trilha: o primeiro ainda não concluído. */
export function nextMomento(done: Map<string, MomentoProgress>): Momento | undefined {
  return content().momentos.find((m) => !done.has(m.id));
}

/** Início do dia seguinte: palavras novas voltam amanhã, nunca no mesmo dia. */
function tomorrow(): Date {
  const d = startOfLocalDay(now());
  d.setDate(d.getDate() + 1);
  return d;
}

/**
 * Conclui um Momento: guarda a frase (o primeiro completed_at fica), põe as
 * palavras nos reencontros a partir de amanhã e registra a atividade.
 * Devolve se foi a primeira conclusão deste Momento.
 */
export async function completeMomento(userId: string, momentoId: string, builtPhrase: string, slotWordId?: string): Promise<boolean> {
  const c = content();
  const m = c.momentoById.get(momentoId);
  if (!m) throw new Error('Momento não encontrado.');
  const db = await getDB();
  const at = now().toISOString();
  const tx = db.transaction(['momento_progress', 'review_states'], 'readwrite');
  const progress = tx.objectStore('momento_progress');
  const existing = await progress.get([userId, momentoId]);
  await progress.put({ user_id: userId, momento_id: momentoId, completed_at: existing?.completed_at ?? at, built_phrase: builtPhrase, updated_at: at });
  const states = tx.objectStore('review_states');
  const due = tomorrow().toISOString();
  for (const wordId of reviewWordIds(m, c.wordById, [slotWordId])) {
    if (await states.get([userId, wordId])) continue;
    await states.put({ ...newReviewState(userId, wordId, now()), due_at: due });
  }
  await tx.done;
  await logActivity(userId, 'momento', `complete:${momentoId}`);
  return !existing;
}

// ---- Reencontros -----------------------------------------------------------

/** Até 8 reencontros por dia antes do Momento (cerca de 2 minutos). */
export const REENCONTROS_PER_DAY = 8;

export type Reencontro = { type: 'word'; wordId: string } | { type: 'phrase'; momentoId: string };

const isToday = (iso: string) => dayKey(new Date(iso)) === dayKey(now());

/** Reencontros já feitos hoje (palavras avaliadas e frases revistas). */
export async function reencontrosDoneToday(userId: string): Promise<number> {
  const start = startOfLocalDay(now()).toISOString();
  const end = endOfLocalDay(now()).toISOString();
  const range = IDBKeyRange.bound([userId, start], [userId, end]);
  const today = await (await getDB()).getAllFromIndex('activity', 'by_user_at', range);
  return today.filter((a) => a.module === 'reencontro').length;
}

/** Frases de Momentos de dias anteriores que ainda não voltaram. */
async function pendingPhrases(userId: string): Promise<string[]> {
  const done = await getMomentoProgress(userId);
  const seen = new Set((await getActivity(userId)).filter((a) => a.kind.startsWith('phrase:')).map((a) => a.kind.slice('phrase:'.length)));
  return done
    .filter((p) => !isToday(p.completed_at) && !seen.has(p.momento_id) && content().momentoById.has(p.momento_id))
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    .map((p) => p.momento_id);
}

/**
 * Fila de reencontros: primeiro a frase do último Momento (se ainda não voltou),
 * depois as palavras vencidas, misturando Momentos diferentes.
 * `skip` pula as primeiras vencidas (as que ficam para a fila de hoje).
 */
export async function buildReencontros(userId: string, limit: number, opts: { phrases?: boolean; skip?: number } = {}): Promise<Reencontro[]> {
  if (limit <= 0) return [];
  const c = content();
  const out: Reencontro[] = [];
  if (opts.phrases !== false) {
    const [phrase] = await pendingPhrases(userId);
    if (phrase) out.push({ type: 'phrase', momentoId: phrase });
  }
  const due = (await getDueStates(userId)).sort((a, b) => a.due_at.localeCompare(b.due_at)).slice(opts.skip ?? 0);
  const words = mixByOrigin(due.slice(0, limit - out.length), (s) => c.wordOrigin.get(s.word_id));
  out.push(...words.map((s) => ({ type: 'word' as const, wordId: s.word_id })));
  return out;
}

/** Quantos reencontros a tela Hoje oferece agora (0 se já fez os do dia ou pulou). */
export async function todaysReencontros(userId: string, skippedToday: boolean): Promise<Reencontro[]> {
  if (skippedToday) return [];
  const left = REENCONTROS_PER_DAY - (await reencontrosDoneToday(userId));
  return buildReencontros(userId, left);
}

/** Palavras vencidas além das de hoje: vão para "Revisar mais", no Caderno. */
export async function extraReviewCount(userId: string, skippedToday: boolean): Promise<number> {
  const due = (await getDueStates(userId)).length;
  const reserved = skippedToday ? 0 : Math.max(0, REENCONTROS_PER_DAY - (await reencontrosDoneToday(userId)));
  return Math.max(0, due - reserved);
}

/** Marca a frase de um Momento como revista (não volta de novo). */
export async function markPhraseSeen(userId: string, momentoId: string): Promise<void> {
  await logActivity(userId, 'reencontro', `phrase:${momentoId}`);
}
