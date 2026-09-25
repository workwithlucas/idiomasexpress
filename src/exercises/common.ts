import { h, type Child } from '../ui/dom';
import { icon } from '../ui/icons';
import { liaisonBetween } from '../lib/liaison';

/** Um exercício montado: o elemento e (opcional) o que desligar ao sair. */
export interface Exercise {
  el: HTMLElement;
  cleanup?: () => void;
}

export interface ExerciseResult {
  correct: boolean;
}

export type Done = (r: ExerciseResult) => void;

/**
 * Frase em francês com os pontos de ligação marcados: um arco sutil liga as
 * duas palavras e a letra que "acorda" fica em destaque.
 */
/** Arco da ligação sob as duas palavras: mesmo traço (1,75) e pontas redondas dos ícones do DS. */
function liaisonArc(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'lia__arc');
  svg.setAttribute('viewBox', '0 0 24 10');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<path d="M2 2 Q12 12 22 2" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  return svg;
}

export function frenchSentence(sentence: string, cls = ''): HTMLElement {
  // Separa por espaços mantendo cada separador (o espaço fino antes de "?" fica).
  const parts = sentence.trim().split(/(\s+)/);
  const words = parts.filter((_, i) => i % 2 === 0);
  const el = h('p', { class: `fr-sentence ${cls}`.trim(), lang: 'fr' });
  words.forEach((text, i) => {
    const liaison = liaisonBetween(text, words[i + 1]);
    el.append(liaison ? liaisonWord(text, liaison) : text);
    if (i < words.length - 1) el.append(liaison ? h('span', { class: 'lia__gap' }, ' ') : parts[2 * i + 1]);
  });
  return el;
}

/** Palavra com a letra calada que acorda na ligação, e o arco embaixo. */
export function liaisonWord(text: string, liaison: { sound: string; letter: string }): HTMLElement {
  return h(
    'span',
    { class: 'lia', title: `Aqui liga: o "${liaison.letter}" soa "${liaison.sound}"` },
    text.slice(0, -1),
    h('span', { class: 'lia__letter' }, text.slice(-1)),
    liaisonArc(),
  );
}

export function feedback(kind: 'right' | 'almost', title: string, text?: Child): HTMLElement {
  return h(
    'div',
    { class: `fb fb--${kind}`, role: 'status', 'data-testid': 'feedback' },
    kind === 'right' && h('span', { class: 'fb__icon' }, icon('check', 18)),
    h('div', null, h('strong', null, title), text && h('p', null, text)),
  );
}

export function primaryButton(label: string, onclick: () => void, testid = 'continue'): HTMLButtonElement {
  return h('button', { class: 'btn', type: 'button', onclick, 'data-testid': testid }, label);
}

/** Troca o conteúdo de um palco com uma transição curta. */
export function swap(stage: HTMLElement, ...children: Child[]): void {
  stage.replaceChildren();
  const inner = h('div', { class: 'step-in' }, children);
  stage.append(inner);
}
