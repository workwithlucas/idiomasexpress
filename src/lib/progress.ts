import { getDB } from '../db/database';
import type { Activity, ReviewState, User } from '../db/schema';

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
}

export async function exportProgress(): Promise<ProgressFile> {
  const db = await getDB();
  const [users, review_states, activity] = await Promise.all([
    db.getAll('users'),
    db.getAll('review_states'),
    db.getAll('activity'),
  ]);
  return { app: 'idiomasexpress', type: 'progress', version: 1, exported_at: new Date().toISOString(), users, review_states, activity };
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
}

function isProgressFile(x: unknown): x is ProgressFile {
  const p = x as ProgressFile;
  return (
    !!p && p.app === 'idiomasexpress' && p.type === 'progress' && p.version === 1 &&
    Array.isArray(p.users) && Array.isArray(p.review_states) && Array.isArray(p.activity)
  );
}

function isReviewState(r: ReviewState): boolean {
  return typeof r?.user_id === 'string' && typeof r.word_id === 'string' && typeof r.due_at === 'string' &&
    !Number.isNaN(Date.parse(r.due_at)) && typeof r.stability === 'number' && typeof r.difficulty === 'number';
}

/**
 * Mescla um arquivo exportado com o banco local. Conflito numa mesma palavra
 * do mesmo usuário: vence o estado revisado mais recentemente (last_review),
 * e em empate o que tiver mais repetições. Atividades são unidas por id.
 */
export async function importProgress(raw: unknown): Promise<ImportSummary> {
  if (!isProgressFile(raw)) throw new Error('Arquivo inválido: não é uma exportação de progresso do Idiomas Express.');
  const db = await getDB();
  const tx = db.transaction(['users', 'review_states', 'activity', 'words'], 'readwrite');
  const summary: ImportSummary = { statesAdded: 0, statesUpdated: 0, statesKept: 0, activityAdded: 0 };

  const validWords = new Set(await tx.objectStore('words').getAllKeys());
  for (const u of raw.users) {
    if (typeof u?.id === 'string' && typeof u.name === 'string' && !(await tx.objectStore('users').get(u.id))) {
      await tx.objectStore('users').put(u);
    }
  }

  const rank = (r: ReviewState) => [r.last_review ?? '', r.reps ?? 0] as const;
  for (const incoming of raw.review_states) {
    if (!isReviewState(incoming) || !validWords.has(incoming.word_id)) continue;
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
  await tx.done;
  return summary;
}
