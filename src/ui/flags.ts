import { dayKey, now } from '../lib/clock';
import { prefs, setPrefs } from '../lib/prefs';

/**
 * Estado curto entre telas: o Momento que acabou de ser concluído (a tela
 * Hoje anima a barra do capítulo uma vez) e o "pular reencontros hoje".
 */
let justCompleted: string | null = null;

export function setJustCompleted(momentoId: string | null): void {
  justCompleted = momentoId;
}

/** Devolve e esquece: a animação acontece uma vez só. */
export function takeJustCompleted(): string | null {
  const id = justCompleted;
  justCompleted = null;
  return id;
}

export function skippedReencontrosToday(): boolean {
  return prefs().skipReencontrosDay === dayKey(now());
}

export function skipReencontrosToday(): void {
  setPrefs({ skipReencontrosDay: dayKey(now()) });
}
