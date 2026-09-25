import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { navigate } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser, notifyProgressChanged } from '../ui/session';
import { buildPlan, loadPlan, savePlan, type SessionItem, type SessionPlan } from '../lib/session';
import { cognateLesson } from '../exercises/cognate';
import { readingLesson } from '../exercises/reading';
import { pairRound } from '../exercises/pair';
import { frameExercise } from '../exercises/frame';
import { reviewCard } from '../exercises/review';
import { swap, type Exercise } from '../exercises/common';
import { stopSpeaking } from '../lib/tts';
import { cue } from '../lib/sounds';

const LABELS: Record<SessionItem['type'], string> = {
  review: 'Lembrar',
  cognate: 'Descobrir',
  reading: 'Ler e ouvir',
  frame: 'Montar frase',
  pair: 'Ouvido',
};

/** Sessão diária: a tela de entrada do estudo. */
export const sessionView: View = async ({ query }) => {
  const user = currentUser();
  let plan: SessionPlan = (query.get('nova') ? null : loadPlan(user.id)) ?? (await buildPlan(user.id));
  if (plan.index >= plan.items.length && query.get('nova')) plan = await buildPlan(user.id);
  savePlan(plan);

  const stage = h('div', { class: 'session-stage' });
  const bar = h('span', { class: 'progress__bar' });
  const kind = h('span', { class: 'session-kind', 'data-testid': 'session-kind' });
  let current: Exercise | null = null;

  const renderProgress = () => {
    bar.style.width = `${(plan.index / plan.items.length) * 100}%`;
    const item = plan.items[plan.index];
    kind.textContent = item ? LABELS[item.type] : '';
    stage.dataset.type = item?.type ?? 'done';
  };

  const advance = (correct: boolean) => {
    plan.index++;
    if (correct) plan.right++;
    savePlan(plan);
    notifyProgressChanged();
    show();
  };

  const mount = (item: SessionItem): Exercise | null => {
    const c = content();
    switch (item.type) {
      case 'review':
        return c.wordById.has(item.ref) ? reviewCard(item.ref, user.id, (_n, r) => advance(r !== 'again')) : null;
      case 'cognate': {
        const rule = c.ruleById.get(item.ref);
        return rule ? cognateLesson(rule, user.id, (r) => advance(r.correct)) : null;
      }
      case 'reading': {
        const rule = c.readingRules.find((r) => r.id === item.ref);
        return rule ? readingLesson(rule, user.id, (r) => advance(r.correct)) : null;
      }
      case 'frame': {
        const frame = c.frameById.get(item.ref);
        return frame ? frameExercise(frame, user.id, (r) => advance(r.correct)) : null;
      }
      case 'pair': {
        const pair = c.minimalPairs.find((p) => p.id === item.ref);
        return pair ? pairRound(pair, Math.random() < 0.7 ? 'which' : 'order', user.id, (r) => advance(r.correct)) : null;
      }
    }
  };

  const show = () => {
    current?.cleanup?.();
    current = null;
    renderProgress();
    const item = plan.items[plan.index];
    if (!item) return finish();
    const ex = mount(item);
    if (!ex) return advance(false); // conteúdo sumiu (seed novo): pula sem travar
    current = ex;
    swap(stage, ex.el);
  };

  const finish = () => {
    cue('done');
    void logActivity(user.id, 'review', 'session-complete', { score: plan.right });
    swap(
      stage,
      h(
        'div',
        { class: 'session-done', 'data-testid': 'session-done' },
        ring(1),
        h('h2', null, 'Pronto por hoje.'),
        h('p', { class: 'muted' }, 'Amanhã tem outra.'),
        h('a', { class: 'btn btn--primary btn--block btn--lg', href: '#/' }, 'Voltar ao início'),
      ),
    );
  };

  show();

  return {
    title: 'Sessão de hoje',
    tab: 'home',
    bare: false,
    back: '/',
    cleanup: () => {
      current?.cleanup?.();
      stopSpeaking();
    },
    content: h(
      'div',
      { class: 'session' },
      h(
        'div',
        { class: 'session-top' },
        h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'Progresso da sessão' }, bar),
        kind,
        h('button', { class: 'icon-btn icon-btn--sm', type: 'button', 'aria-label': 'Pausar e sair', title: 'Pausar', onclick: () => navigate('/') }, icon('x', 16)),
      ),
      stage,
    ),
  };
};

/** Anel de progresso (0–1). */
export function ring(fraction: number, label?: string): HTMLElement {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 80 80');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML =
    `<circle cx="40" cy="40" r="${r}" class="pring__track"/>` +
    `<circle cx="40" cy="40" r="${r}" class="pring__value" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - Math.max(0, Math.min(1, fraction)))}" transform="rotate(-90 40 40)"/>`;
  return h('div', { class: 'pring' }, svg, label ? h('span', { class: 'pring__label' }, label) : h('span', { class: 'pring__label' }, icon('check', 26)));
}
