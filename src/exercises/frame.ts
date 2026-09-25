import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import { playButton } from '../ui/components';
import { content, logActivity } from '../db/repo';
import type { Frame, Word } from '../db/schema';
import { fillFrame, normalize, primaryPt, shuffle } from '../lib/text';
import { speak } from '../lib/tts';
import { cue } from '../lib/sounds';
import { frenchSentence, liaisonNote, swap, type Done, type Exercise } from './common';
import { echoPanel } from './echo';

function templateView(template: string): HTMLElement {
  const [before, after] = template.split('___');
  return h('p', { class: 'frame__template', lang: 'fr' }, before, h('span', { class: 'slot', 'data-testid': 'slot' }, '   '), after);
}

/**
 * Completar um molde: escolher (ou digitar) a palavra do slot e ouvir a frase
 * inteira — com as ligações (liaison) marcadas e já aplicadas na fala.
 */
export function frameExercise(frame: Frame, userId: string, onDone: Done, opts: { practiceLink?: boolean; doneLabel?: string } = {}): Exercise {
  const c = content();
  const pool = shuffle(frame.slot_pool_ids.map((id) => c.wordById.get(id)!).filter(Boolean));
  const stage = h('div', { class: 'lesson frame', dataset: { frame: frame.id } });
  let echo: ReturnType<typeof echoPanel> | null = null;

  // Principal: repetir em voz alta e ver a melodia. Seguir sem gravar é possível ("Pular").
  const next = h('button', { class: 'btn btn--ghost btn--block', type: 'button', 'data-testid': 'next-frame', onclick: () => onDone({ correct: true }) }, 'Pular');
  const echoEl = (sentence: string) => {
    echo?.cleanup();
    echo = echoPanel(sentence, userId, () => {
      next.className = 'btn btn--primary btn--block btn--lg';
      next.replaceChildren(opts.doneLabel ?? 'Continuar');
    });
    return echo.el;
  };

  const complete = (word: Word) => {
    cue('tap');
    const sentence = fillFrame(frame.template, word.fr);
    void logActivity(userId, 'builder', 'sentence', { word_id: word.id });
    swap(
      stage,
      h('p', { class: 'eyebrow' }, 'Sua frase'),
      frenchSentence(sentence, 'fr-sentence--big'),
      h('p', { class: 'frame__pt' }, fillFrame(frame.pt, primaryPt(word))),
      liaisonNote(sentence),
      h(
        'div',
        { class: 'row' },
        playButton(sentence, { label: 'Ouvir a frase', size: 'lg' }),
        playButton(sentence, { label: 'Ouvir devagar', size: 'lg', rate: 0.65 }),
      ),
      frame.note_pt && h('p', { class: 'note' }, icon('info', 16), frame.note_pt),
      h('span', { hidden: true, 'data-testid': 'built-sentence' }, sentence),
      echoEl(sentence),
      opts.practiceLink && h('a', { class: 'btn btn--ghost btn--block', href: `#/fala?texto=${encodeURIComponent(sentence)}` }, 'Nota de pronúncia'),
      next,
    );
    void speak(sentence);
  };

  const input = h('input', {
    class: 'input',
    type: 'text',
    placeholder: 'ou digite…',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: false,
    lang: 'fr',
    'aria-label': 'Digite a palavra que falta',
  });
  const error = h('p', { class: 'hint', role: 'status', hidden: true });
  const tryTyped = () => {
    const typed = normalize(input.value);
    if (!typed) return;
    const found = pool.find((w) => normalize(w.fr) === typed);
    if (found) complete(found);
    else {
      cue('almost');
      error.hidden = false;
      error.textContent = 'Essa não encaixa aqui. Escolha uma das opções.';
    }
  };

  swap(
    stage,
    h('p', { class: 'eyebrow' }, 'Complete'),
    templateView(frame.template),
    h('p', { class: 'frame__pt' }, frame.pt),
    h(
      'div',
      { class: 'slot-options' },
      pool.map((w) => h('button', { class: 'slot-option', type: 'button', lang: 'fr', dataset: { word: w.id }, onclick: () => complete(w) }, h('strong', null, w.fr), h('small', null, primaryPt(w)))),
    ),
    h('form', { class: 'typed', onsubmit: (e: Event) => { e.preventDefault(); tryTyped(); } }, input, h('button', { class: 'btn btn--ghost', type: 'submit' }, 'OK')),
    error,
  );
  return { el: stage, cleanup: () => echo?.cleanup() };
}
