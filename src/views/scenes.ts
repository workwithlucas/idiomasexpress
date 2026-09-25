import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content } from '../db/repo';
import { currentUser } from '../ui/session';
import { playButton, wordRow } from '../ui/components';
import { fillFrame, pickRandom, primaryPt, shuffle } from '../lib/text';
import { stopSpeaking } from '../lib/tts';
import { produceLine, recognizeLine, type SceneLine } from '../exercises/scene';
import { frenchSentence, swap, type Exercise } from '../exercises/common';
import { ring } from './session';

const ROUND = 6;

export const scenesView: View = () => {
  const c = content();
  return {
    title: 'Situações reais',
    back: '/aprender',
    tab: 'learn',
    content: h(
      'ul',
      { class: 'scene-grid' },
      c.scenes.map((s) =>
        h(
          'li',
          null,
          h(
            'a',
            { class: 'scene-card', href: `#/situacoes/${s.id}`, dataset: { scene: s.id } },
            h('span', { class: 'scene-card__icon' }, icon(s.icon, 24)),
            h('strong', null, s.name),
            h('span', null, s.description),
          ),
        ),
      ),
    ),
  };
};

/** Frases da cena: cada molde com uma palavra sorteada do seu slot. */
function sceneLines(frameIds: string[]): SceneLine[] {
  const c = content();
  return frameIds.flatMap((id) => {
    const f = c.frameById.get(id);
    if (!f) return [];
    const w = c.wordById.get(pickRandom(f.slot_pool_ids))!;
    return [{ fr: fillFrame(f.template, w.fr), pt: fillFrame(f.pt, primaryPt(w)) }];
  });
}

export const sceneDetailView: View = ({ params }) => {
  const c = content();
  const user = currentUser();
  const scene = c.sceneById.get(params.id);
  if (!scene) throw new Error('Situação não encontrada.');
  const stage = h('div');
  let current: Exercise | null = null;

  const intro = () =>
    swap(
      stage,
      h(
        'section',
        { class: 'hero-lite' },
        h('h2', null, scene.name),
        h('p', { class: 'muted' }, scene.description),
        h('button', { class: 'btn btn--primary btn--block btn--lg', type: 'button', 'data-testid': 'scene-start', onclick: practice }, 'Praticar'),
      ),
      h(
        'details',
        { class: 'known' },
        h('summary', null, 'Todas as frases e palavras'),
        h(
          'ul',
          { class: 'sentence-list' },
          scene.frame_ids.flatMap((id) => {
            const f = c.frameById.get(id);
            if (!f) return [];
            return f.slot_pool_ids.slice(0, 3).map((wid) => {
              const w = c.wordById.get(wid)!;
              const fr = fillFrame(f.template, w.fr);
              return h('li', { class: 'sentence' }, playButton(fr, { size: 'sm' }), h('span', { class: 'sentence__text' }, frenchSentence(fr), h('small', null, fillFrame(f.pt, primaryPt(w)))));
            });
          }),
        ),
        h('ul', { class: 'word-list' }, scene.word_ids.map((id) => c.wordById.get(id)).filter(Boolean).map((w) => wordRow(w!))),
      ),
    );

  /**
   * Rodada de 6: produzir, reconhecer, produzir… — começa e termina
   * produzindo, então pelo menos metade pede para a pessoa dizer a frase.
   */
  const practice = () => {
    // Cenas com poucos moldes ganham uma segunda passada, com outras palavras.
    const pool = [...shuffle(sceneLines(scene.frame_ids)), ...shuffle(sceneLines(scene.frame_ids))];
    const lines = pool.filter((l, k) => pool.findIndex((x) => x.fr === l.fr) === k).slice(0, ROUND);
    let i = 0;
    let right = 0;
    const next = () => {
      current?.cleanup?.();
      if (i >= lines.length) {
        swap(
          stage,
          h(
            'div',
            { class: 'session-done', 'data-testid': 'scene-done' },
            ring(1),
            h('h2', null, 'Boa.'),
            h('p', { class: 'muted' }, `${right} de ${Math.ceil(lines.length / 2)} frases saíram de primeira.`),
            h('button', { class: 'btn btn--primary btn--block', type: 'button', onclick: practice }, 'Outra rodada'),
            h('a', { class: 'btn btn--ghost btn--block', href: '#/situacoes' }, 'Outras situações'),
          ),
        );
        return;
      }
      const line = lines[i];
      const produce = i % 2 === 0;
      i++;
      current = (produce ? produceLine : recognizeLine)(line, user.id, (r) => {
        if (produce && r.correct) right++;
        next();
      });
      swap(stage, h('div', { class: 'stack' }, h('div', { class: 'progress' }, h('span', { class: 'progress__bar', style: `width:${((i - 1) / lines.length) * 100}%` })), current.el));
    };
    next();
  };

  intro();

  return {
    title: scene.name,
    back: '/situacoes',
    tab: 'learn',
    cleanup: () => {
      current?.cleanup?.();
      stopSpeaking();
    },
    content: stage,
  };
};
