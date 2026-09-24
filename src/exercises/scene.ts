import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { playButton } from '../ui/components';
import { logActivity } from '../db/repo';
import { speak } from '../lib/tts';
import { cue } from '../lib/sounds';
import { frenchSentence, liaisonNote, primaryButton, type Done, type Exercise } from './common';

export interface SceneLine {
  fr: string;
  pt: string;
}

/**
 * Produzir: vê a situação em português e tenta dizer em francês antes de
 * conferir. É a metade "ativa" da prática por situação.
 */
export function produceLine(line: SceneLine, userId: string, onDone: Done): Exercise {
  const answer = h('div');
  const el = h(
    'div',
    { class: 'lesson', 'data-kind': 'produce' },
    h('p', { class: 'eyebrow' }, 'Diga em francês'),
    h('p', { class: 'big-line', 'data-testid': 'produce-pt' }, line.pt),
    h('p', { class: 'hint' }, 'Fale em voz alta, depois confira.'),
    answer,
  );
  const show = () => {
    cue('tap');
    answer.replaceChildren(
      h(
        'div',
        { class: 'step-in stack stack--sm' },
        frenchSentence(line.fr, 'fr-sentence--big'),
        liaisonNote(line.fr),
        h('div', { class: 'row' }, playButton(line.fr, { size: 'lg', label: 'Ouvir' }), h('p', { class: 'hint' }, 'Foi parecido?')),
        h(
          'div',
          { class: 'row' },
          h('button', { class: 'btn btn--ghost btn--block', type: 'button', 'data-testid': 'self-almost', onclick: () => finish(false) }, 'Quase'),
          h('button', { class: 'btn btn--primary btn--block', type: 'button', 'data-testid': 'self-right', onclick: () => finish(true) }, 'Acertei'),
        ),
      ),
    );
    void speak(line.fr);
  };
  const finish = (right: boolean) => {
    cue(right ? 'right' : 'almost');
    void logActivity(userId, 'scenes', 'produce', { correct: right });
    onDone({ correct: right });
  };
  answer.append(primaryButton('Conferir', show, 'show-answer'));
  return { el };
}

/** Reconhecer: ouve a frase e confere se entendeu. */
export function recognizeLine(line: SceneLine, userId: string, onDone: Done): Exercise {
  const answer = h('div');
  const el = h(
    'div',
    { class: 'lesson', 'data-kind': 'recognize' },
    h('p', { class: 'eyebrow' }, 'O que você entendeu?'),
    h('button', { class: 'big-play', type: 'button', 'aria-label': 'Ouvir de novo', onclick: () => void speak(line.fr) }, icon('play', 34)),
    answer,
  );
  answer.append(
    primaryButton('Ver a frase', () => {
      cue('tap');
      void logActivity(userId, 'scenes', 'recognize');
      answer.replaceChildren(
        h('div', { class: 'step-in stack stack--sm' }, frenchSentence(line.fr, 'fr-sentence--big'), h('p', { class: 'frame__pt' }, line.pt), liaisonNote(line.fr), primaryButton('Continuar', () => onDone({ correct: true }))),
      );
    }, 'show-answer'),
  );
  void speak(line.fr);
  return { el };
}
