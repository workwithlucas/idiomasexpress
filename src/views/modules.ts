import type { ModuleId } from '../db/schema';

export interface ModuleInfo {
  id: ModuleId;
  n: number;
  route: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
}

/** Os 8 módulos, na ordem sugerida de estudo. */
export const MODULES: ModuleInfo[] = [
  { id: 'cognates', n: 1, route: '/cognatos', title: 'Cognatos', subtitle: 'Regras PT → FR e falsos amigos', icon: 'link', accent: 'blue' },
  { id: 'reading', n: 2, route: '/leitura', title: 'Regras de leitura', subtitle: 'Como cada letra soa', icon: 'type', accent: 'violet' },
  { id: 'listening', n: 3, route: '/escuta', title: 'Discriminação sonora', subtitle: 'Treine o ouvido com pares mínimos', icon: 'ear', accent: 'teal' },
  { id: 'builder', n: 4, route: '/frases', title: 'Construtor de frases', subtitle: 'Complete moldes e ouça a frase', icon: 'puzzle', accent: 'amber' },
  { id: 'memory', n: 5, route: '/memoria', title: 'Associação de memória', subtitle: 'Ganchos para palavras não cognatas', icon: 'brain', accent: 'rose' },
  { id: 'speaking', n: 6, route: '/fala', title: 'Repetição falada', subtitle: 'Grave-se e receba nota do Azure', icon: 'mic', accent: 'red' },
  { id: 'review', n: 7, route: '/revisao', title: 'Revisão espaçada', subtitle: 'FSRS: o que revisar hoje', icon: 'review', accent: 'green' },
  { id: 'scenes', n: 8, route: '/situacoes', title: 'Frases por situação', subtitle: 'Creche, banco, entrevista…', icon: 'map', accent: 'indigo' },
];
