import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { addReviewButton, ipa, playButton, segmented, wordRow } from '../ui/components';

export const cognatesView: View = ({ query }) => {
  const c = content();
  const body = h('div', { class: 'stack' });
  let logged = false;
  const logOnce = () => {
    if (!logged) void logActivity(currentUser().id, 'cognates', 'study');
    logged = true;
  };

  const showRules = () =>
    render(
      body,
      h('p', { class: 'lead' }, `O português já te dá milhares de palavras francesas. Aprenda ${c.cognateRules.length} regras de conversão e reconheça-as na hora.`),
      h(
        'div',
        { class: 'accordion' },
        c.cognateRules.map((rule) => {
          const words = rule.examples.map((id) => c.wordById.get(id)!).filter(Boolean);
          const details = h(
            'details',
            { class: 'rule', dataset: { rule: rule.id }, ontoggle: () => details.open && logOnce() },
            h(
              'summary',
              { class: 'rule__summary' },
              h('span', { class: 'rule__pattern' }, rule.pattern),
              h('span', { class: 'rule__count' }, `${words.length} palavras`),
              icon('chevronDown', 18),
            ),
            h('div', { class: 'rule__body' }, h('p', { class: 'rule__explain' }, rule.explanation), h('ul', { class: 'word-list' }, words.map((w) => wordRow(w)))),
          );
          return details;
        }),
      ),
    );

  const showFalse = () => {
    logOnce();
    render(
      body,
      h('div', { class: 'callout callout--warn' }, icon('alert', 20), h('p', null, 'Falsos cognatos parecem português, mas significam outra coisa. São os erros mais comuns (e mais engraçados) de brasileiros.')),
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
              h('div', { class: 'false-card__words' }, h('strong', { lang: 'fr' }, w.fr), ipa(w.ipa)),
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
  (initial === 'false' ? showFalse : showRules)();

  return {
    title: 'Cognatos',
    back: '/aprender',
    tab: 'learn',
    content: h(
      'div',
      { class: 'stack' },
      segmented(
        [
          { value: 'rules', label: `Regras (${c.cognateRules.length})` },
          { value: 'false', label: `Falsos amigos (${c.falseCognates.length})` },
        ],
        initial,
        (v) => (v === 'rules' ? showRules() : showFalse()),
      ),
      body,
    ),
  };
};
