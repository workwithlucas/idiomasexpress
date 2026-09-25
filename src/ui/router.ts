import type { Child } from './dom';

export type TabId = 'hoje' | 'caderno' | 'guia';

export interface ViewContext {
  params: Record<string, string>;
  query: URLSearchParams;
}

export interface ViewResult {
  title: string;
  content: Child;
  /** Rota do botão "voltar" no cabeçalho. */
  back?: string;
  /** Texto do link de voltar (padrão: "Voltar"). */
  backLabel?: string;
  tab?: TabId;
  /** Chamado ao sair da tela (parar áudio, liberar microfone…). */
  cleanup?: () => void;
  /** Esconde cabeçalho/navegação (ex.: seleção de perfil). */
  bare?: boolean;
  /** Tela cheia sem barra de abas: a própria tela desenha o topo (o Momento). */
  full?: boolean;
}

export type View = (ctx: ViewContext) => ViewResult | Promise<ViewResult>;

interface Route {
  pattern: RegExp;
  keys: string[];
  view: View;
}

const routes: Route[] = [];

export function route(path: string, view: View): void {
  const keys: string[] = [];
  const pattern = new RegExp(
    '^' + path.replace(/:([a-z_]+)/gi, (_, k: string) => { keys.push(k); return '([^/]+)'; }) + '/?$',
  );
  routes.push({ pattern, keys, view });
}

export function parseHash(hash = location.hash): { path: string; query: URLSearchParams } {
  const raw = hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path: path || '/', query: new URLSearchParams(qs ?? '') };
}

export function match(path: string): { view: View; params: Record<string, string> } | null {
  for (const r of routes) {
    const m = r.pattern.exec(path);
    if (m) {
      const params: Record<string, string> = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { view: r.view, params };
    }
  }
  return null;
}

export function navigate(path: string): void {
  const target = `#${path}`;
  if (location.hash === target) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = target;
}
