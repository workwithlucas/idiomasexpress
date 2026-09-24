import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { interleave, buildPlan, SESSION_SIZE, type SessionItem } from '../../src/lib/session';
import { directionFor } from '../../src/exercises/review';
import seed from '../../public/seed/seed.json';
import type { SeedData } from '../../src/db/schema';
import { ensureSeeded } from '../../src/db/database';
import { loadContent, rateWord } from '../../src/db/repo';

const noAdjacent = (items: SessionItem[]) => items.every((it, i) => i === 0 || it.type !== items[i - 1].type);

describe('intercalação', () => {
  it('nunca repete tipo em sequência, mantendo a ordem dentro de cada tipo', () => {
    for (let run = 0; run < 50; run++) {
      const items: SessionItem[] = [
        ...Array.from({ length: 8 }, (_, i) => ({ type: 'review' as const, ref: `r${i}` })),
        { type: 'cognate', ref: 'c1' }, { type: 'cognate', ref: 'c2' },
        { type: 'reading', ref: 'l1' }, { type: 'reading', ref: 'l2' },
        { type: 'frame', ref: 'f1' }, { type: 'frame', ref: 'f2' },
        { type: 'pair', ref: 'p1' }, { type: 'pair', ref: 'p2' },
      ];
      const out = interleave(items);
      expect(out).toHaveLength(16);
      expect(noAdjacent(out)).toBe(true);
      expect(out[0].type).toBe('review'); // vencidas têm prioridade
      expect(out.filter((i) => i.type === 'review').map((i) => i.ref)).toEqual(items.slice(0, 8).map((i) => i.ref));
    }
  });
});

describe('direção da revisão pelo número de revisões', () => {
  it('par = reconhecer, ímpar = produzir', () => {
    expect(directionFor(undefined)).toBe('recognize');
    expect(directionFor({ reps: 0 })).toBe('recognize');
    expect(directionFor({ reps: 1 })).toBe('produce');
    expect(directionFor({ reps: 2 })).toBe('recognize');
    expect(directionFor({ reps: 7 })).toBe('produce');
  });
});

describe('plano da sessão diária', () => {
  beforeAll(async () => {
    await ensureSeeded((seed as SeedData).version, async () => seed as SeedData);
    await loadContent(true);
  });

  it('primeiro dia: metade palavras novas, metade conteúdo novo, intercalado', async () => {
    const plan = await buildPlan('u_session');
    expect(plan.items).toHaveLength(SESSION_SIZE);
    expect(plan.items.filter((i) => i.type === 'review')).toHaveLength(SESSION_SIZE / 2);
    expect(noAdjacent(plan.items)).toBe(true);
    const frames = plan.items.filter((i) => i.type === 'frame').map((i) => i.ref);
    expect(frames.some((f) => f.startsWith('f_lia_'))).toBe(true); // sempre um molde com ligação
    // Descobre as regras em ordem: a primeira de cada tipo.
    expect(plan.items.find((i) => i.type === 'cognate')!.ref).toBe('cr_cao_tion');
    expect(plan.items.find((i) => i.type === 'reading')!.ref).toBe('rr_eau');
  });

  it('palavras vencidas entram primeiro na metade de revisão', async () => {
    const plan0 = await buildPlan('u_due');
    const words = plan0.items.filter((i) => i.type === 'review').map((i) => i.ref);
    for (const w of words.slice(0, 3)) await rateWord('u_due', w, 'again'); // vencem em 1 min
    const { setClockOffsetDays } = await import('../../src/lib/clock');
    setClockOffsetDays(1);
    const plan = await buildPlan('u_due');
    const review = plan.items.filter((i) => i.type === 'review').map((i) => i.ref);
    expect(review.slice(0, 3).sort()).toEqual(words.slice(0, 3).sort());
    setClockOffsetDays(0);
  });
});
