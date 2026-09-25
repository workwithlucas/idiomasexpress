/**
 * Ícones do design system Poliglotas: 24×24, traço 1.75, pontas e junções
 * arredondadas, sem preenchimento. A cor vem de `currentColor` (primary nos
 * cards, ink na navegação — ver styles).
 *
 * Cópias exatas dos componentes Icons e IconsExtra do sistema. Só ficam aqui
 * os desenhos que o app usa: as três abas (sol, livro aberto, lâmpada), o
 * microfone e os utilitários.
 */
const PATHS: Record<string, string> = {
  // ---- Navegação (componente Icons) -----------------------------------------
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.4.3.6.8.6 1.3V16h5.8v-.8c0-.5.2-1 .6-1.3A6 6 0 0 0 12 3z"/>', // Nav · Como funciona (a mesma de Truques de memória)
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="9" y1="22" x2="15" y2="22"/>', // Gravar (Fale e compare)
  sun: '<circle cx="12" cy="12" r="4.2"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5.3" y1="5.3" x2="7" y2="7"/><line x1="17" y1="17" x2="18.7" y2="18.7"/><line x1="18.7" y1="5.3" x2="17" y2="7"/><line x1="7" y1="17" x2="5.3" y2="18.7"/>', // Nav · Hoje
  book: '<path d="M12 5c-1.8-1.3-4-2-6.5-2S2 3.4 2 3.4v15S3.3 18 5.5 18 10.2 18.7 12 20"/><path d="M12 5c1.8-1.3 4-2 6.5-2S22 3.4 22 3.4v15S20.7 18 18.5 18 13.8 18.7 12 20"/><line x1="12" y1="5" x2="12" y2="20"/>', // Nav · Caderno

  // ---- Utilitários (componente IconsExtra) ------------------------------------
  play: '<path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3z"/><path d="M12 9v4M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
};

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
  svg.innerHTML = PATHS[name] ?? PATHS.info;
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
