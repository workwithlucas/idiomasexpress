import { h } from '../ui/dom';
import type { View, ViewResult } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { ipa, playButton } from '../ui/components';
import { speakSequence } from '../lib/tts';
import { icon } from '../ui/icons';
import type { ReadingExample } from '../db/schema';

function resolveExample(e: ReadingExample): { fr: string; ipa: string; pt: string; wordId?: string } {
  if ('word_id' in e) {
    const w = content().wordById.get(e.word_id)!;
    return { fr: w.fr, ipa: w.ipa, pt: w.pt, wordId: w.id };
  }
  return e;
}

export const readingView: View = () => {
  const rules = content().readingRules;
  let logged = false;
  // Qualquer áudio tocado nesta tela conta como prática do dia.
  const logOnce = () => {
    if (!logged) void logActivity(currentUser().id, 'reading', 'listen');
    logged = true;
  };

  const view: ViewResult = {
    title: 'Regras de leitura',
    back: '/aprender',
    tab: 'learn',
    content: h(
      'div',
      { class: 'stack' },
      h('p', { class: 'lead' }, `O francês parece caótico, mas é bem regular. ${rules.length} regras cobrem quase tudo que você vai ler.`),
      h(
        'ol',
        { class: 'reading-list' },
        rules.map((rule, i) => {
          const examples = rule.examples.map(resolveExample);
          return h(
            'li',
            { class: 'reading-card', dataset: { rule: rule.id } },
            h(
              'div',
              { class: 'reading-card__head' },
              h('span', { class: 'reading-card__n' }, String(i + 1)),
              h('div', { class: 'reading-card__grapheme', lang: 'fr' }, rule.grapheme),
              h('span', { class: 'reading-card__arrow' }, icon('arrowRight', 16)),
              h('div', { class: 'reading-card__sound' }, `[${rule.sound}]`),
              h(
                'button',
                {
                  class: 'icon-btn',
                  type: 'button',
                  title: 'Ouvir todos os exemplos',
                  'aria-label': `Ouvir todos os exemplos de ${rule.grapheme}`,
                  onclick: () => {
                    void speakSequence(examples.map((e) => e.fr), 500);
                  },
                },
                icon('play', 18),
              ),
            ),
            h('p', { class: 'reading-card__tip' }, rule.tip_pt),
            h(
              'ul',
              { class: 'chips' },
              examples.map((e) =>
                h(
                  'li',
                  { class: 'chip-example' },
                  playButton(e.fr, { wordId: e.wordId, size: 'sm' }),
                  h('span', { class: 'chip-example__text' }, h('strong', { lang: 'fr' }, e.fr), ipa(e.ipa), h('small', null, e.pt)),
                ),
              ),
            ),
          );
        }),
      ),
    ),
  };
  // Captura: os botões de áudio param a propagação do clique.
  (view.content as HTMLElement).addEventListener('click', (e) => (e.target as Element).closest('button') && logOnce(), true);
  return view;
};
