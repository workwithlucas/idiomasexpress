import { getDB } from '../db/database';
import type { Activity, PronunciationRecord, ReviewState, User } from '../db/schema';
import { isValidReviewState } from './fsrs';

/**
 * Exportação/importação manual de progresso (sincronização entre aparelhos
 * sem servidor). O arquivo inclui os dois perfis.
 */
export interface ProgressFile {
  app: 'idiomasexpress';
  type: 'progress';
  version: 1;
  exported_at: string;
  users: User[];
  review_states: ReviewState[];
  activity: Activity[];
  /** Desde a versão 2 do banco; arquivos antigos não têm (continuam válidos). */
  pronunciation_history?: PronunciationRecord[];
}

export async function exportProgress(): Promise<ProgressFile> {
  const db = await getDB();
  const [users, review_states, activity, pronunciation_history] = await Promise.all([
    db.getAll('users'),
    db.getAll('review_states'),
    db.getAll('activity'),
    db.getAll('pronunciation_history'),
  ]);
  return { app: 'idiomasexpress', type: 'progress', version: 1, exported_at: new Date().toISOString(), users, review_states, activity, pronunciation_history };
}

export function downloadJson(data: unknown, filename: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ImportSummary {
  statesAdded: number;
  statesUpdated: number;
  statesKept: number;
  activityAdded: number;
  pronunciationAdded: number;
}

function isProgressFile(x: unknown): x is ProgressFile {
  const p = x as ProgressFile;
  return (
    !!p && p.app === 'idiomasexpress' && p.type === 'progress' && p.version === 1 &&
    Array.isArray(p.users) && Array.isArray(p.review_states) && Array.isArray(p.activity)
  );
}


/**
 * Mescla um arquivo exportado com o banco local. Conflito numa mesma palavra
 * do mesmo usuário: vence o estado revisado mais recentemente (last_review),
 * e em empate o que tiver mais repetições. Atividades são unidas por id.
 */
export async function importProgress(raw: unknown): Promise<ImportSummary> {
  if (!isProgressFile(raw)) throw new Error('Arquivo inválido: não é uma exportação de progresso do Poliglotas.');
  const db = await getDB();
  const tx = db.transaction(['users', 'review_states', 'activity', 'words', 'pronunciation_history'], 'readwrite');
  const summary: ImportSummary = { statesAdded: 0, statesUpdated: 0, statesKept: 0, activityAdded: 0, pronunciationAdded: 0 };

  const validWords = new Set(await tx.objectStore('words').getAllKeys());
  for (const u of raw.users) {
    if (typeof u?.id === 'string' && typeof u.name === 'string' && !(await tx.objectStore('users').get(u.id))) {
      await tx.objectStore('users').put(u);
    }
  }

  const rank = (r: ReviewState) => [r.last_review ?? '', r.reps ?? 0] as const;
  for (const incoming of raw.review_states) {
    if (!isValidReviewState(incoming) || !validWords.has(incoming.word_id)) continue;
    const store = tx.objectStore('review_states');
    const local = await store.get([incoming.user_id, incoming.word_id]);
    if (!local) {
      await store.put(incoming);
      summary.statesAdded++;
      continue;
    }
    const [li, ri] = [rank(local), rank(incoming)];
    const incomingNewer = ri[0] > li[0] || (ri[0] === li[0] && ri[1] > li[1]);
    if (incomingNewer) {
      await store.put({ ...incoming, created_at: local.created_at < incoming.created_at ? local.created_at : incoming.created_at });
      summary.statesUpdated++;
    } else {
      summary.statesKept++;
    }
  }

  for (const a of raw.activity) {
    if (typeof a?.id !== 'string' || typeof a.user_id !== 'string' || typeof a.at !== 'string') continue;
    const store = tx.objectStore('activity');
    if (!(await store.get(a.id))) {
      await store.put(a);
      summary.activityAdded++;
    }
  }

  for (const r of raw.pronunciation_history ?? []) {
    const ok = typeof r?.id === 'string' && typeof r.user_id === 'string' && typeof r.word_id === 'string' &&
      typeof r.at === 'string' && typeof r.score === 'number' && validWords.has(r.word_id);
    const store = tx.objectStore('pronunciation_history');
    if (ok && !(await store.get(r.id))) {
      await store.put({ ...r, syllables: Array.isArray(r.syllables) ? r.syllables : [] });
      summary.pronunciationAdded++;
    }
  }
  await tx.done;
  return summary;
}
