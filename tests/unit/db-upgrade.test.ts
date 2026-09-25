import 'fake-indexeddb/auto';
import { openDB } from 'idb';
import { describe, expect, it } from 'vitest';
import { _resetDBConnection, getDB } from '../../src/db/database';
import { getPronunciationHistory, savePronunciation } from '../../src/db/repo';

describe('migração do banco v1 → v2 (histórico de pronúncia)', () => {
  it('cria a store nova sem perder o progresso de quem já usa o app', async () => {
    await _resetDBConnection();
    // Banco como a v1 deixou: com um estado de revisão salvo.
    const v1 = await openDB('idiomasexpress', 1, {
      upgrade(db) {
        db.createObjectStore('review_states', { keyPath: ['user_id', 'word_id'] });
        db.createObjectStore('meta', { keyPath: 'key' });
      },
    });
    await v1.put('review_states', { user_id: 'u_lucas', word_id: 'w_cafe', reps: 4 });
    v1.close();

    const db = await getDB();
    expect(db.version).toBe(2);
    expect([...db.objectStoreNames]).toContain('pronunciation_history');
    expect(await db.get('review_states', ['u_lucas', 'w_cafe'])).toMatchObject({ reps: 4 });

    const result = {
      recognizedText: 'Café.', accuracy: 70, fluency: 90, completeness: 100, pronunciation: 72,
      words: [{ word: 'Café', accuracy: 70, errorType: 'None', phonemes: [], syllables: [{ grapheme: 'ca', accuracy: 90 }, { grapheme: 'fé', accuracy: 50 }] }],
    };
    await savePronunciation('u_lucas', 'café', result, 'w_cafe');
    await new Promise((r) => setTimeout(r, 5)); // horários diferentes
    await savePronunciation('u_lucas', 'café', { ...result, pronunciation: 88, words: [{ ...result.words[0], accuracy: 88 }] }, 'w_cafe');
    const hist = await getPronunciationHistory('u_lucas', 'w_cafe');
    expect(hist.map((h) => h.score)).toEqual([70, 88]); // em ordem cronológica: dá pra ver a evolução
    expect(hist[0].syllables).toEqual([{ grapheme: 'ca', accuracy: 90 }, { grapheme: 'fé', accuracy: 50 }]);
    expect(await getPronunciationHistory('u_eduarda', 'w_cafe')).toEqual([]);
  });
});
