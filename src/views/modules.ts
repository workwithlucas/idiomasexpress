import type { ModuleId } from '../db/schema';

export interface ModuleInfo {
  id: ModuleId;
  route: string;
  title: string;
  subtitle: string;
  icon: string;
}

/** Os 8 módulos, para quem quiser praticar um só. */
export const MODULES: ModuleInfo[] = [
  { id: 'cognates', route: '/cognatos', title: 'Palavras-irmãs', subtitle: 'Descubra os padrões PT → FR', icon: 'siblings' },
  { id: 'reading', route: '/leitura', title: 'Como se lê', subtitle: 'Letras e seus sons', icon: 'soundbars' },
  { id: 'listening', route: '/escuta', title: 'Ouvido fino', subtitle: 'Sons parecidos, vozes diferentes', icon: 'headphones' },
  { id: 'builder', route: '/frases', title: 'Monte a frase', subtitle: 'Complete e ouça', icon: 'blocks' },
  { id: 'memory', route: '/memoria', title: 'Truques de memória', subtitle: 'Para as palavras difíceis', icon: 'bulb' },
  { id: 'speaking', route: '/fala', title: 'Fale e compare', subtitle: 'Sua voz × a do nativo', icon: 'mic' },
  { id: 'review', route: '/revisao', title: 'Revisar', subtitle: 'O que está pra vencer', icon: 'cycle' },
  { id: 'scenes', route: '/situacoes', title: 'Situações reais', subtitle: 'Creche, banco, médico…', icon: 'pin' },
];
