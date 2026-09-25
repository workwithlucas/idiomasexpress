import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import seed from '../../public/seed/seed.json';
import type { SeedData } from '../../src/db/schema';
import { ensureSeeded, getMeta } from '../../src/db/database';
import {
  buildReencontros, completeMomento, completedMomentos, content, getDueStates, getReviewState, loadContent, markPhraseSeen, rateWord,
  REENCONTROS_PER_DAY, todaysReencontros, extraReviewCount,
} from '../../src/db/repo';
import { momentoStats, reviewWordIds } from '../../src/lib/momento';
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

  const firstWords = (n: number, skip = 0) => content().words.slice(skip, skip + n);

  it('revisão: avaliar hoje → aparece como vencida no dia seguinte simulado, por usuário', async () => {
    setClockOffsetDays(0);
    const words = firstWords(3);
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

  it('"easy" sai da fila por muito mais tempo que "again" (com avanço de data)', async () => {
    setClockOffsetDays(0);
    const [easyWord, againWord] = firstWords(2, 10);
    await rateWord('u_eduarda', easyWord.id, 'easy');
    await rateWord('u_eduarda', againWord.id, 'again');
    const dueIds = async (days: number) => {
      setClockOffsetDays(days);
      return new Set((await getDueStates('u_eduarda')).map((s) => s.word_id));
    };
    // "again" volta em minutos; "easy" não aparece por dias.
    expect((await dueIds(1)).has(againWord.id)).toBe(true);
    expect((await dueIds(1)).has(easyWord.id)).toBe(false);
    // "easy" em palavra nova = ~10 dias, com fuzz do FSRS (±~20%)
    expect((await dueIds(5)).has(easyWord.id)).toBe(false);
    expect((await dueIds(15)).has(easyWord.id)).toBe(true);
    setClockOffsetDays(0);
    const easy = await getReviewState('u_eduarda', easyWord.id);
    const again = await getReviewState('u_eduarda', againWord.id);
    expect(Date.parse(easy!.due_at) - Date.parse(again!.due_at)).toBeGreaterThan(5 * 86_400_000);
  });


  it('Momento 1: 14 de 17 palavras com ponte, calculado dos dados', () => {
    const m1 = content().momentos[0];
    const stats = momentoStats(m1, content().wordById);
    expect([stats.known, stats.total]).toEqual([14, 17]);
  });

  it('concluir um Momento: palavras (menos as de ponte "igual") voltam amanhã, e o 1º completed_at fica', async () => {
    setClockOffsetDays(0);
    const c = content();
    const m1 = c.momentos[0];
    const user = 'u_test_mo';
    const first = await completeMomento(user, m1.id, "Un thé, s'il vous plaît.", 'w_the');
    expect(first).toBe(true);
    const expected = reviewWordIds(m1, c.wordById, ['w_the']);
    expect(expected).not.toContain('w_cafe'); // "igual"
    expect(expected).not.toContain('w_normal');
    expect(expected).toContain('w_je'); // nova
    expect(expected).toContain('w_lait'); // ponte de origem
    // Hoje nada vence: as palavras voltam amanhã.
    expect(await getDueStates(user)).toHaveLength(0);
    setClockOffsetDays(1);
    const due = (await getDueStates(user)).map((s) => s.word_id).sort();
    expect(due).toEqual([...expected].sort());
    // Refazer mantém o primeiro completed_at e troca a frase.
    const before = (await completedMomentos(user)).get(m1.id)!;
    expect(await completeMomento(user, m1.id, "Un café, s'il vous plaît.", 'w_cafe')).toBe(false);
    const after = (await completedMomentos(user)).get(m1.id)!;
    expect(after.completed_at).toBe(before.completed_at);
    expect(after.built_phrase).toBe("Un café, s'il vous plaît.");
    setClockOffsetDays(0);
  });

  it('reencontros do dia seguinte: a frase primeiro, no máximo 8, e o resto vai para "Revisar mais"', async () => {
    setClockOffsetDays(1);
    const user = 'u_test_mo';
    const queue = await todaysReencontros(user, false);
    expect(queue.length).toBe(REENCONTROS_PER_DAY);
    expect(queue[0]).toEqual({ type: 'phrase', momentoId: 'm01' });
    const due = (await getDueStates(user)).length;
    expect(await extraReviewCount(user, false)).toBe(due - REENCONTROS_PER_DAY);
    expect(await extraReviewCount(user, true)).toBe(due); // pulou hoje: tudo fica opcional no Caderno
    // Fazer os de hoje: a frase não volta de novo, e a cota do dia acaba.
    await markPhraseSeen(user, 'm01');
    for (const r of queue.slice(1)) if (r.type === 'word') await rateWord(user, r.wordId, 'good');
    expect(await todaysReencontros(user, false)).toHaveLength(0);
    const later = await buildReencontros(user, 8);
    expect(later.some((r) => r.type === 'phrase')).toBe(false);
    setClockOffsetDays(0);
  });

  it('exporta e importa progresso, mantendo o estado mais recente', async () => {
    const file = await exportProgress();
    const total = file.review_states.length;
    expect(total).toBeGreaterThan(0);
    const stale = structuredClone(file);
    stale.review_states = stale.review_states.map((r) => ({ ...r, last_review: null, reps: 0 }));
    const r1 = await importProgress(stale);
    expect(r1.statesKept).toBe(total);
    expect(r1.statesUpdated).toBe(0);

    const newer = structuredClone(file);
    newer.review_states[0] = { ...newer.review_states[0], last_review: '2099-01-01T00:00:00.000Z', stability: 42 };
    const r2 = await importProgress(newer);
    expect(r2.statesUpdated).toBe(1);
    const s = newer.review_states[0];
    expect((await getReviewState(s.user_id, s.word_id))?.stability).toBe(42);

    // Momentos vão junto no arquivo; importar o mesmo arquivo não muda nada.
    expect(file.momento_progress?.length).toBeGreaterThan(0);
    const r3 = await importProgress(file);
    expect(r3.momentosUpdated).toBe(0);
    const later = structuredClone(file);
    later.momento_progress![0] = { ...later.momento_progress![0], built_phrase: 'Un thé.', updated_at: '2099-01-01T00:00:00.000Z', completed_at: '2099-01-01T00:00:00.000Z' };
    expect((await importProgress(later)).momentosUpdated).toBe(1);
    const p = (await completedMomentos(later.momento_progress![0].user_id)).get(later.momento_progress![0].momento_id)!;
    expect(p.built_phrase).toBe('Un thé.');
    expect(p.completed_at).toBe(file.momento_progress![0].completed_at); // o mais antigo fica

    await expect(importProgress({ foo: 1 })).rejects.toThrow(/inválido/);
  });
});
