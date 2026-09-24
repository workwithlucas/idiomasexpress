import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { currentUser } from '../ui/session';
import { getReviewStats } from '../db/repo';
import { loadPlan, SESSION_SIZE } from '../lib/session';
import { MODULES } from './modules';

export const homeView: View = async () => {
  const user = currentUser();
  const stats = await getReviewStats(user.id);
  const plan = loadPlan(user.id);
  const total = plan?.items.length ?? SESSION_SIZE;
  const done = plan ? Math.min(plan.index, total) : 0;
  const finished = !!plan && done >= total;

  const cta = finished
    ? h('a', { class: 'btn btn--ghost btn--block', href: '#/sessao?nova=1', 'data-testid': 'session-more' }, 'Mais uma rodada')
    : h('a', { class: 'btn btn--primary btn--block', href: '#/sessao', 'data-testid': 'session-start' }, done ? 'Continuar' : 'Começar', icon('arrowRight', 18));

  return {
    title: 'Hoje',
    tab: 'home',
    content: h(
      'div',
      { class: 'stack stack--lg' },
      h(
        'section',
        { class: 'today progress-card', 'aria-labelledby': 'today-label' },
        h(
          'div',
          { class: 'progress-card__head' },
          h('h2', { class: 'progress-card__label', id: 'today-label' }, finished ? 'Sessão de hoje feita' : 'Sessão de hoje'),
          h('span', { class: 'progress-card__count' }, `${finished ? total : done}/${total}`),
        ),
        h(
          'div',
          { class: 'progress-card__bar', role: 'progressbar', 'aria-label': 'Progresso da sessão de hoje', 'aria-valuemin': '0', 'aria-valuemax': String(total), 'aria-valuenow': String(finished ? total : done) },
          h('div', { class: 'progress-card__fill', style: `width: ${Math.round((finished ? 1 : done / total) * 100)}%` }),
        ),
        h('p', { class: 'today__text' }, finished ? 'Amanhã tem outra. Se quiser, siga um pouco mais.' : done ? `Faltam ${total - done} passos curtos.` : `${total} passos curtos · uns 10 minutos`),
        cta,
      ),
      stats.dueNow > 0 &&
        h(
          'a',
          { class: 'nudge', href: '#/revisao', 'data-testid': 'due-nudge' },
          icon('cycle', 24),
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
              { class: 'module-card', href: `#${m.route}`, dataset: { module: m.id } },
              h('span', { class: 'module-card__icon' }, icon(m.icon, 24)),
              h('strong', null, m.title),
              h('span', null, m.subtitle),
            ),
          ),
        ),
      ),
    ),
  };
};
