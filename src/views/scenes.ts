import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { content, logActivity } from '../db/repo';
import { currentUser } from '../ui/session';
import { playButton, wordRow } from '../ui/components';
import { fillFrame, primaryPt } from '../lib/text';
import { stopSpeaking } from '../lib/tts';

export const scenesView: View = () => {
  const c = content();
  return {
    title: 'Frases por situação',
    back: '/aprender',
    tab: 'learn',
    content: h(
      'div',
      { class: 'stack' },
      h('p', { class: 'lead' }, 'O vocabulário e os moldes de frase de cada situação real da mudança — tudo reaproveitado dos outros módulos.'),
      h(
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
              h('small', null, `${s.word_ids.length} palavras · ${s.frame_ids.length} moldes`),
            ),
          ),
        ),
      ),
    ),
  };
};

export const sceneDetailView: View = ({ params }) => {
  const c = content();
  const scene = c.sceneById.get(params.id);
  if (!scene) throw new Error('Situação não encontrada.');
  void logActivity(currentUser().id, 'scenes', 'open');
  const frames = scene.frame_ids.map((id) => c.frameById.get(id)!).filter(Boolean);
  const words = scene.word_ids.map((id) => c.wordById.get(id)!).filter(Boolean);

  return {
    title: scene.name,
    back: '/situacoes',
    tab: 'learn',
    cleanup: stopSpeaking,
    content: h(
      'div',
      { class: 'stack' },
      h('div', { class: 'scene-hero' }, h('span', { class: 'scene-card__icon' }, icon(scene.icon, 26)), h('p', null, scene.description)),
      h('h3', { class: 'list-heading' }, 'Frases prontas'),
      h(
        'ul',
        { class: 'frame-list' },
        frames.map((f) =>
          h(
            'li',
            { class: 'card frame-item' },
            h(
              'div',
              { class: 'frame-item__head' },
              h('div', null, h('strong', { lang: 'fr' }, f.template), h('small', null, f.pt)),
              h('a', { class: 'icon-btn', href: `#/frases?frame=${f.id}`, title: 'Abrir no construtor', 'aria-label': `Abrir "${f.template}" no construtor` }, icon('puzzle', 18)),
            ),
            h(
              'ul',
              { class: 'sentence-list' },
              f.slot_pool_ids.map((id) => {
                const w = c.wordById.get(id)!;
                const sentence = fillFrame(f.template, w.fr);
                return h(
                  'li',
                  { class: 'sentence' },
                  playButton(sentence, { size: 'sm' }),
                  h('span', { class: 'sentence__text' }, h('span', { lang: 'fr' }, sentence), h('small', null, fillFrame(f.pt, primaryPt(w)))),
                  h('a', { class: 'icon-btn icon-btn--sm', href: `#/fala?texto=${encodeURIComponent(sentence)}`, title: 'Praticar pronúncia', 'aria-label': `Praticar "${sentence}"` }, icon('mic', 16)),
                );
              }),
            ),
            f.note_pt && h('p', { class: 'note' }, icon('info', 16), f.note_pt),
          ),
        ),
      ),
      h('h3', { class: 'list-heading' }, `Vocabulário (${words.length})`),
      h('ul', { class: 'word-list card' }, words.map((w) => wordRow(w))),
    ),
  };
};
