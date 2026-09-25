import { describe, expect, it } from 'vitest';
import { analyzeLiaisons } from '../../src/lib/liaison';

const hasLiaison = (s: string) => analyzeLiaisons(s).some((t) => t.liaison);
import seed from '../../public/seed/seed.json';
import type { SeedData } from '../../src/db/schema';
import { fillFrame } from '../../src/lib/text';

const pairs = (s: string) => analyzeLiaisons(s).flatMap((t, i, all) => (t.liaison ? [`${t.text}‿${all[i + 1].text}:${t.liaison.sound}`] : []));

describe('liaison', () => {
  it('marca ligações obrigatórias', () => {
    expect(pairs("C'est un ami.")).toEqual(["C'est‿un:t", 'un‿ami.:n']);
    expect(pairs('Vous êtes prêt ?')).toEqual(['Vous‿êtes:z']);
    expect(pairs('Il est très heureux.')).toEqual(['très‿heureux.:z']);
    expect(pairs("C'est un grand hôpital.")).toContain('grand‿hôpital.:t');
  });

  it('não liga antes de consoante, pontuação ou h aspirado', () => {
    expect(hasLiaison('Il est très gentil.')).toBe(false);
    expect(hasLiaison('les huit enfants')).toBe(false);
    expect(hasLiaison('Je veux manger.')).toBe(false);
    expect(pairs('Vous, avez')).toEqual([]);
  });

  it('pelo menos 10 moldes geram ligação quando preenchidos', () => {
    const data = seed as SeedData;
    const words = new Map(data.words.map((w) => [w.id, w]));
    const withLiaison = data.frames.filter((f) => f.slot_pool_ids.some((id) => hasLiaison(fillFrame(f.template, words.get(id)!.fr))));
    expect(withLiaison.length).toBeGreaterThanOrEqual(10);
  });
});

import { diffWords, runs, tapHits } from '../../src/lib/diff';

describe('o que muda entre PT e FR', () => {
  const frRuns = (pt: string, fr: string) => runs(diffWords(pt, fr).fr).map(([s, e]) => fr.slice(s, e + 1));
  it('acha o trecho que muda', () => {
    expect(frRuns('nação', 'nation')).toEqual(['tion']);
    expect(frRuns('universidade', 'université')).toEqual(['té']);
    expect(frRuns('delicioso', 'délicieux')).toEqual(['é', 'eux']);
    expect(frRuns('escola', 'école')).toEqual(['é', 'e']);
  });
  it('aceita toque no trecho, recusa longe dele', () => {
    const d = diffWords('nação', 'nation').fr;
    expect(tapHits(3, d)).toBe(true);
    expect(tapHits(0, d)).toBe(false);
  });
});
