import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  Activity, CognateRule, FalseCognate, Frame, MinimalPair, ReadingRule, ReviewState, Scene, SeedData, User, Word,
} from './schema';

export interface AppDB extends DBSchema {
  words: { key: string; value: Word; indexes: { by_rank: number; by_theme: string } };
  cognate_rules: { key: string; value: CognateRule };
  false_cognates: { key: string; value: FalseCognate };
  reading_rules: { key: string; value: ReadingRule };
  minimal_pairs: { key: string; value: MinimalPair };
  frames: { key: string; value: Frame };
  scenes: { key: string; value: Scene };
  users: { key: string; value: User };
  review_states: {
    key: [string, string]; // [user_id, word_id]
    value: ReviewState;
    indexes: { by_user: string; by_user_due: [string, string] };
  };
  activity: { key: string; value: Activity; indexes: { by_user_at: [string, string] } };
  meta: { key: string; value: { key: string; value: unknown } };
}

export type DB = IDBPDatabase<AppDB>;

const DB_NAME = 'idiomasexpress';
const DB_VERSION = 1;

/** Tabelas de conteúdo: substituídas quando chega um seed novo. */
export const CONTENT_STORES = [
  'words', 'cognate_rules', 'false_cognates', 'reading_rules', 'minimal_pairs', 'frames', 'scenes',
] as const;

/** Ordem pedagógica do seed (as object stores devolvem registros ordenados por id). */
export type ContentOrder = Partial<Record<'cognate_rules' | 'reading_rules' | 'frames' | 'scenes' | 'minimal_pairs', string[]>>;

let dbPromise: Promise<DB> | null = null;

export function getDB(): Promise<DB> {
  dbPromise ??= openDB<AppDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const words = db.createObjectStore('words', { keyPath: 'id' });
      words.createIndex('by_rank', 'freq_rank');
      words.createIndex('by_theme', 'theme');
      db.createObjectStore('cognate_rules', { keyPath: 'id' });
      db.createObjectStore('false_cognates', { keyPath: 'id' });
      db.createObjectStore('reading_rules', { keyPath: 'id' });
      db.createObjectStore('minimal_pairs', { keyPath: 'id' });
      db.createObjectStore('frames', { keyPath: 'id' });
      db.createObjectStore('scenes', { keyPath: 'id' });
      db.createObjectStore('users', { keyPath: 'id' });
      const rs = db.createObjectStore('review_states', { keyPath: ['user_id', 'word_id'] });
      rs.createIndex('by_user', 'user_id');
      // ISO 8601 em UTC ordena lexicograficamente = cronologicamente,
      // o que permite buscar "vencidos até agora" com um IDBKeyRange.
      rs.createIndex('by_user_due', ['user_id', 'due_at']);
      const act = db.createObjectStore('activity', { keyPath: 'id' });
      act.createIndex('by_user_at', ['user_id', 'at']);
      db.createObjectStore('meta', { keyPath: 'key' });
    },
    blocked() {
      console.warn('IndexedDB bloqueado por outra aba aberta com versão antiga.');
    },
  });
  return dbPromise;
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await (await getDB()).get('meta', key);
  return row?.value as T | undefined;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await (await getDB()).put('meta', { key, value });
}

/**
 * Popula (ou atualiza) as tabelas de conteúdo com o seed, numa única transação.
 * Nunca apaga progresso (review_states, activity) nem renomeia usuários existentes.
 * O flag audio_generated das palavras já existentes é preservado.
 */
export async function applySeed(seed: SeedData): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([...CONTENT_STORES, 'users', 'meta'] as const, 'readwrite');

  const previousAudio = new Map<string, boolean>();
  for (const w of await tx.objectStore('words').getAll()) previousAudio.set(w.id, w.audio_generated);

  await Promise.all(CONTENT_STORES.map((s) => tx.objectStore(s).clear()));

  const puts: Promise<unknown>[] = [];
  for (const w of seed.words) {
    puts.push(tx.objectStore('words').put({ ...w, audio_generated: previousAudio.get(w.id) ?? w.audio_generated }));
  }
  seed.cognate_rules.forEach((r) => puts.push(tx.objectStore('cognate_rules').put(r)));
  seed.false_cognates.forEach((r) => puts.push(tx.objectStore('false_cognates').put(r)));
  seed.reading_rules.forEach((r) => puts.push(tx.objectStore('reading_rules').put(r)));
  seed.minimal_pairs.forEach((r) => puts.push(tx.objectStore('minimal_pairs').put(r)));
  seed.frames.forEach((r) => puts.push(tx.objectStore('frames').put(r)));
  seed.scenes.forEach((r) => puts.push(tx.objectStore('scenes').put(r)));

  const users = tx.objectStore('users');
  for (const u of seed.users) {
    puts.push(users.get(u.id).then((existing) => (existing ? undefined : users.put(u))));
  }
  const order: ContentOrder = {
    cognate_rules: seed.cognate_rules.map((r) => r.id),
    reading_rules: seed.reading_rules.map((r) => r.id),
    frames: seed.frames.map((r) => r.id),
    scenes: seed.scenes.map((r) => r.id),
    minimal_pairs: seed.minimal_pairs.map((r) => r.id),
  };
  puts.push(tx.objectStore('meta').put({ key: 'content_order', value: order }));
  puts.push(tx.objectStore('meta').put({ key: 'seed_version', value: seed.version }));
  puts.push(tx.objectStore('meta').put({ key: 'seeded_at', value: new Date().toISOString() }));

  await Promise.all(puts);
  await tx.done;
}

/**
 * Garante que o banco está populado. Busca o seed JSON só quando necessário:
 * primeiro uso ou versão de seed mais nova que a gravada.
 * Retorna true se populou/atualizou nesta chamada.
 */
export async function ensureSeeded(
  expectedVersion: number,
  fetchSeed: () => Promise<SeedData> = defaultFetchSeed,
): Promise<boolean> {
  const current = await getMeta<number>('seed_version');
  if (current !== undefined && current >= expectedVersion) return false;
  const seed = await fetchSeed();
  await applySeed(seed);
  return true;
}

async function defaultFetchSeed(): Promise<SeedData> {
  const res = await fetch(`${import.meta.env.BASE_URL}seed/seed.json`);
  if (!res.ok) throw new Error(`Falha ao carregar o conteúdo inicial (HTTP ${res.status}).`);
  return (await res.json()) as SeedData;
}

/** Só para testes: fecha e esquece a conexão atual. */
export async function _resetDBConnection(): Promise<void> {
  if (dbPromise) (await dbPromise).close();
  dbPromise = null;
}
