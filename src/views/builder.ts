import { h, render } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { playButton } from '../ui/components';
import { speak, stopSpeaking } from '../lib/tts';
import { fillFrame, normalize, pickRandom, primaryPt, shuffle } from '../lib/text';
import type { Frame, Word } from '../db/schema';

/** Renderiza o molde com o slot destacado (vazio ou preenchido). */
function templateView(template: string, fill?: string): HTMLElement {
  const [before, after] = template.split('___');
  return h(
    'p',
    { class: 'frame__template', lang: 'fr' },
    before,
    h('span', { class: `slot${fill ? ' slot--filled' : ''}`, 'data-testid': 'slot' }, fill ?? '   '),
    after,
  );
}

export const builderView: View = ({ query }) => {
  const c = content();
  const frames = c.frames;
  let frame: Frame = c.frameById.get(query.get('frame') ?? '') ?? pickRandom(frames);
  const stage = h('div', { class: 'stack' });

  const select = h(
    'select',
    {
      class: 'select',
      'aria-label': 'Escolher molde',
      onchange: () => {
        frame = c.frameById.get(select.value)!;
        show();
      },
    },
    frames.map((f) => h('option', { value: f.id }, f.template)),
  );

  const complete = (word: Word) => {
    const sentence = fillFrame(frame.template, word.fr);
    const pt = fillFrame(frame.pt, primaryPt(word));
    void logActivity(currentUser().id, 'builder', 'sentence', { word_id: word.id });
    render(
      stage,
      h(
        'div',
        { class: 'card frame frame--done' },
        h('p', { class: 'eyebrow' }, 'Sua frase'),
        templateView(frame.template, word.fr),
        h('p', { class: 'frame__sentence', lang: 'fr', 'data-testid': 'built-sentence' }, sentence),
        h('p', { class: 'frame__pt' }, pt),
        h(
          'div',
          { class: 'row' },
          playButton(sentence, { label: 'Ouvir a frase', size: 'lg' }),
          playButton(sentence, { label: 'Ouvir devagar', size: 'lg', rate: 0.65 }),
          h('p', { class: 'hint' }, 'Ouça e repita em voz alta 3 vezes, imitando a melodia.'),
        ),
        frame.note_pt && h('p', { class: 'note' }, icon('info', 16), frame.note_pt),
      ),
      h(
        'div',
        { class: 'row row--wrap' },
        h('a', { class: 'btn btn--ghost', href: `#/fala?texto=${encodeURIComponent(sentence)}` }, icon('mic', 18), 'Praticar pronúncia'),
        h('button', { class: 'btn btn--primary', type: 'button', onclick: () => { frame = pickRandom(frames, frame); select.value = frame.id; show(); }, 'data-testid': 'next-frame' }, 'Próximo molde', icon('arrowRight', 18)),
      ),
    );
    void speak(sentence);
  };

  const show = () => {
    const pool = shuffle(frame.slot_pool_ids.map((id) => c.wordById.get(id)!));
    const error = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const input = h('input', {
      class: 'input',
      type: 'text',
      placeholder: 'ou digite a palavra…',
      autocomplete: 'off',
      autocapitalize: 'off',
      spellcheck: false,
      lang: 'fr',
      'aria-label': 'Digite a palavra do slot',
    });
    const tryTyped = () => {
      const typed = normalize(input.value);
      if (!typed) return;
      const found = pool.find((w) => normalize(w.fr) === typed);
      if (found) complete(found);
      else {
        error.hidden = false;
        error.textContent = 'Essa palavra não encaixa neste molde. Toque em uma das opções acima.';
      }
    };

    render(
      stage,
      h(
        'div',
        { class: 'card frame' },
        h('div', { class: 'frame__top' }, h('p', { class: 'eyebrow' }, 'Complete a frase'), playButton(frame.template.replace('___', '…'), { size: 'sm', label: 'Ouvir o molde' })),
        templateView(frame.template),
        h('p', { class: 'frame__pt' }, frame.pt),
        h(
          'div',
          { class: 'slot-options' },
          pool.map((w) => h('button', { class: 'slot-option', type: 'button', lang: 'fr', dataset: { word: w.id }, onclick: () => complete(w) }, h('strong', null, w.fr), h('small', null, primaryPt(w)))),
        ),
        h(
          'form',
          { class: 'typed', onsubmit: (e: Event) => { e.preventDefault(); tryTyped(); } },
          input,
          h('button', { class: 'btn btn--ghost', type: 'submit' }, 'OK'),
        ),
        error,
      ),
    );
  };

  select.value = frame.id;
  show();

  return {
    title: 'Construtor de frases',
    back: '/aprender',
    tab: 'learn',
    cleanup: stopSpeaking,
    content: h(
      'div',
      { class: 'stack' },
      h(
        'div',
        { class: 'toolbar' },
        select,
        h('button', { class: 'icon-btn', type: 'button', title: 'Molde aleatório', 'aria-label': 'Molde aleatório', onclick: () => { frame = pickRandom(frames, frame); select.value = frame.id; show(); } }, icon('shuffle', 18)),
      ),
      stage,
    ),
  };
};
