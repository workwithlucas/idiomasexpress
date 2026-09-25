import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { completedMomentos, content, extraReviewCount, getDueStates } from '../db/repo';
import { currentUser } from '../ui/user';
import { openWordSheet, playButton } from '../ui/components';
import { dialogueWordIds, hasBridge, phraseFromBuilt } from '../lib/momento';
import { normalize } from '../lib/text';
import { skippedReencontrosToday } from '../ui/flags';
import { stopSpeaking } from '../lib/tts';

/**
 * Caderno: o que a pessoa guardou dos Momentos. As frases que ela montou, as
 * palavras das conversas (com a ponte e o gancho de memória) e, se houver
 * mais palavras querendo voltar hoje, "Revisar mais".
 */
export const cadernoView: View = async () => {
  const c = content();
  const user = currentUser();
  const done = await completedMomentos(user.id);
  const momentos = c.momentos.filter((m) => done.has(m.id));
  const extra = await extraReviewCount(user.id, skippedReencontrosToday());
  const due = (await getDueStates(user.id)).length;

  // Frases
  const phrases = momentos.map((m) => {
    const p = phraseFromBuilt(c.frameById.get(m.frame_id), done.get(m.id)!.built_phrase, c.wordById);
    return h(
      'li',
      { class: 'rule', dataset: { momento: m.id } },
      h('div', { class: 'grow' }, h('p', { class: 'r1', lang: 'fr' }, p.fr), p.pt && h('p', { class: 'r2' }, p.pt), h('p', { class: 'd' }, `Do momento “${m.title}”.`)),
      playButton(p.fr, { label: `Ouvir ${p.fr}` }),
    );
  });

  // Palavras, na ordem em que apareceram
  const ids = [...new Set(momentos.flatMap(dialogueWordIds))];
  const words = ids.map((id) => c.wordById.get(id)!).filter(Boolean);
  const list = h('ul', { class: 'panel', 'data-testid': 'words' });
  const count = h('p', { class: 'fine', 'aria-live': 'polite' });
  const fill = (q = '') => {
    const nq = normalize(q);
    const shown = words.filter((w) => !nq || normalize(w.fr).includes(nq) || normalize(w.pt).includes(nq));
    count.textContent = q ? `${shown.length} de ${words.length} palavras` : `${words.length} palavras`;
    render(
      list,
      shown.map((w) => {
        const mine = hasBridge(w);
        const origin = c.momentoById.get(c.wordOrigin.get(w.id) ?? '');
        return h(
          'li',
          null,
          h(
            'button',
            { class: 'list-row', type: 'button', dataset: { word: w.id }, onclick: () => openWordSheet(w, { full: true, origin: origin?.title }) },
            h('span', { class: 'grow' }, h('span', { class: 't', lang: 'fr' }, w.fr), h('span', { class: 'd' }, w.pt)),
            h('span', { class: `tag${mine ? ' tag--mine' : ''}` }, mine ? 'já era sua' : 'nova'),
            icon('chevronRight', 18),
          ),
        );
      }),
      !shown.length && h('li', { class: 'empty' }, 'Nenhuma palavra com esse trecho.'),
    );
  };
  fill();

  return {
    title: 'Caderno',
    tab: 'caderno',
    cleanup: stopSpeaking,
    content: h(
      'div',
      null,
      h('h1', { class: 'h1' }, 'Caderno'),
      h('p', { class: 'soft' }, 'Tudo o que você encontra nos momentos fica guardado aqui, com áudio. Nada para decorar.'),
      extra > 0 &&
        h(
          'section',
          { class: 'card', 'data-testid': 'review-more' },
          h('h2', { class: 'subtitle m0' }, 'Revisar mais'),
          h('p', { class: 'soft mt1' }, `${extra} ${extra === 1 ? 'palavra pode' : 'palavras podem'} voltar hoje, além dos reencontros do dia. Só se você quiser.`),
          h('a', { class: 'btn2 btn2--full', href: `#/reencontros?skip=${due - extra}`, 'data-testid': 'review-more-start' }, 'Revisar mais'),
        ),
      h('h2', { class: 'h3' }, 'Suas frases'),
      phrases.length ? h('ul', { class: 'panel', 'data-testid': 'phrases' }, phrases) : h('p', { class: 'empty' }, 'Cada momento termina com uma frase sua. Ela fica aqui.'),
      h('h2', { class: 'h3' }, 'Suas palavras'),
      words.length
        ? [
            h('label', { class: 'search' }, icon('search', 18), h('input', { type: 'search', placeholder: 'Buscar em francês ou português', 'aria-label': 'Buscar palavra', 'data-testid': 'word-search', oninput: (e: Event) => fill((e.target as HTMLInputElement).value) })),
            count,
            list,
          ]
        : h('p', { class: 'empty' }, 'As palavras das conversas aparecem aqui, com a ponte para o português.'),
    ),
  };
};
