/**
 * Números de 0 a 99 por extenso, no padrão da França (o usado em Luxemburgo):
 * soixante-dix (70), quatre-vingts (80), quatre-vingt-dix (90). Hífens nas
 * dezenas compostas e "et" no 1 (vingt et un), como na grafia tradicional.
 */
const UNITS = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];

export function frenchNumber(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new RangeError('0 a 99');
  if (n < 20) return UNITS[n];
  if (n < 70) {
    const t = Math.floor(n / 10);
    const u = n % 10;
    return u === 0 ? TENS[t] : u === 1 ? `${TENS[t]} et un` : `${TENS[t]}-${UNITS[u]}`;
  }
  if (n < 80) return n === 71 ? 'soixante et onze' : `soixante-${UNITS[n - 60]}`;
  if (n === 80) return 'quatre-vingts';
  return `quatre-vingt-${UNITS[n - 80]}`;
}
