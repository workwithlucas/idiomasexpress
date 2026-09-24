import { h } from './dom';
import type { TargetContour, UserContour } from '../lib/prosody';

const W = 320;
const H = 150;
const PAD_X = 8;
const TOP = 10;
const PLOT_H = 96; // área da melodia; abaixo dela, as duas linhas de "batidas"
const ST_RANGE = 8;

/**
 * Melodia da frase: linha do francês (meta) e a sua, no MESMO eixo de tempo
 * em segundos — se você falou mais devagar, a sua linha fica mais comprida.
 * Embaixo, as sílabas de cada um como batidas (ritmo).
 */
export function prosodyChart(target: TargetContour, user: UserContour): HTMLElement {
  const maxDur = Math.max(target.duration, user.duration, 0.5);
  const x = (tNorm: number, dur: number) => PAD_X + ((tNorm * dur) / maxDur) * (W - 2 * PAD_X);
  const y = (st: number) => TOP + ((ST_RANGE - Math.max(-ST_RANGE, Math.min(ST_RANGE, st))) / (2 * ST_RANGE)) * PLOT_H;
  const path = (pts: { t: number; st: number }[], dur: number) =>
    pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.t, dur).toFixed(1)},${y(p.st).toFixed(1)}`).join(' ');

  const beatsY1 = TOP + PLOT_H + 18;
  const beatsY2 = beatsY1 + 16;
  const targetBeats = target.syllables.map((t) => `<circle cx="${x(t, target.duration).toFixed(1)}" cy="${beatsY1}" r="3.2" class="pc-beat pc-beat--target"/>`).join('');
  const userBeats = user.nuclei.map((t) => `<circle cx="${x(t, user.duration).toFixed(1)}" cy="${beatsY2}" r="3.2" class="pc-beat pc-beat--user"/>`).join('');

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'pc');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Melodia do francês comparada com a sua');
  svg.innerHTML =
    `<line x1="${PAD_X}" x2="${W - PAD_X}" y1="${y(0)}" y2="${y(0)}" class="pc-mid"/>` +
    `<path d="${path(target.points, target.duration)}" class="pc-line pc-line--target" data-testid="contour-target"/>` +
    user.segments.map((seg) => `<path d="${path(seg, user.duration)}" class="pc-line pc-line--user" data-testid="contour-user"/>`).join('') +
    targetBeats +
    userBeats;

  return h(
    'figure',
    { class: 'pc-wrap' },
    svg,
    h(
      'figcaption',
      { class: 'pc-legend' },
      h('span', null, h('i', { class: 'pc-key pc-key--target' }), 'francês'),
      h('span', null, h('i', { class: 'pc-key pc-key--user' }), 'você'),
    ),
  );
}
