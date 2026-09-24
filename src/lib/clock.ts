/**
 * Relógio do app. Em uso normal é o relógio do sistema; a tela de Ajustes
 * permite "avançar dias" para testar a revisão espaçada (o deslocamento fica
 * salvo neste dispositivo e aparece como um aviso enquanto estiver ativo).
 */
const KEY = 'ie.clockOffsetDays';
const DAY_MS = 86_400_000;

function readOffset(): number {
  try {
    const v = Number(localStorage.getItem(KEY) ?? 0);
    return Number.isFinite(v) ? v : 0;
  } catch {
    return 0;
  }
}

let offsetDays = readOffset();

export function now(): Date {
  return new Date(Date.now() + offsetDays * DAY_MS);
}

export function getClockOffsetDays(): number {
  return offsetDays;
}

export function setClockOffsetDays(days: number): void {
  offsetDays = days;
  try {
    if (days === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(days));
  } catch {
    /* modo privado: mantém só em memória */
  }
}

/** Chave yyyy-mm-dd no fuso local (para "hoje", streak etc.). */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
