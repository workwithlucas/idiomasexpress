import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import seed from '../../public/seed/seed.json';
import type { SeedData } from '../../src/db/schema';
import { ensureSeeded, getMeta } from '../../src/db/database';
import {
  addToReview, getDueStates, getNewWords, getReviewState, loadContent, rateWord, getActivity, computeStreak,
} from '../../src/db/repo';
import { setClockOffsetDays } from '../../src/lib/clock';
import { exportProgress, importProgress } from '../../src/lib/progress';

const data = seed as SeedData;

describe('banco local (IndexedDB)', () => {
  beforeAll(async () => {
    expect(await ensureSeeded(data.version, async () => data)).toBe(true);
    await loadContent(true);
  });

  it('popula no primeiro uso e não repopula depois', async () => {
    expect(await getMeta('seed_version')).toBe(data.version);
    expect(await ensureSeeded(data.version, async () => { throw new Error('não deveria buscar'); })).toBe(false);
    const c = await loadContent();
    expect(c.words).toHaveLength(data.words.length);
    expect(c.cognateRules[0].id).toBe(data.cognate_rules[0].id); // ordem do seed preservada
  });

  it('palavras novas saem em ordem de frequência', async () => {
    const fresh = await getNewWords('u_lucas', 3);
    expect(fresh.map((w) => w.freq_rank)).toEqual([1, 2, 3]);
  });

  it('revisão: avaliar hoje → aparece como vencida no dia seguinte simulado, por usuário', async () => {
    setClockOffsetDays(0);
    const words = await getNewWords('u_lucas', 3);
    for (const w of words) {
      await rateWord('u_lucas', w.id, 'good');
    }
    // passo de aprendizado: some da fila agora
    expect((await getDueStates('u_lucas')).length).toBe(0);
    setClockOffsetDays(1);
    const due = await getDueStates('u_lucas');
    expect(due.map((d) => d.word_id).sort()).toEqual(words.map((w) => w.id).sort());
    // Eduarda não é afetada
    expect(await getDueStates('u_eduarda')).toHaveLength(0);
    setClockOffsetDays(0);
  });

  it('addToReview não duplica', async () => {
    expect(await addToReview('u_eduarda', 'w_banque')).toBe(true);
    expect(await addToReview('u_eduarda', 'w_banque')).toBe(false);
    expect((await getReviewState('u_eduarda', 'w_banque'))?.reps).toBe(0);
  });

  it('streak conta dias consecutivos com atividade', async () => {
    const act = await getActivity('u_lucas');
    expect(act.length).toBeGreaterThan(0);
    expect(computeStreak(act)).toBe(1);
  });

  it('exporta e importa progresso, mantendo o estado mais recente', async () => {
    const file = await exportProgress();
    expect(file.review_states.length).toBe(4);
    const stale = structuredClone(file);
    stale.review_states = stale.review_states.map((r) => ({ ...r, last_review: null, reps: 0 }));
    const r1 = await importProgress(stale);
    expect(r1.statesKept).toBe(4);
    expect(r1.statesUpdated).toBe(0);

    const newer = structuredClone(file);
    newer.review_states[0] = { ...newer.review_states[0], last_review: '2099-01-01T00:00:00.000Z', stability: 42 };
    const r2 = await importProgress(newer);
    expect(r2.statesUpdated).toBe(1);
    const s = newer.review_states[0];
    expect((await getReviewState(s.user_id, s.word_id))?.stability).toBe(42);

    await expect(importProgress({ foo: 1 })).rejects.toThrow(/inválido/);
  });
});
