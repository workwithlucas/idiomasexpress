import { describe, expect, it } from 'vitest';
import { handleSync, memoryStore } from '../../server/sync';
import { mergeProgress, type SyncProgress } from '../../server/syncMerge';

const pr = (momento: string, completed: string, phrase: string, updated: string, user = 'u_lucas'): SyncProgress => ({
  user_id: user, momento_id: momento, completed_at: completed, built_phrase: phrase, updated_at: updated,
});
const post = (body: unknown) =>
  new Request('http://x/api/sync', { method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(body) });
const CODE = 'lu-edu-2026-xyz';

describe('momento_progress entre aparelhos', () => {
  it('concluído continua concluído; vale o completed_at mais antigo e a frase mais recente', () => {
    const merged = mergeProgress(
      [pr('m01', '2026-09-01T10:00:00Z', "Un café, s'il vous plaît.", '2026-09-01T10:00:00Z'), pr('m02', '2026-09-02T10:00:00Z', 'A', '2026-09-02T10:00:00Z')],
      [pr('m01', '2026-09-03T10:00:00Z', "Un thé, s'il vous plaît.", '2026-09-03T10:00:00Z'), pr('m03', '2026-09-03T11:00:00Z', 'B', '2026-09-03T11:00:00Z')],
    );
    const byId = new Map(merged.map((p) => [p.momento_id, p]));
    expect([...byId.keys()].sort()).toEqual(['m01', 'm02', 'm03']);
    expect(byId.get('m01')).toMatchObject({ completed_at: '2026-09-01T10:00:00Z', built_phrase: "Un thé, s'il vous plaît.", updated_at: '2026-09-03T10:00:00Z' });
  });

  it('Lucas e Eduarda no mesmo Momento não se misturam', () => {
    expect(mergeProgress([pr('m01', 'a', 'x', 'a')], [pr('m01', 'b', 'y', 'b', 'u_eduarda')])).toHaveLength(2);
  });

  it('aparelho A conclui, aparelho B recebe; um cliente antigo (sem progress) não apaga nada', async () => {
    const store = memoryStore();
    await (await handleSync(post({ code: CODE, states: [], progress: [pr('m01', '2026-09-01T10:00:00Z', 'x', '2026-09-01T10:00:00Z')] }), store)).json();
    const old = await (await handleSync(post({ code: CODE, states: [] }), store)).json();
    expect(old.progress).toHaveLength(1);
    const b = await (await handleSync(post({ code: CODE, states: [], progress: [] }), store)).json();
    expect(b.progress[0]).toMatchObject({ momento_id: 'm01', built_phrase: 'x' });
  });

  it('ignora registros sem o formato mínimo e recusa progress que não é lista', async () => {
    const store = memoryStore();
    const res = await (await handleSync(post({ code: CODE, states: [], progress: [{ user_id: 'u' }, pr('m02', 'a', 'b', 'c')] }), store)).json();
    expect(res.progress.map((p: SyncProgress) => p.momento_id)).toEqual(['m02']);
    expect((await handleSync(post({ code: CODE, states: [], progress: 'x' }), store)).status).toBe(400);
  });
});
