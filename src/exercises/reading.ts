import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { playButton } from '../ui/components';
import { content, logActivity } from '../db/repo';
import type { ReadingExample, ReadingRule } from '../db/schema';
import { primaryPt, shuffle } from '../lib/text';
import { speak, speakSequence } from '../lib/tts';
import { cue } from '../lib/sounds';
import { feedback, primaryButton, swap, type Done, type Exercise } from './common';

export interface Example {
  fr: string;
  pt: string;
  wordId?: string;
}

export function resolveExample(e: ReadingExample): Example {
  if ('word_id' in e) {
    const w = content().wordById.get(e.word_id)!;
    return { fr: w.fr, pt: primaryPt(w), wordId: w.id };
  }
  return { fr: e.fr, pt: e.pt };
}

function exampleCard(e: Example): HTMLElement {
  return h(
    'li',
    { class: 'ex-card' },
    playButton(e.fr, { wordId: e.wordId, size: 'sm' }),
    h('span', { class: 'ex-card__text' }, h('strong', { lang: 'fr' }, e.fr), h('small', null, e.pt)),
  );
}

/**
 * Descoberta de uma regra de leitura:
 *  1. três palavras (escritas + áudio), sem dizer a regra;
 *  2. "essas letras soam como…?" — três opções de som;
 *  3. confirmação da regra;
 *  4. aplicar: ouvir palavras novas e reconhecer qual é, pela escrita.
 */
export function readingLesson(rule: ReadingRule, userId: string, onDone: Done): Exercise {
  const c = content();
  const examples = rule.examples.map(resolveExample);
  const discover = examples.slice(0, 3);
  const apply = examples.slice(3, 5);
  const stage = h('div', { class: 'lesson', dataset: { rule: rule.id } });
  let applyRight = 0;

  // Distratores: sons de outras regras, diferentes deste.
  const otherSounds = shuffle([...new Set(c.readingRules.filter((r) => r.sound !== rule.sound).map((r) => r.sound))]).slice(0, 2);
  const otherWords = shuffle(
    c.readingRules.filter((r) => r.id !== rule.id).flatMap((r) => r.examples.map(resolveExample)).filter((e) => !examples.some((x) => x.fr === e.fr)),
  );

  const stepAsk = () => {
    const options = shuffle([rule.sound, ...otherSounds]);
    let answered = false;
    swap(
      stage,
      h(
        'div',
        { class: 'row row--between' },
        h('p', { class: 'eyebrow' }, 'Ouça os três'),
        h('button', { class: 'btn btn--ghost btn--sm', type: 'button', onclick: () => void speakSequence(discover.map((e) => e.fr), 450) }, icon('play', 16), 'Ouvir'),
      ),
      h('ul', { class: 'ex-list' }, discover.map(exampleCard)),
      h('h2', { class: 'ask' }, h('span', { class: 'grapheme', lang: 'fr' }, rule.grapheme), ' soa como…'),
      h(
        'div',
        { class: 'choices' },
        options.map((o) => {
          const b: HTMLButtonElement = h('button', { class: 'choice', type: 'button', dataset: { right: String(o === rule.sound) } }, o);
          b.addEventListener('click', () => {
            if (answered) return;
            answered = true;
            const right = o === rule.sound;
            cue(right ? 'right' : 'almost');
            b.classList.add(right ? 'choice--right' : 'choice--almost');
            void logActivity(userId, 'reading', `discover:${rule.id}`, { correct: right });
            setTimeout(() => reveal(right), right ? 350 : 650);
          });
          return b;
        }),
      ),
    );
    void speakSequence(discover.map((e) => e.fr), 450);
  };

  const reveal = (right: boolean) => {
    swap(
      stage,
      feedback(right ? 'right' : 'almost', right ? 'Isso mesmo!' : `Quase — soa ${rule.sound}.`),
      h(
        'div',
        { class: 'rule-card' },
        h('p', { class: 'rule-card__pattern', 'data-testid': 'rule-pattern' }, h('span', { lang: 'fr' }, rule.grapheme), ' → ', rule.sound),
        h('p', { class: 'rule-card__tip' }, rule.tip_pt),
      ),
      h('ul', { class: 'ex-list' }, discover.map(exampleCard)),
      primaryButton('Agora você', () => stepApply(0)),
    );
  };

  const stepApply = (i: number) => {
    if (i >= apply.length) {
      onDone({ correct: applyRight >= 1 });
      return;
    }
    const target = apply[i];
    const options = shuffle([target, ...otherWords.slice(i * 2, i * 2 + 2)]);
    let answered = false;
    const result = h('div');
    swap(
      stage,
      h('p', { class: 'eyebrow' }, `Sua vez · ${i + 1} de ${apply.length}`),
      h('h2', { class: 'ask' }, 'Qual destas você ouviu?'),
      h('button', { class: 'big-play big-play--sm', type: 'button', 'aria-label': 'Ouvir de novo', onclick: () => void speak(target.fr) }, icon('play', 26)),
      h(
        'div',
        { class: 'choices' },
        options.map((o) => {
          const b: HTMLButtonElement = h('button', { class: 'choice', type: 'button', lang: 'fr', dataset: { right: String(o === target) } }, o.fr);
          b.addEventListener('click', () => {
            if (answered) return;
            answered = true;
            const right = o === target;
            if (right) applyRight++;
            cue(right ? 'right' : 'almost');
            b.classList.add(right ? 'choice--right' : 'choice--almost');
            result.replaceChildren(
              h(
                'div',
                { class: 'step-in stack stack--sm' },
                feedback(right ? 'right' : 'almost', right ? 'Isso!' : `Quase — era "${target.fr}".`, target.pt),
                primaryButton(i === apply.length - 1 ? 'Concluir' : 'Próxima', () => stepApply(i + 1)),
              ),
            );
          });
          return b;
        }),
      ),
      result,
    );
    void speak(target.fr);
  };

  stepAsk();
  return { el: stage };
}
