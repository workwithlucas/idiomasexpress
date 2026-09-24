import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { MODULES } from './modules';

export const learnView: View = () => ({
  title: 'Aprender',
  tab: 'learn',
  content: h(
    'div',
    { class: 'stack' },
    h('p', { class: 'lead' }, 'Oito caminhos complementares. Siga a ordem na primeira semana; depois, misture à vontade.'),
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
            h('span', { class: 'module-card__n' }, String(m.n).padStart(2, '0')),
            h('span', { class: 'module-card__icon' }, icon(m.icon, 24)),
            h('strong', null, m.title),
            h('span', null, m.subtitle),
          ),
        ),
      ),
    ),
  ),
});
