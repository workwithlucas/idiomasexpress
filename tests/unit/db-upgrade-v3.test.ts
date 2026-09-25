import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { describe, expect, it } from 'vitest';
import seed from '../../public/seed/seed.json';
import type { SeedData } from '../../src/db/schema';
import { _resetDBConnection, ensureSeeded, getDB } from '../../src/db/database';
import { getMomentoProgress, getReviewState, loadContent } from '../../src/db/repo';

/**
 * Quem já usa o app (banco v2, conteúdo v4) abre a versão com Momentos:
 * ReviewState, reps e histórico de pronúncia ficam como estavam.
 */
describe('migração v2 → v3 com conteúdo v4 → v5', () => {
  it('preserva ReviewState, reps e histórico; cria as stores dos Momentos vazias', async () => {
    await _resetDBConnection();
    indexedDB.deleteDatabase('idiomasexpress');
    const v2 = await openDB('idiomasexpress', 2, {
      upgrade(db) {
        db.createObjectStore('words', { keyPath: 'id' }).createIndex('by_rank', 'freq_rank');
        for (const s of ['cognate_rules', 'false_cognates', 'reading_rules', 'minimal_pairs', 'frames', 'scenes', 'users']) db.createObjectStore(s, { keyPath: 'id' });
        const rs = db.createObjectStore('review_states', { keyPath: ['user_id', 'word_id'] });
        rs.createIndex('by_user', 'user_id');
        rs.createIndex('by_user_due', ['user_id', 'due_at']);
        db.createObjectStore('activity', { keyPath: 'id' }).createIndex('by_user_at', ['user_id', 'at']);
        db.createObjectStore('meta', { keyPath: 'key' });
        const ph = db.createObjectStore('pronunciation_history', { keyPath: 'id' });
        ph.createIndex('by_user_word_at', ['user_id', 'word_id', 'at']);
        ph.createIndex('by_user_at', ['user_id', 'at']);
      },
    });
    const state = {
      user_id: 'u_lucas', word_id: 'w_cafe', stability: 12.5, difficulty: 4.2, due_at: '2026-10-01T00:00:00.000Z', last_result: 'good',
      state: 2, reps: 7, lapses: 1, scheduled_days: 12, elapsed_days: 3, learning_steps: 0, last_review: '2026-09-19T08:00:00.000Z', created_at: '2026-09-01T08:00:00.000Z',
    };
    await v2.put('review_states', state);
    await v2.put('pronunciation_history', { id: 'p1', user_id: 'u_lucas', word_id: 'w_cafe', at: '2026-09-10T00:00:00Z', score: 80, error_type: 'None', syllables: [], text: 'café', overall: 80 });
    await v2.put('meta', { key: 'seed_version', value: 4 });
    v2.close();

    const db = await getDB();
    expect(db.version).toBe(3);
    expect(await ensureSeeded(5, async () => seed as SeedData, (seed as SeedData).hash)).toBe(true);
    await loadContent(true);
    expect(await getReviewState('u_lucas', 'w_cafe')).toEqual(state);
    expect(await db.get('pronunciation_history', 'p1')).toMatchObject({ score: 80 });
    expect(await getMomentoProgress('u_lucas')).toEqual([]);
    expect((await db.getAll('momentos')).length).toBe((seed as SeedData).momentos.length);
    // Mesmo seed de novo: não repopula. Hash novo (conteúdo mudou): repopula.
    expect(await ensureSeeded(5, async () => seed as SeedData, (seed as SeedData).hash)).toBe(false);
    expect(await ensureSeeded(5, async () => seed as SeedData, 'outro')).toBe(true);
  });
});
