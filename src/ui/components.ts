import { h, type Child } from './dom';
import { icon } from './icons';
import { speak, type SpeakOptions } from '../lib/tts';
import { markAudioGenerated } from '../db/repo';
import type { Word } from '../db/schema';
import { openSheet } from './sheet';
import { hasBridge } from '../lib/momento';

/** Botão de áudio redondo (44 px): fala o texto e marca "tocando". */
export function playButton(text: string, opts: { wordId?: string; label?: string; voice?: SpeakOptions; testid?: string } = {}): HTMLButtonElement {
  const btn = h(
    'button',
    {
      class: 'ib',
      type: 'button',
      'aria-label': opts.label ?? `Ouvir ${text}`,
      'data-testid': opts.testid,
      onclick: async (e: Event) => {
        e.stopPropagation();
        document.querySelectorAll('.ib--on').forEach((b) => b.classList.remove('ib--on'));
        btn.classList.add('ib--on');
        const ok = await speak(text, opts.voice);
        btn.classList.remove('ib--on');
        if (ok && opts.wordId) void markAudioGenerated(opts.wordId);
      },
    },
    icon('play', 20),
  );
  return btn;
}

/** Botão secundário com ícone e texto ("Ouvir a conversa"). */
export function iconButton(iconName: string, label: string, onclick: () => void, testid?: string): HTMLButtonElement {
  return h('button', { class: 'btn2', type: 'button', onclick, 'data-testid': testid }, icon(iconName, 20), label);
}

export const NEW_WORD_NOTE = 'Você não precisa decorar: ela volta nos seus reencontros.';

/**
 * Folha de detalhe de uma palavra: francês, tradução, áudio e a ponte com o
 * português. Palavra nova: significado, gancho de memória (verificado) e o
 * lembrete de que ela volta sozinha. No Caderno (`full`), mostra tudo junto
 * e o Momento de origem.
 */
export function openWordSheet(word: Word, opts: { surface?: string; gloss?: string; origin?: string; full?: boolean; voice?: SpeakOptions } = {}): void {
  const surface = opts.surface ?? word.fr;
  const isForm = surface.toLowerCase() !== word.fr.toLowerCase();
  const bridged = hasBridge(word);
  const bridge = word.bridge;
  const blocks: Child[] = [];
  if (bridged && bridge) {
    blocks.push(h('div', { class: 'note' }, h('p', { class: 'lbl' }, 'A ponte com o português'), h('p', null, bridge.note)));
    if (opts.full && word.memory_hook_pt) blocks.push(h('div', { class: 'note' }, h('p', { class: 'lbl' }, 'Para lembrar'), h('p', null, word.memory_hook_pt)));
  } else {
    blocks.push(
      h(
        'div',
        { class: 'note' },
        h('p', { class: 'lbl' }, 'Palavra nova'),
        word.memory_hook_pt && h('p', null, word.memory_hook_pt),
        h('p', null, NEW_WORD_NOTE),
      ),
    );
  }
  openSheet(
    [
      h('div', { class: 'row between' }, h('p', { class: 'big', lang: 'fr' }, surface), playButton(surface, { wordId: word.id, voice: opts.voice })),
      h('p', { class: 'pt-l' }, opts.gloss ?? word.pt),
      isForm && h('p', { class: 'fine' }, `Forma de ${word.fr}.`),
      blocks,
      opts.origin && h('p', { class: 'fine' }, `Apareceu no momento “${opts.origin}”.`),
    ],
    { label: surface, testid: 'word-sheet' },
  );
}

/** Envolve um <select> para desenhar a seta com a cor do token (claro e escuro). */
export function selectWrap(select: HTMLSelectElement, full = true): HTMLElement {
  return h('span', { class: `select-wrap${full ? ' select-wrap--full' : ''}` }, select);
}
