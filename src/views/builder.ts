import { selectWrap } from '../ui/components';
import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content } from '../db/repo';
import { currentUser } from '../ui/session';
import { frameExercise } from '../exercises/frame';
import { swap, type Exercise } from '../exercises/common';
import { pickRandom } from '../lib/text';
import { stopSpeaking } from '../lib/tts';
import type { Frame } from '../db/schema';

export const builderView: View = ({ query }) => {
  const c = content();
  const user = currentUser();
  let frame: Frame = c.frameById.get(query.get('frame') ?? '') ?? pickRandom(c.frames);
  const stage = h('div');
  let current: Exercise | null = null;

  const select = h(
    'select',
    { class: 'select', 'aria-label': 'Escolher frase', onchange: () => show(c.frameById.get(select.value)!) },
    c.frames.map((f) => h('option', { value: f.id }, f.template)),
  );

  const show = (f: Frame) => {
    current?.cleanup?.();
    frame = f;
    select.value = f.id;
    current = frameExercise(f, user.id, () => show(pickRandom(c.frames, frame)), { practiceLink: true, doneLabel: 'Próxima' });
    swap(stage, current.el);
  };

  show(frame);

  return {
    title: 'Monte a frase',
    back: '/aprender',
    tab: 'learn',
    cleanup: () => {
      current?.cleanup?.();
      stopSpeaking();
    },
    content: h(
      'div',
      { class: 'stack' },
      h('div', { class: 'toolbar' }, selectWrap(select), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Outra frase', title: 'Outra frase', onclick: () => show(pickRandom(c.frames, frame)) }, icon('shuffle', 18))),
      stage,
    ),
  };
};
