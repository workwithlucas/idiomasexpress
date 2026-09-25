import { h, type Child } from '../ui/dom';
import { icon } from '../ui/icons';
import { analyzeLiaisons } from '../lib/liaison';

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
  const tokens = analyzeLiaisons(sentence);
  const el = h('p', { class: `fr-sentence ${cls}`.trim(), lang: 'fr' });
  tokens.forEach((t, i) => {
    if (t.liaison) {
      const bare = t.text.slice(0, -1);
      el.append(
        h(
          'span',
          { class: 'lia', title: `Aqui liga: o "${t.liaison.letter}" soa "${t.liaison.sound}"` },
          bare,
          h('span', { class: 'lia__letter' }, t.text.slice(-1)),
          liaisonArc(),
        ),
      );
    } else {
      el.append(t.text);
    }
    if (i < tokens.length - 1) el.append(t.liaison ? h('span', { class: 'lia__gap' }, ' ') : ' ');
  });
  return el;
}

/** Legenda curta que explica as ligações da frase (só se houver). */
export function liaisonNote(sentence: string): HTMLElement | null {
  const links = analyzeLiaisons(sentence)
    .map((t, i, all) => (t.liaison ? { word: t.text.replace(/[,.;:!?…]+$/, ''), next: all[i + 1].text.replace(/[,.;:!?…]+$/, ''), ...t.liaison } : null))
    .filter(Boolean) as { word: string; next: string; sound: string; letter: string }[];
  if (!links.length) return null;
  return h(
    'p',
    { class: 'lia-note', 'data-testid': 'liaison-note' },
    h('span', { class: 'lia-note__mark', 'aria-hidden': 'true' }, '‿'),
    h(
      'span',
      null,
      links
        .map((l) => (l.letter.toLowerCase() === l.sound ? `${l.word}‿${l.next}: o "${l.letter}" volta a soar` : `${l.word}‿${l.next}: o "${l.letter}" soa "${l.sound}"`))
        .join(' · '),
    ),
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
  return h('button', { class: 'btn btn--primary btn--block btn--lg', type: 'button', onclick, 'data-testid': testid }, label);
}

/** "Quando volta" em linguagem de gente, para os botões da revisão. */
export function friendlyWhen(from: Date, to: Date): string {
  const min = (to.getTime() - from.getTime()) / 60_000;
  if (min < 60) return 'já já';
  const days = Math.round(min / 1440);
  if (days < 1) return 'hoje';
  if (days === 1) return 'amanhã';
  if (days < 14) return `em ${days} dias`;
  if (days < 60) return `em ${Math.round(days / 7)} semanas`;
  return `em ${Math.round(days / 30)} meses`;
}

/** Troca o conteúdo de um palco com uma transição curta. */
export function swap(stage: HTMLElement, ...children: Child[]): void {
  stage.replaceChildren();
  const inner = h('div', { class: 'step-in' }, children);
  stage.append(inner);
}
