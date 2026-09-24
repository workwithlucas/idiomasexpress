/**
 * Ícones do design system Poliglotas: 24×24, traço 1.75, pontas e junções
 * arredondadas, sem preenchimento. A cor vem de `currentColor` (primary nos
 * cards, ink na navegação — ver styles).
 *
 * Os 12 primeiros (8 módulos + 4 abas) são cópias exatas do componente Icons
 * do sistema. Os utilitários seguem a regra do sistema para ícones novos:
 * mesma grade, mesmo peso de traço, sem fundo.
 */
const PATHS: Record<string, string> = {
  // ---- Módulos (componente Icons) -------------------------------------------
  siblings: '<circle cx="8" cy="12" r="4.5"/><circle cx="16" cy="12" r="4.5"/>', // Palavras-irmãs: dois elos conectados
  soundbars: '<line x1="4" y1="10" x2="4" y2="14"/><line x1="9" y1="6" x2="9" y2="18"/><line x1="14" y1="3" x2="14" y2="21"/><line x1="19" y1="8" x2="19" y2="16"/>', // Como se lê
  headphones: '<path d="M5 12a7 7 0 0 1 14 0"/><rect x="4" y="12" width="4" height="6" rx="1.5"/><rect x="16" y="12" width="4" height="6" rx="1.5"/>', // Ouvido fino
  blocks: '<rect x="3" y="9" width="6" height="6" rx="1.5"/><rect x="10.5" y="9" width="6" height="6" rx="1.5"/><rect x="18" y="9" width="3" height="6" rx="1.2" stroke-dasharray="2 2"/>', // Monte a frase
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.6.8.6 1.3V16h5.8v-.8c0-.5.2-1 .6-1.3A6 6 0 0 0 12 3z"/>', // Truques de memória
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/>', // Fale e compare
  cycle: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><polyline points="20 3 20 7.5 15.5 7.5"/>', // Revisar (módulo e aba)
  pin: '<path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.3"/>', // Situações reais
  // ---- Navegação (componente Icons) -----------------------------------------
  sun: '<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5.3" y1="5.3" x2="7" y2="7"/><line x1="17" y1="17" x2="18.7" y2="18.7"/><line x1="18.7" y1="5.3" x2="17" y2="7"/><line x1="7" y1="17" x2="5.3" y2="18.7"/>', // Nav · Hoje
  book: '<path d="M12 5c-1.8-1.3-4-2-6.5-2S2 3.4 2 3.4v15S3.3 18 5.5 18 10.2 18.7 12 20"/><path d="M12 5c1.8-1.3 4-2 6.5-2S22 3.4 22 3.4v15S20.7 18 18.5 18 13.8 18.7 12 20"/><line x1="12" y1="5" x2="12" y2="20"/>', // Nav · Aprender
  sliders: '<line x1="4" y1="6" x2="20" y2="6"/><circle cx="9" cy="6" r="2"/><line x1="4" y1="12" x2="20" y2="12"/><circle cx="16" cy="12" r="2"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="11" cy="18" r="2"/>', // Nav · Ajustes

  // ---- Situações (ícones novos, regra do sistema) ----------------------------
  cup: '<path d="M4 9h13v4a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3.5v2.5M12 3.5v2.5"/>',
  baby: '<path d="M9 12h.01M15 12h.01"/><path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5"/><path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1"/>',
  bank: '<path d="M3 21h18"/><path d="M5 21V10M19 21V10M9.5 21V10M14.5 21V10"/><path d="m2 10 10-6 10 6z"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>',
  health: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/><path d="M12 9v6M9 12h6"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2 2h3l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/>',
  building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',

  // ---- Utilitários (ícones novos, regra do sistema) --------------------------
  play: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronDown: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  arrowRight: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  sparkles: '<path d="M12 3l1.9 5.8L20 10.7l-6.1 1.9L12 18.5l-1.9-5.9L4 10.7l6.1-1.9z"/><path d="M19 3v4M17 5h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  shuffle: '<path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/>',
};

/** Nomes antigos usados no conteúdo (seed) ou no código → ícone do sistema. */
const ALIASES: Record<string, string> = {
  review: 'cycle', // Revisar
  link: 'siblings', // falso amigo / cognato
  map: 'pin',
  ear: 'headphones',
};

export type IconName = keyof typeof PATHS;

export function icon(name: string, size = 20): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('icon');
  svg.innerHTML = PATHS[ALIASES[name] ?? name] ?? PATHS.info;
  return svg;
}

/**
 * Logomark Poliglotas (componente Logomark): o "P" geométrico em primary e o
 * traço de cedilha em accent. viewBox e caminhos copiados do sistema.
 */
export function brandMark(height = 28): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 96 130');
  svg.setAttribute('height', String(height));
  svg.setAttribute('width', String(Math.round((height * 96) / 130)));
  svg.setAttribute('aria-hidden', 'true');
  svg.classList.add('logomark');
  svg.innerHTML =
    '<rect x="0" y="0" width="30" height="130" rx="15" class="logomark__p"/>' +
    '<path d="M15 0 H62 C83 0 94 15 94 34 C94 55 79 68 58 68 H15 V38 H54 C63 38 68 33 68 26 C68 18 62 13 53 13 H15 Z" class="logomark__p"/>' +
    '<path d="M6 108 C6 100 12 96 20 96 C16 104 16 112 22 118" class="logomark__cedilla"/>';
  return svg;
}
