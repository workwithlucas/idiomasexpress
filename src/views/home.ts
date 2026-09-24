import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { currentUser } from '../ui/session';
import { getActivity, getReviewStats } from '../db/repo';
import { dayKey, now } from '../lib/clock';
import { loadPlan, SESSION_SIZE } from '../lib/session';
import { MODULES } from './modules';
import { ring } from './session';

function greeting(d: Date): string {
  const hr = d.getHours();
  if (hr < 12) return 'Bonjour';
  if (hr < 18) return 'Bon après-midi';
  return 'Bonsoir';
}

/** Últimos 7 dias: bolinha cheia = praticou. Sem pontos, sem troféus. */
function week(activityDays: Set<string>): HTMLElement {
  const today = now();
  const letters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
  return h(
    'div',
    { class: 'week', 'aria-label': 'Seus últimos 7 dias' },
    days.map((d) =>
      h(
        'span',
        { class: `week__day${activityDays.has(dayKey(d)) ? ' week__day--on' : ''}${dayKey(d) === dayKey(today) ? ' week__day--today' : ''}` },
        h('span', { class: 'week__dot' }),
        h('small', null, letters[d.getDay()]),
      ),
    ),
  );
}

export const homeView: View = async () => {
  const user = currentUser();
  const [stats, activity] = await Promise.all([getReviewStats(user.id), getActivity(user.id)]);
  const plan = loadPlan(user.id);
  const t = now();
  const total = plan?.items.length ?? SESSION_SIZE;
  const done = plan ? Math.min(plan.index, total) : 0;
  const finished = !!plan && done >= total;
  const days = new Set(activity.map((a) => dayKey(new Date(a.at))));

  const cta = finished
    ? h('a', { class: 'btn btn--ghost btn--block', href: '#/sessao?nova=1', 'data-testid': 'session-more' }, 'Mais uma rodada')
    : h('a', { class: 'btn btn--primary btn--block btn--lg', href: '#/sessao', 'data-testid': 'session-start' }, done ? 'Continuar' : 'Começar', icon('arrowRight', 18));

  return {
    title: 'Hoje',
    tab: 'home',
    content: h(
      'div',
      { class: 'stack stack--lg' },
      h('div', { class: 'greeting' }, h('h2', null, `${greeting(t)}, ${user.name}`)),
      h(
        'section',
        { class: 'today' },
        ring(finished ? 1 : done / total, finished ? undefined : `${done}/${total}`),
        h(
          'div',
          { class: 'today__text' },
          h('h3', null, finished ? 'Feito por hoje' : 'Sua sessão de hoje'),
          h('p', null, finished ? 'Volte amanhã — ou siga um pouco mais.' : done ? 'Continue de onde parou.' : 'Um pouco de tudo, misturado.'),
        ),
        cta,
      ),
      week(days),
      stats.dueNow > 0 &&
        h(
          'a',
          { class: 'nudge', href: '#/revisao', 'data-testid': 'due-nudge' },
          icon('review', 18),
          h('span', null, `${stats.dueNow} ${stats.dueNow === 1 ? 'palavra quer' : 'palavras querem'} ser lembrada${stats.dueNow === 1 ? '' : 's'}`),
          h('span', { hidden: true, 'data-testid': 'due-count' }, String(stats.dueNow)),
          icon('chevronRight', 16),
        ),
      stats.dueNow === 0 && h('span', { hidden: true, 'data-testid': 'due-count' }, '0'),
      h('h3', { class: 'list-heading' }, 'Por conta própria'),
      h(
        'ul',
        { class: 'module-grid' },
        MODULES.map((m) =>
          h(
            'li',
            null,
            h(
              'a',
              { class: `module-card module-card--${m.accent}`, href: `#${m.route}`, dataset: { module: m.id } },
              h('span', { class: 'module-card__icon' }, icon(m.icon, 22)),
              h('strong', null, m.title),
              h('span', null, m.subtitle),
            ),
          ),
        ),
      ),
    ),
  };
};
