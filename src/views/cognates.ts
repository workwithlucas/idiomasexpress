import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, getDiscovered } from '../db/repo';
import { currentUser, notifyProgressChanged } from '../ui/session';
import { addReviewButton, playButton, segmented } from '../ui/components';
import { cognateLesson } from '../exercises/cognate';
import { swap, type Exercise } from '../exercises/common';
import { stopSpeaking } from '../lib/tts';
import type { CognateRule } from '../db/schema';

export const cognatesView: View = async ({ query }) => {
  const c = content();
  const user = currentUser();
  const body = h('div', { class: 'stack' });
  let current: Exercise | null = null;

  const home = async () => {
    current?.cleanup?.();
    current = null;
    const found = await getDiscovered(user.id);
    const rules = c.cognateRules;
    const next = rules.find((r) => !found.has(r.id));
    const known = rules.filter((r) => found.has(r.id));
    swap(
      body,
      h(
        'section',
        { class: 'hero-lite' },
        progressDots(known.length, rules.length),
        h('h2', null, next ? 'Descubra um padrão novo' : 'Você já viu todos os padrões.'),
        h('p', { class: 'muted' }, `${known.length} de ${rules.length}`),
        h('button', { class: 'btn btn--primary btn--block btn--lg', type: 'button', 'data-testid': 'discover-next', onclick: () => start(next ?? rules[Math.floor(Math.random() * rules.length)]) }, next ? 'Descobrir' : 'Praticar um'),
      ),
      known.length > 0 &&
        h(
          'details',
          { class: 'known' },
          h('summary', null, 'Padrões que você já descobriu'),
          h('ul', { class: 'known__list' }, known.map((r) => h('li', null, h('button', { class: 'known__item', type: 'button', onclick: () => start(r) }, r.pattern, icon('chevronRight', 16))))),
        ),
    );
  };

  const start = (rule: CognateRule) => {
    current = cognateLesson(rule, user.id, () => {
      notifyProgressChanged();
      void home();
    });
    swap(body, current.el);
  };

  const showFalse = () => {
    current?.cleanup?.();
    current = null;
    render(
      body,
      h(
        'ul',
        { class: 'false-list' },
        c.falseCognates.map((f) => {
          const w = c.wordById.get(f.word_id)!;
          return h(
            'li',
            { class: 'false-card' },
            h(
              'div',
              { class: 'false-card__head' },
              playButton(w.fr, { wordId: w.id, size: 'sm' }),
              h('strong', { class: 'false-card__fr', lang: 'fr' }, w.fr),
              h('span', { class: 'false-card__neq' }, '≠ ', h('s', null, f.looks_like)),
              addReviewButton(w),
            ),
            h('p', { class: 'false-card__warn' }, f.warning_pt),
          );
        }),
      ),
    );
  };

  const initial = query.get('aba') === 'falsos' ? 'false' : 'rules';
  if (initial === 'false') showFalse();
  else await home();

  return {
    title: 'Palavras-irmãs',
    back: '/aprender',
    tab: 'learn',
    cleanup: () => {
      current?.cleanup?.();
      stopSpeaking();
    },
    content: h(
      'div',
      { class: 'stack' },
      segmented(
        [
          { value: 'rules', label: 'Padrões' },
          { value: 'false', label: 'Falsos amigos' },
        ],
        initial,
        (v) => (v === 'rules' ? void home() : showFalse()),
      ),
      body,
    ),
  };
};

/** Pontinhos de progresso (quantos padrões já descobertos). */
export function progressDots(done: number, total: number): HTMLElement {
  return h(
    'div',
    { class: 'dots', role: 'img', 'aria-label': `${done} de ${total}` },
    Array.from({ length: total }, (_, i) => h('span', { class: `dots__dot${i < done ? ' dots__dot--on' : ''}` })),
  );
}
