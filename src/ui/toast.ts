import { h } from './dom';
import { icon } from './icons';

type Tone = 'info' | 'success' | 'error';

let region: HTMLElement | null = null;

function ensureRegion(): HTMLElement {
  if (!region) {
    region = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(region);
  }
  return region;
}

export function toast(message: string, tone: Tone = 'info', action?: { label: string; run: () => void }, ms = 3600): void {
  const el = h(
    'div',
    { class: `toast toast--${tone}` },
    icon(tone === 'success' ? 'check' : tone === 'error' ? 'alert' : 'info', 18),
    h('span', { class: 'toast__msg' }, message),
    action &&
      h('button', { class: 'toast__action', onclick: () => { action.run(); el.remove(); } }, action.label),
  );
  ensureRegion().append(el);
  if (ms > 0) setTimeout(() => el.classList.add('toast--out'), ms);
  if (ms > 0) setTimeout(() => el.remove(), ms + 300);
}
