import { h, type Child } from './dom';
import { stopSpeaking } from '../lib/tts';

/**
 * Folha que sobe de baixo (detalhe de palavra, capítulo do Como funciona
 * dentro do Momento, Ajustes rápidos). Fecha no botão, no fundo ou com Esc,
 * e devolve o foco para quem a abriu.
 */
let open: { wrap: HTMLElement; opener: Element | null; onClose?: () => void } | null = null;

export function openSheet(children: Child[], opts: { label: string; onClose?: () => void; testid?: string } ): HTMLElement {
  closeSheet();
  const opener = document.activeElement;
  const panel = h(
    'div',
    { class: 'sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.label, tabindex: '-1', 'data-testid': opts.testid ?? 'sheet' },
    children,
    h('button', { class: 'btn2 btn2--full', type: 'button', onclick: () => closeSheet(), 'data-testid': 'sheet-close' }, 'Fechar'),
  );
  const wrap = h('div', { class: 'sheet-wrap', onclick: (e: Event) => e.target === wrap && closeSheet() }, panel);
  document.body.append(wrap);
  document.body.classList.add('has-sheet');
  open = { wrap, opener, onClose: opts.onClose };
  panel.focus({ preventScroll: true });
  return panel;
}

export function closeSheet(): void {
  if (!open) return;
  const { wrap, opener, onClose } = open;
  open = null;
  stopSpeaking();
  wrap.remove();
  document.body.classList.remove('has-sheet');
  onClose?.();
  if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && open) closeSheet();
});

// Mantém o foco dentro da folha aberta (Tab e Shift+Tab).
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Tab' || !open) return;
  const focusables = [...open.wrap.querySelectorAll<HTMLElement>('button, a[href], input, select, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.hasAttribute('disabled'));
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && (document.activeElement === first || !open.wrap.contains(document.activeElement))) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
});
