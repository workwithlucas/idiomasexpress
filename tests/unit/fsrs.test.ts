import { describe, expect, it } from 'vitest';
import { formatInterval, newReviewState, previewIntervals, review } from '../../src/lib/fsrs';

const DAY = 86_400_000;

describe('FSRS', () => {
  it('palavra nova avaliada como "good" volta em minutos (passo de aprendizado)', () => {
    const t0 = new Date('2026-01-10T09:00:00Z');
    const s = review(newReviewState('u', 'w', t0), 'good', t0);
    const mins = (Date.parse(s.due_at) - t0.getTime()) / 60_000;
    expect(mins).toBeGreaterThan(0);
    expect(mins).toBeLessThanOrEqual(15);
    expect(s.last_result).toBe('good');
    expect(s.reps).toBe(1);
  });

  it('após concluir o aprendizado, o intervalo passa a ser em dias e cresce', () => {
    let t = new Date('2026-01-10T09:00:00Z');
    let s = newReviewState('u', 'w', t);
    s = review(s, 'good', t);
    t = new Date(Date.parse(s.due_at));
    s = review(s, 'good', t);
    const first = Date.parse(s.due_at) - t.getTime();
    expect(first).toBeGreaterThanOrEqual(DAY * 0.9);
    t = new Date(Date.parse(s.due_at));
    s = review(s, 'good', t);
    expect(Date.parse(s.due_at) - t.getTime()).toBeGreaterThan(first);
  });

  it('"again" gera lapso e reduz o intervalo', () => {
    let t = new Date('2026-01-10T09:00:00Z');
    let s = review(review(newReviewState('u', 'w', t), 'easy', t), 'good', new Date(t.getTime() + 5 * DAY));
    t = new Date(Date.parse(s.due_at));
    s = review(s, 'again', t);
    expect(s.lapses).toBe(1);
    expect(Date.parse(s.due_at) - t.getTime()).toBeLessThan(DAY);
  });

  it('prévia ordena again < hard < good < easy', () => {
    const t = new Date('2026-01-10T09:00:00Z');
    const p = previewIntervals(newReviewState('u', 'w', t), t);
    expect(p.again.getTime()).toBeLessThanOrEqual(p.hard.getTime());
    expect(p.hard.getTime()).toBeLessThanOrEqual(p.good.getTime());
    expect(p.good.getTime()).toBeLessThan(p.easy.getTime());
  });

  it('palavra consolidada: easy > good > hard > again, e again volta no mesmo dia', () => {
    let t = new Date('2026-01-10T09:00:00Z');
    let s = newReviewState('u', 'w', t);
    for (let i = 0; i < 3; i++) {
      s = review(s, 'good', t);
      t = new Date(s.due_at);
    }
    const p = previewIntervals(s, t);
    const d = (x: Date) => x.getTime() - t.getTime();
    expect(d(p.easy)).toBeGreaterThan(d(p.good));
    expect(d(p.good)).toBeGreaterThan(d(p.hard));
    expect(d(p.hard)).toBeGreaterThan(d(p.again));
    expect(d(p.again)).toBeLessThan(DAY);
    expect(d(p.easy)).toBeGreaterThan(30 * DAY);
  });

  it('formata intervalos', () => {
    const t = new Date(0);
    expect(formatInterval(t, new Date(10 * 60_000))).toBe('10 min');
    expect(formatInterval(t, new Date(3 * DAY))).toBe('3 d');
  });
});
