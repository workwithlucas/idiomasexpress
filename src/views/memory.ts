import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { addReviewButton, ipa, playButton } from '../ui/components';
import { normalize, THEME_LABELS, withArticle } from '../lib/text';

export const memoryView: View = () => {
  const c = content();
  // Só palavras sem regra de cognato (a regra já é o gancho das cognatas).
  const words = c.words.filter((w) => w.memory_hook_pt && !w.cognate_rule_id);
  const themes = [...new Set(words.map((w) => w.theme))].sort((a, b) => (THEME_LABELS[a] ?? a).localeCompare(THEME_LABELS[b] ?? b));
  let theme = '';
  let term = '';
  let limit = 40;
  const list = h('ul', { class: 'hook-list' });
  const counter = h('p', { class: 'muted' });
  void logActivity(currentUser().id, 'memory', 'browse');

  const update = () => {
    const q = normalize(term);
    const filtered = words.filter(
      (w) => (!theme || w.theme === theme) && (!q || normalize(w.fr).includes(q) || normalize(w.pt).includes(q)),
    );
    counter.textContent = `${filtered.length} palavra${filtered.length === 1 ? '' : 's'}`;
    render(
      list,
      filtered.slice(0, limit).map((w) =>
        h(
          'li',
          { class: 'hook-card' },
          h(
            'div',
            { class: 'hook-card__head' },
            playButton(w.fr, { wordId: w.id, size: 'sm' }),
            h('div', { class: 'hook-card__words' }, h('strong', { lang: 'fr' }, withArticle(w)), h('span', null, ipa(w.ipa), ' · ', w.pt)),
            addReviewButton(w),
          ),
          h('p', { class: 'hook-card__hook' }, icon('sparkles', 16), h('span', null, w.memory_hook_pt)),
        ),
      ),
      filtered.length > limit && h('li', null, h('button', { class: 'btn btn--ghost btn--block', type: 'button', onclick: () => { limit += 40; update(); } }, 'Mostrar mais')),
    );
  };

  update();

  return {
    title: 'Associação de memória',
    back: '/aprender',
    tab: 'learn',
    content: h(
      'div',
      { class: 'stack' },
      h('p', { class: 'lead' }, 'Para palavras que não se parecem com o português, um gancho mental faz a ponte. Leia, ouça e crie a imagem na cabeça.'),
      h(
        'div',
        { class: 'filters' },
        h('label', { class: 'search' }, icon('search', 18), h('input', { type: 'search', placeholder: 'Buscar em francês ou português', 'aria-label': 'Buscar', oninput: (e: Event) => { term = (e.target as HTMLInputElement).value; limit = 40; update(); } })),
        h(
          'select',
          { class: 'select', 'aria-label': 'Filtrar por tema', onchange: (e: Event) => { theme = (e.target as HTMLSelectElement).value; limit = 40; update(); } },
          h('option', { value: '' }, 'Todos os temas'),
          themes.map((t) => h('option', { value: t }, THEME_LABELS[t] ?? t)),
        ),
      ),
      counter,
      list,
    ),
  };
};
