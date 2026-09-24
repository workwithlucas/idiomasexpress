import { h, render } from './dom';
import { brandMark, icon } from './icons';
import { match, navigate, parseHash, type TabId, type ViewResult } from './router';
import { maybeUser, onSessionChange } from './session';
import { getReviewStats } from '../db/repo';
import { stopSpeaking } from '../lib/tts';
import { getClockOffsetDays } from '../lib/clock';

const TABS: { id: TabId; label: string; icon: string; href: string }[] = [
  { id: 'home', label: 'Hoje', icon: 'home', href: '/' },
  { id: 'review', label: 'Revisar', icon: 'review', href: '/revisao' },
  { id: 'learn', label: 'Aprender', icon: 'learn', href: '/aprender' },
  { id: 'settings', label: 'Ajustes', icon: 'settings', href: '/ajustes' },
];

let root: HTMLElement;
let current: ViewResult | null = null;
let renderToken = 0;

export function mountApp(el: HTMLElement): void {
  root = el;
  window.addEventListener('hashchange', () => void renderRoute());
  onSessionChange(() => void refreshBadges());
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

  const found = match(path) ?? match('/');
  let result: ViewResult;
  try {
    result = await found!.view({ params: found!.params, query });
  } catch (e) {
    console.error(e);
    result = {
      title: 'Algo deu errado',
      content: h('div', { class: 'card card--error' }, h('p', null, (e as Error).message), h('a', { class: 'btn', href: '#/' }, 'Voltar ao início')),
    };
  }
  if (token !== renderToken) {
    result.cleanup?.();
    return; // outra navegação começou enquanto esta carregava
  }
  current = result;
  document.title = result.title === 'Hoje' ? 'Idiomas Express' : `${result.title} · Idiomas Express`;

  if (result.bare) {
    render(root, h('main', { class: 'page page--bare', id: 'main' }, result.content));
  } else {
    render(root, header(result), h('main', { class: 'page', id: 'main' }, clockBanner(), result.content), tabbar(result.tab));
  }
  window.scrollTo({ top: 0 });
  void refreshBadges();
}

function header(r: ViewResult): HTMLElement {
  const user = maybeUser();
  return h(
    'header',
    { class: 'topbar' },
    r.back
      ? h('a', { class: 'topbar__back', href: `#${r.back}`, 'aria-label': 'Voltar' }, icon('chevronLeft', 22))
      : h('a', { class: 'topbar__brand', href: '#/', 'aria-label': 'Início' }, brandMark(30)),
    h('h1', { class: 'topbar__title' }, r.title),
    user &&
      h(
        'a',
        { class: 'avatar', href: '#/perfil', title: `Perfil: ${user.name} (trocar)`, 'aria-label': `Perfil ${user.name}, trocar`, dataset: { user: user.id } },
        user.name.charAt(0),
      ),
  );
}

function tabbar(active?: TabId): HTMLElement {
  return h(
    'nav',
    { class: 'tabbar', 'aria-label': 'Navegação principal' },
    TABS.map((t) =>
      h(
        'a',
        { class: 'tabbar__item', href: `#${t.href}`, 'aria-label': t.label, 'aria-current': t.id === active ? 'page' : undefined, dataset: { tab: t.id } },
        h('span', { class: 'tabbar__icon' }, icon(t.icon, 22), t.id === 'review' && h('span', { class: 'badge', hidden: true, 'data-badge': 'review' })),
        h('span', { class: 'tabbar__label' }, t.label),
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

async function refreshBadges(): Promise<void> {
  const user = maybeUser();
  const badge = document.querySelector<HTMLElement>('[data-badge="review"]');
  if (!user || !badge) return;
  const { dueNow } = await getReviewStats(user.id);
  badge.hidden = dueNow === 0;
  badge.textContent = dueNow > 99 ? '99+' : String(dueNow);
}
