import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { content, logActivity } from '../db/repo';
import type { MinimalPair, Word } from '../db/schema';
import { primaryPt } from '../lib/text';
import { speak, speakSequence, speakerPool, stopSpeaking, type SpeakerProfile } from '../lib/tts';
import { cue } from '../lib/sounds';
import { feedback, primaryButton, type Done, type Exercise } from './common';

export type PairMode = 'which' | 'order';

let lastSpeaker = 0;

/** Sorteia um falante diferente do último (alta variabilidade de vozes). */
export function nextSpeaker(): SpeakerProfile {
  const pool = speakerPool();
  const options = pool.length > 1 ? pool.filter((p) => p.id !== lastSpeaker) : pool;
  const pick = options[Math.floor(Math.random() * options.length)];
  lastSpeaker = pick.id;
  return pick;
}

/**
 * Uma rodada de par mínimo. Cada rodada sorteia outro falante; as duas
 * palavras da rodada saem na MESMA voz, para a comparação ser justa.
 */
export function pairRound(pair: MinimalPair, mode: PairMode, userId: string, onDone: Done, speaker = nextSpeaker()): Exercise {
  const c = content();
  const a = c.wordById.get(pair.word_a_id)!;
  const b = c.wordById.get(pair.word_b_id)!;
  const target: Word = Math.random() < 0.5 ? a : b;
  const other = target === a ? b : a;
  const voice = { voice: speaker.voice, pitch: speaker.pitch, rate: speaker.rate };
  const play = () => (mode === 'which' ? speak(target.fr, voice) : speakSequence([target.fr, other.fr], 800, voice));
  let answered = false;
  const result = h('div');

  const options =
    mode === 'which'
      ? [a, b].map((w) => ({ w, label: w.fr }))
      : [
          { w: a, label: `${a.fr} → ${b.fr}` },
          { w: b, label: `${b.fr} → ${a.fr}` },
        ];

  const el = h(
    'div',
    { class: 'lesson listen', dataset: { pair: pair.id, speaker: String(speaker.id) } },
    h(
      'div',
      { class: 'row row--between' },
      h('p', { class: 'eyebrow' }, mode === 'which' ? 'Qual você ouviu?' : 'Qual veio primeiro?'),
      h('span', { class: `speaker speaker--${speaker.id}`, title: 'Cada rodada, uma voz' }, h('span', { class: 'speaker__dot' }), `voz ${speaker.id}`),
    ),
    h('button', { class: 'big-play', type: 'button', 'aria-label': 'Ouvir de novo', 'data-testid': 'listen-play', onclick: () => void play() }, icon('play', 34)),
    h(
      'div',
      { class: 'options' },
      options.map((o) => {
        const btn: HTMLButtonElement = h('button', { class: 'option', type: 'button', lang: 'fr', dataset: { word: o.w.id } }, h('strong', null, o.label));
        btn.addEventListener('click', () => {
          if (answered) return;
          answered = true;
          const right = o.w === target;
          cue(right ? 'right' : 'almost');
          btn.classList.add(right ? 'option--right' : 'option--almost');
          el.querySelectorAll<HTMLButtonElement>('.option').forEach((x) => (x.disabled = true));
          void logActivity(userId, 'listening', mode, { correct: right, word_id: target.id });
          result.replaceChildren(
            h(
              'div',
              { class: 'step-in stack stack--sm' },
              feedback(right ? 'right' : 'almost', right ? 'Isso.' : 'Quase.', mode === 'which' ? `Era "${target.fr}".` : `Foi "${target.fr}", depois "${other.fr}".`),
              h(
                'div',
                { class: 'compare' },
                [a, b].map((w) =>
                  h(
                    'button',
                    { class: 'compare__item', type: 'button', onclick: () => void speak(w.fr, voice), 'aria-label': `Ouvir "${w.fr}"` },
                    icon('play', 18),
                    h('strong', { lang: 'fr' }, w.fr),
                    h('small', null, primaryPt(w)),
                  ),
                ),
              ),
              primaryButton('Continuar', () => onDone({ correct: right }), 'next-round'),
            ),
          );
        });
        return btn;
      }),
    ),
    result,
  );
  void play();
  return { el, cleanup: stopSpeaking };
}
