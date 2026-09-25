import { h } from '../ui/dom';
import { icon } from '../ui/icons';
import type { View } from '../ui/router';
import { navigate } from '../ui/router';
import { completedMomentos, content, nextMomento, todaysReencontros } from '../db/repo';
import type { Momento, MomentoProgress } from '../db/schema';
import { currentUser } from '../ui/user';
import { skipReencontrosToday, skippedReencontrosToday, takeJustCompleted } from '../ui/flags';
import { dayKey, now } from '../lib/clock';

/** Cada reencontro leva uns 15 segundos. */
const REENCONTRO_SECONDS = 15;

/**
 * Hoje: o próximo passo, sempre um só. O cartão diz qual é o próximo Momento
 * (com os reencontros do dia antes, se houver); embaixo, a trilha e o que a
 * pessoa já consegue dizer.
 */
export const hojeView: View = async () => {
  const user = currentUser();
  const done = await completedMomentos(user.id);
  const next = nextMomento(done);
  const justDone = takeJustCompleted();
  const skipped = skippedReencontrosToday();
  const reencontros = await todaysReencontros(user.id, skipped);
  const today = dayKey(now());
  const doneToday = [...done.values()].some((p) => dayKey(new Date(p.completed_at)) === today || dayKey(new Date(p.updated_at)) === today);

  return {
    title: 'Hoje',
    tab: 'hoje',
    content: h(
      'div',
      null,
      hero(next, reencontros.length, doneToday && !!next),
      h('h2', { class: 'h3' }, 'Sua trilha'),
      trail(done, next, justDone),
      h('h2', { class: 'h3' }, 'O que você já consegue dizer'),
      canDo(done),
    ),
  };
};

function hero(next: Momento | undefined, reencontros: number, doneToday: boolean): HTMLElement {
  const c = content();
  if (!next && reencontros) {
    // Sem Momento novo por agora, mas com palavras voltando: os reencontros sozinhos.
    return h(
      'section',
      { class: 'card hero', 'data-testid': 'hero' },
      h('p', { class: 'lbl' }, 'Hoje'),
      h('h1', { class: 'h2 m0', 'data-testid': 'hero-title' }, 'Um reencontro rápido'),
      h('p', { class: 'soft mt2' }, 'Algumas palavras dos seus momentos voltam para dizer oi.'),
      h('p', { class: 'meta', 'data-testid': 'hero-meta' }, `Começa com ${reencontros} ${reencontros === 1 ? 'reencontro rápido' : 'reencontros rápidos'}. Uns ${Math.max(1, Math.ceil((reencontros * REENCONTRO_SECONDS) / 60))} minutos.`),
      h('a', { class: 'btn', href: '#/reencontros?hoje=1', 'data-testid': 'start' }, 'Começar'),
      h('button', { class: 'link', type: 'button', 'data-testid': 'skip-reencontros', onclick: () => { skipReencontrosToday(); navigate('/'); } }, 'Pular reencontros hoje'),
    );
  }
  if (!next) {
    const soon = c.chapters.some((ch) => !c.momentos.some((m) => m.chapter_id === ch.id));
    return h(
      'section',
      { class: 'card hero', 'data-testid': 'hero' },
      h('p', { class: 'lbl' }, soon ? 'Seu próximo momento' : 'Trilha completa'),
      h('h1', { class: 'h2 m0' }, soon ? 'Os próximos momentos estão a caminho' : 'Você passou por todos os momentos'),
      h('p', { class: 'soft mt2' }, soon ? 'Eles chegam numa próxima atualização do app. Enquanto isso, refaça um momento pela trilha quando quiser.' : 'Refaça qualquer um pela trilha, quando quiser. As palavras continuam voltando nos reencontros.'),
    );
  }
  const extraMin = Math.ceil((reencontros * REENCONTRO_SECONDS) / 60);
  const meta = reencontros
    ? `Começa com ${reencontros} ${reencontros === 1 ? 'reencontro rápido' : 'reencontros rápidos'}. Uns ${next.minutes + extraMin} minutos.`
    : `${next.minutes} minutos`;
  return h(
    'div',
    null,
    h(
      'section',
      { class: 'card hero', 'data-testid': 'hero', dataset: { momento: next.id } },
      h('p', { class: 'lbl' }, 'Seu próximo momento'),
      h('h1', { class: 'h2 m0', 'data-testid': 'hero-title' }, next.title),
      h('p', { class: 'soft mt2' }, next.intro_pt),
      h('p', { class: 'meta', 'data-testid': 'hero-meta' }, meta),
      h('a', { class: 'btn', href: `#/momento/${next.id}${reencontros ? '?r=1' : ''}`, 'data-testid': 'start' }, 'Começar'),
      reencontros > 0 &&
        h('button', {
          class: 'link', type: 'button', 'data-testid': 'skip-reencontros',
          onclick: () => {
            skipReencontrosToday();
            navigate('/');
          },
        }, 'Pular reencontros hoje'),
    ),
    doneToday && h('p', { class: 'soft', 'data-testid': 'next-ready' }, 'Se quiser, o próximo já está pronto.'),
  );
}

function trail(done: Map<string, MomentoProgress>, next: Momento | undefined, justDone: string | null): HTMLElement {
  const c = content();
  const withMomentos = c.chapters.filter((ch) => c.momentos.some((m) => m.chapter_id === ch.id));
  const later = c.chapters.filter((ch) => !withMomentos.includes(ch));
  const bars: { el: HTMLElement; to: number }[] = [];
  const el = h(
    'div',
    { class: 'trail', 'data-testid': 'trail' },
    withMomentos.map((ch) => {
      const ms = c.momentos.filter((m) => m.chapter_id === ch.id);
      const n = ms.filter((m) => done.has(m.id)).length;
      const pct = Math.round((n / ms.length) * 100);
      const animate = !!justDone && ms.some((m) => m.id === justDone);
      const from = animate ? Math.round(((n - 1) / ms.length) * 100) : pct;
      const fill = h('div', { class: 'bar__fill', style: `width:${from}%` });
      if (animate) bars.push({ el: fill, to: pct });
      return h(
        'section',
        { class: 'chap', dataset: { chapter: ch.id } },
        h('div', { class: 'chap__head' }, h('h3', { class: 'chap__title' }, ch.title), h('span', { class: 'chap__count', 'data-testid': 'chap-count' }, `${n} de ${ms.length}`)),
        h('div', { class: 'bar', role: 'progressbar', 'aria-label': `${ch.title}: ${n} de ${ms.length} momentos`, 'aria-valuemin': '0', 'aria-valuemax': String(ms.length), 'aria-valuenow': String(n) }, fill),
        h('ul', { class: 'mlist' }, ms.map((m) => momentoRow(m, done.has(m.id), m.id === next?.id, m.id === justDone))),
      );
    }),
    later.length > 0 && h('p', { class: 'fine' }, `E mais ${later.length === 1 ? 'um capítulo' : `${later.length} capítulos`} pela frente: ${listPt(later.map((l) => l.title))}.`),
  );
  // A única animação especial: a barra do capítulo preenche depois de concluir.
  if (bars.length) requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach((b) => (b.el.style.width = `${b.to}%`))));
  return el;
}

function momentoRow(m: Momento, isDone: boolean, isNext: boolean, pop: boolean): HTMLElement {
  const marker = h('span', { class: `stat${isDone ? ' stat--done' : isNext ? ' stat--cur' : ''}${pop ? ' stat--pop' : ''}`, 'aria-hidden': 'true' }, isDone && icon('check', 14));
  const label = h('span', { class: 'mt' }, m.title);
  const state = isDone ? 'feito' : isNext ? 'o próximo' : 'mais adiante';
  // Feitos podem ser refeitos; o próximo começa pelo cartão; os seguintes só aparecem.
  if (isDone || isNext) {
    return h('li', null, h('a', { class: 'mrow', href: `#/momento/${m.id}`, dataset: { momento: m.id, state: isDone ? 'done' : 'current' }, 'aria-label': `${m.title}, ${state}` }, marker, label));
  }
  return h('li', null, h('div', { class: 'mrow mrow--later', dataset: { momento: m.id, state: 'later' } }, marker, label, h('span', { class: 'sr-only' }, `, ${state}`)));
}

function canDo(done: Map<string, MomentoProgress>): HTMLElement {
  const list = content().momentos.filter((m) => done.has(m.id));
  if (!list.length) return h('p', { class: 'empty', 'data-testid': 'cando-empty' }, 'Termine seu primeiro momento e ele aparece aqui.');
  return h('ul', { class: 'cando-list', 'data-testid': 'cando' }, list.map((m) => h('li', { class: 'cando' }, icon('check', 18), h('span', null, cap(m.can_do)))));
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const listPt = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} e ${xs[xs.length - 1]}`);
