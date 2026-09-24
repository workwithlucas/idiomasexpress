import { h, type Child } from './dom';
import { icon } from './icons';
import { speak, ttsSupported } from '../lib/tts';
import { addToReview, markAudioGenerated } from '../db/repo';
import type { Word } from '../db/schema';
import { withArticle } from '../lib/text';
import { currentUser, notifyProgressChanged } from './session';
import { toast } from './toast';

/** Botão de áudio: fala o texto e mostra estado "tocando". */
export function playButton(text: string, opts: { wordId?: string; label?: string; size?: 'sm' | 'md' | 'lg'; rate?: number } = {}): HTMLButtonElement {
  const size = opts.size ?? 'md';
  const btn = h(
    'button',
    {
      class: `play play--${size}`,
      type: 'button',
      'aria-label': opts.label ?? `Ouvir "${text}"`,
      title: 'Ouvir',
      onclick: async (e: Event) => {
        e.stopPropagation();
        if (!ttsSupported) {
          toast('Este navegador não tem síntese de voz. Tente Chrome, Edge ou Safari.', 'error');
          return;
        }
        document.querySelectorAll('.play--active').forEach((b) => b.classList.remove('play--active'));
        btn.classList.add('play--active');
        const ok = await speak(text, { rate: opts.rate });
        btn.classList.remove('play--active');
        if (ok && opts.wordId) void markAudioGenerated(opts.wordId);
      },
    },
    opts.rate && opts.rate < 0.8
      ? h('span', { class: 'play__slow' }, `${String(opts.rate).replace('.', ',')}×`)
      : icon('play', size === 'lg' ? 26 : size === 'sm' ? 16 : 20),
  );
  return btn;
}

export function ipa(text: string): HTMLElement {
  return h('span', { class: 'ipa', lang: 'fr-FR-fonipa' }, `/${text}/`);
}

/** Botão "+ revisão" que adiciona a palavra ao FSRS do perfil ativo. */
export function addReviewButton(word: Word): HTMLButtonElement {
  const btn = h(
    'button',
    {
      class: 'icon-btn',
      type: 'button',
      title: 'Adicionar à revisão',
      'aria-label': `Adicionar "${word.fr}" à revisão`,
      onclick: async (e: Event) => {
        e.stopPropagation();
        const added = await addToReview(currentUser().id, word.id);
        btn.classList.add('icon-btn--done');
        btn.replaceChildren(icon('check', 18));
        btn.disabled = true;
        toast(added ? `"${word.fr}" entrou na sua revisão.` : `"${word.fr}" já está na sua revisão.`, 'success');
        notifyProgressChanged();
      },
    },
    icon('bookmark', 18),
  );
  return btn;
}

/** Linha de palavra: áudio, francês (com artigo), IPA e tradução. */
export function wordRow(word: Word, extra?: Child, opts: { review?: boolean } = {}): HTMLElement {
  return h(
    'li',
    { class: 'word-row' },
    playButton(word.fr, { wordId: word.id, size: 'sm' }),
    h(
      'div',
      { class: 'word-row__text' },
      h('div', { class: 'word-row__fr', lang: 'fr' }, withArticle(word)),
      h('div', { class: 'word-row__meta' }, ipa(word.ipa), h('span', { class: 'word-row__pt' }, word.pt)),
      extra,
    ),
    opts.review !== false && addReviewButton(word),
  );
}

export function sectionTitle(title: string, subtitle?: string): HTMLElement {
  return h('header', { class: 'section-title' }, h('h2', null, title), subtitle && h('p', null, subtitle));
}

export function emptyState(title: string, text: string, action?: Child): HTMLElement {
  return h('div', { class: 'empty' }, h('div', { class: 'empty__icon' }, icon('sparkles', 28)), h('h3', null, title), h('p', null, text), action);
}

export function segmented<T extends string>(
  options: { value: T; label: string }[],
  value: T,
  onChange: (v: T) => void,
): HTMLElement {
  const wrap = h('div', { class: 'segmented', role: 'tablist' });
  const buttons = options.map((o) =>
    h(
      'button',
      {
        class: 'segmented__btn',
        type: 'button',
        role: 'tab',
        'aria-selected': String(o.value === value),
        onclick: () => {
          buttons.forEach((b) => b.setAttribute('aria-selected', 'false'));
          btnFor(o.value)?.setAttribute('aria-selected', 'true');
          onChange(o.value);
        },
        dataset: { value: o.value },
      },
      o.label,
    ),
  );
  const btnFor = (v: T) => buttons.find((b) => b.dataset.value === v);
  wrap.append(...buttons);
  return wrap;
}
