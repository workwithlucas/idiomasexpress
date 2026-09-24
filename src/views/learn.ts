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
});
