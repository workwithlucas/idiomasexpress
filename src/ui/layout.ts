import { h, render } from './dom';
import { brandMark, icon } from './icons';
import { match, navigate, parseHash, type TabId, type ViewResult } from './router';
import { maybeUser } from './user';
import { stopSpeaking } from '../lib/tts';
import { getClockOffsetDays } from '../lib/clock';
import { closeSheet } from './sheet';

/** Três abas, e só. Ajustes abre pelo avatar no topo. */
const TABS: { id: TabId; label: string; icon: string; href: string }[] = [
  { id: 'hoje', label: 'Hoje', icon: 'sun', href: '/' },
  { id: 'caderno', label: 'Caderno', icon: 'book', href: '/caderno' },
  { id: 'guia', label: 'Como funciona', icon: 'bulb', href: '/como-funciona' },
];

let root: HTMLElement;
let current: ViewResult | null = null;
let renderToken = 0;

export function mountApp(el: HTMLElement): void {
  root = el;
  window.addEventListener('hashchange', () => void renderRoute());
  void renderRoute();
}

async function renderRoute(): Promise<void> {
  const token = ++renderToken;
  const { path, query } = parseHash();

  // Sem perfil escolhido, tudo leva à seleção de perfil.
  if (!maybeUser() && path !== '/perfil') {
    navigate('/perfil');
    return;
  }

  current?.cleanup?.();
  stopSpeaking();
  closeSheet();

  const found = match(path) ?? match('/');
  let result: ViewResult;
  try {
    result = await found!.view({ params: found!.params, query });
  } catch (e) {
    console.error(e);
    result = {
      title: 'Algo deu errado',
      back: '/',
      content: h('div', { class: 'card' }, h('p', null, (e as Error).message), h('a', { class: 'btn2', href: '#/' }, 'Voltar para Hoje')),
    };
  }
  if (token !== renderToken) {
    result.cleanup?.();
    return; // outra navegação começou enquanto esta carregava
  }
  current = result;
  document.title = result.title === 'Hoje' ? 'Poliglotas' : `${result.title} · Poliglotas`;
  document.body.classList.toggle('is-full', !!result.full);

  if (result.bare) {
    render(root, h('main', { class: 'page page--bare', id: 'main' }, result.content));
  } else if (result.full) {
    render(root, h('main', { class: 'full', id: 'main' }, result.content));
  } else {
    render(root, h('main', { class: 'page', id: 'main' }, header(result), clockBanner(), result.content), tabbar(result.tab));
  }
  window.scrollTo({ top: 0 });
}

/** Topo: logo e avatar nas abas; seta de voltar nas telas de dentro. */
function header(r: ViewResult): HTMLElement {
  const user = maybeUser();
  if (r.back) {
    return h(
      'header',
      { class: 'top top--back' },
      h('a', { class: 'back', href: `#${r.back}` }, icon('chevronLeft', 20), r.backLabel ?? 'Voltar'),
    );
  }
  return h(
    'header',
    { class: 'top' },
    h('a', { class: 'brand', href: '#/', 'aria-label': 'Poliglotas, início' }, brandMark(30), h('span', null, 'Poliglotas')),
    user &&
      h(
        'a',
        { class: 'avatar', href: '#/ajustes', 'aria-label': `Perfil de ${user.name} e ajustes`, dataset: { user: user.id }, 'data-testid': 'avatar' },
        user.name.charAt(0),
      ),
  );
}

function tabbar(active?: TabId): HTMLElement {
  return h(
    'nav',
    { class: 'tabs', 'aria-label': 'Navegação' },
    h(
      'div',
      { class: 'tabs__in' },
      TABS.map((t) =>
        h(
          'a',
          { class: 'tab', href: `#${t.href}`, 'aria-current': t.id === active ? 'page' : undefined, dataset: { tab: t.id } },
          icon(t.icon, 24),
          h('span', null, t.label),
        ),
      ),
    ),
  );
}

function clockBanner(): HTMLElement | null {
  const offset = getClockOffsetDays();
  if (!offset) return null;
  return h(
    'a',
    { class: 'clock-banner', href: '#/ajustes' },
    icon('clock', 16),
    `Modo de teste: data simulada +${offset} dia${offset > 1 ? 's' : ''}`,
  );
}
