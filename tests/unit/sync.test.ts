import { describe, expect, it } from 'vitest';
import { handleSync, memoryStore, normalizeCode, storeKey, type SyncStore } from '../../server/sync';
import { isNewer, mergeStates, type SyncState } from '../../server/syncMerge';

const st = (word: string, reps: number, last: string | null, user = 'u_lucas'): SyncState => ({
  user_id: user, word_id: word, reps, last_review: last, created_at: '2026-09-01T00:00:00.000Z',
  due_at: '2026-10-01T00:00:00.000Z', stability: 1, difficulty: 5, state: 2, lapses: 0, scheduled_days: 1, elapsed_days: 0, learning_steps: 0, last_result: 'good',
});
const post = (body: unknown, headers: Record<string, string> = { 'sec-fetch-site': 'same-origin' }) =>
  new Request('http://x/api/sync', { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
const CODE = 'lu-edu-2026-xyz';

describe('mescla de ReviewState', () => {
  it('revisão mais recente vence; empate → mais reps; o estado vai inteiro (reps junto)', () => {
    expect(isNewer(st('w', 2, '2026-09-10T10:00:00Z'), st('w', 5, '2026-09-09T10:00:00Z'))).toBe(true);
    expect(isNewer(st('w', 3, '2026-09-10T10:00:00Z'), st('w', 2, '2026-09-10T10:00:00Z'))).toBe(true);
    expect(isNewer(st('w', 2, null), st('w', 0, '2026-09-10T10:00:00Z'))).toBe(false);
    const merged = mergeStates([st('w_a', 1, '2026-09-01T00:00:00Z'), st('w_b', 4, '2026-09-05T00:00:00Z')], [st('w_a', 2, '2026-09-02T00:00:00Z'), st('w_b', 3, '2026-09-04T00:00:00Z')]);
    expect(merged.map((s) => [s.word_id, s.reps])).toEqual([['w_a', 2], ['w_b', 4]]);
  });

  it('Lucas e Eduarda na mesma palavra não se misturam', () => {
    const merged = mergeStates([st('w_cafe', 3, '2026-09-10T00:00:00Z', 'u_lucas')], [st('w_cafe', 1, '2026-09-11T00:00:00Z', 'u_eduarda')]);
    expect(merged).toHaveLength(2);
  });
});

describe('POST /api/sync', () => {
  it('aparelho A envia; aparelho B (vazio) recebe o mesmo estado, com o reps certo', async () => {
    const store = memoryStore();
    const a = await handleSync(post({ code: CODE, states: [st('w_cafe', 3, '2026-09-10T10:00:00Z')] }), store);
    expect(a.status).toBe(200);
    const b = await handleSync(post({ code: '  LU-EDU-2026-XYZ ', states: [] }), store); // mesmo código, digitado diferente
    const body = await b.json();
    expect(body.states).toHaveLength(1);
    expect(body.states[0]).toMatchObject({ word_id: 'w_cafe', reps: 3 });
  });

  it('códigos diferentes não se enxergam; o código não é guardado em texto', async () => {
    const store = memoryStore();
    await handleSync(post({ code: CODE, states: [st('w_cafe', 3, '2026-09-10T10:00:00Z')] }), store);
    const other = await (await handleSync(post({ code: 'outro-casal-123', states: [] }), store)).json();
    expect(other.states).toEqual([]);
    expect(storeKey(CODE)).toMatch(/^[0-9a-f]{64}$/);
    expect(storeKey(CODE)).not.toContain('lu-edu');
    expect(normalizeCode('  Lu   Edu ')).toBe('lu edu');
  });

  it('recusa código curto, pedido de fora do app e corpo inválido', async () => {
    const store = memoryStore();
    expect((await handleSync(post({ code: 'curto', states: [] }), store)).status).toBe(400);
    expect((await handleSync(post({ code: CODE, states: [] }, { 'sec-fetch-site': 'cross-site' }), store)).status).toBe(403);
    expect((await handleSync(post({ code: CODE, states: [] }, {}), store)).status).toBe(403);
    expect((await handleSync(new Request('http://x/api/sync', { method: 'POST', headers: { 'sec-fetch-site': 'same-origin' }, body: '{lixo' }), store)).status).toBe(400);
    expect((await handleSync(new Request('http://x/api/sync'), store)).status).toBe(405);
  });

  it('se o outro aparelho grava no meio, relê e mescla de novo (nada se perde)', async () => {
    const inner = memoryStore();
    await handleSync(post({ code: CODE, states: [st('w_un', 1, '2026-09-01T00:00:00Z')] }), inner);
    let raced = false;
    const racy: SyncStore = {
      read: (k) => inner.read(k),
      async write(k, doc, etag) {
        if (!raced) {
          raced = true; // Eduarda sincroniza entre a leitura e a escrita de Lucas
          const cur = await inner.read(k);
          await inner.write(k, { ...cur!.doc, states: [...cur!.doc.states, st('w_deux', 2, '2026-09-12T00:00:00Z', 'u_eduarda')] }, cur!.etag!);
        }
        return inner.write(k, doc, etag);
      },
    };
    const res = await (await handleSync(post({ code: CODE, states: [st('w_trois', 4, '2026-09-13T00:00:00Z')] }), racy)).json();
    expect(res.states.map((s: SyncState) => s.word_id).sort()).toEqual(['w_deux', 'w_trois', 'w_un']);
  });

  it('ignora estados sem o formato mínimo', async () => {
    const res = await (await handleSync(post({ code: CODE, states: [{ user_id: 'u', word_id: 'w' }, st('w_ok', 1, null)] }), memoryStore())).json();
    expect(res.states.map((s: SyncState) => s.word_id)).toEqual(['w_ok']);
  });
});
