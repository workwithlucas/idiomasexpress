import { describe, expect, it } from 'vitest';
import seed from '../../public/seed/seed.json';
import type { SeedData } from '../../src/db/schema';

const data = seed as SeedData;
const ids = new Set(data.words.map((w) => w.id));

describe('seed', () => {
  it('tem as 300 palavras mais frequentes com ranks 1..300', () => {
    const core = data.words.filter((w) => w.freq_rank <= 300);
    expect(core).toHaveLength(300);
    expect(new Set(core.map((w) => w.freq_rank)).size).toBe(300);
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

  it('cumpre os mínimos: 15 regras de cognatos e 10 pares mínimos', () => {
    expect(data.cognate_rules.length).toBeGreaterThanOrEqual(15);
    expect(data.minimal_pairs.length).toBeGreaterThanOrEqual(10);
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

  it('inclui os dois perfis', () => {
    expect(data.users.map((u) => u.name).sort()).toEqual(['Eduarda', 'Lucas']);
  });
});
