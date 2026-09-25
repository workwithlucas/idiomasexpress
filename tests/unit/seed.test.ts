import { describe, expect, it } from 'vitest';
import seed from '../../public/seed/seed.json';
import type { SeedData, Word } from '../../src/db/schema';
import { diffWords } from '../../src/lib/diff';
import { normalize } from '../../src/lib/text';

const data = seed as SeedData;
const ids = new Set(data.words.map((w) => w.id));

describe('seed', () => {
  it('tem as 800 palavras mais frequentes com ranks 1..800, e ranks únicos', () => {
    const core = data.words.filter((w) => w.freq_rank <= 800);
    expect(core).toHaveLength(800);
    expect(new Set(data.words.map((w) => w.freq_rank)).size).toBe(data.words.length);
    expect(new Set(data.words.map((w) => w.fr)).size).toBe(data.words.length);
  });

  it('toda palavra tem tradução, IPA e tema; gancho só em não cognatas', () => {
    for (const w of data.words) {
      expect(w.pt, w.fr).toBeTruthy();
      expect(w.ipa, w.fr).toBeTruthy();
      expect(w.theme, w.fr).toBeTruthy();
      expect(w.audio_generated).toBe(false);
      expect(Boolean(w.cognate_rule_id && w.memory_hook_pt), w.fr).toBe(false);
    }
  });

  it('cumpre os mínimos: 35 regras de cognatos e 32 pares mínimos', () => {
    expect(data.cognate_rules.length).toBeGreaterThanOrEqual(35);
    expect(data.minimal_pairs.length).toBeGreaterThanOrEqual(32);
    expect(data.reading_rules.length).toBeGreaterThanOrEqual(30);
  });

  it('não tem referências quebradas', () => {
    const rules = new Set(data.cognate_rules.map((r) => r.id));
    const frames = new Set(data.frames.map((f) => f.id));
    data.words.forEach((w) => w.cognate_rule_id && expect(rules.has(w.cognate_rule_id)).toBe(true));
    data.cognate_rules.forEach((r) => r.examples.forEach((id) => expect(ids.has(id)).toBe(true)));
    data.minimal_pairs.forEach((p) => expect(ids.has(p.word_a_id) && ids.has(p.word_b_id)).toBe(true));
    data.false_cognates.forEach((f) => expect(ids.has(f.word_id)).toBe(true));
    data.frames.forEach((f) => f.slot_pool_ids.forEach((id) => expect(ids.has(id)).toBe(true)));
    data.scenes.forEach((s) => {
      s.word_ids.forEach((id) => expect(ids.has(id)).toBe(true));
      s.frame_ids.forEach((id) => expect(frames.has(id)).toBe(true));
    });
  });

  it('toda regra de cognato tem ≥ 5 exemplos, e o 1º tem uma mudança para tocar', () => {
    const byId = new Map(data.words.map((w) => [w.id, w]));
    // Mesma escolha de acepção que a lição usa (a mais parecida com o francês).
    const lev = (a: string, b: string) => {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      return d[a.length][b.length];
    };
    const cognatePt = (w: Word) => {
      const opts = w.pt.split(/[;,]/).map((p) => p.replace(/\(.*?\)/g, '').trim()).filter(Boolean);
      return opts.reduce((best, o) => (lev(normalize(o), normalize(w.fr)) < lev(normalize(best), normalize(w.fr)) ? o : best), opts[0]);
    };
    for (const r of data.cognate_rules) {
      expect(r.examples.length, r.id).toBeGreaterThanOrEqual(5);
      const first = byId.get(r.examples[0])!;
      expect(diffWords(cognatePt(first), first.fr).fr.size, `${r.id}: ${first.fr}`).toBeGreaterThan(0);
    }
  });

  it('cenas de Luxemburgo: ≥ 15 palavras e ≥ 5 moldes próprios cada', () => {
    const lu = data.scenes.filter((s) => s.id.startsWith('sc_lu_'));
    expect(lu.length).toBeGreaterThanOrEqual(8);
    for (const s of lu) {
      expect(s.word_ids.length, s.id).toBeGreaterThanOrEqual(15);
      const own = s.frame_ids.filter((id) => data.scenes.filter((o) => o.frame_ids.includes(id)).length === 1);
      expect(own.length, s.id).toBeGreaterThanOrEqual(5);
    }
  });

  it('moldes preenchidos não quebram a elisão (le/la/de/je/que + vogal)', () => {
    const byId = new Map(data.words.map((w) => [w.id, w]));
    for (const f of data.frames) {
      const before = f.template.split('___')[0];
      if (!/(^|\s)(le|la|de|je|que|ne|ce|me|se|te)\s$/i.test(before)) continue;
      for (const id of f.slot_pool_ids) {
        const fr = byId.get(id)!.fr;
        expect(/^[aeiouéèêàâîôûœh]/i.test(fr), `${f.id}: "${before}${fr}"`).toBe(false);
      }
    }
  });

  it('pares mínimos: palavras diferentes, sem par repetido e sem liaison', () => {
    const keys = data.minimal_pairs.map((p) => [p.word_a_id, p.word_b_id].sort().join('|'));
    expect(new Set(keys).size).toBe(keys.length);
    for (const p of data.minimal_pairs) {
      expect(p.word_a_id).not.toBe(p.word_b_id);
      expect(p.feature.toLowerCase()).not.toContain('liaison');
    }
  });

  it('inclui os dois perfis', () => {
    expect(data.users.map((u) => u.name).sort()).toEqual(['Eduarda', 'Lucas']);
  });
});
