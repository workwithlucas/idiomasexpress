import type { User } from '../db/schema';
import { prefs, setPrefs } from '../lib/prefs';

/** Perfil ativo neste aparelho. */
let current: User | null = null;
const listeners = new Set<() => void>();

export function currentUser(): User {
  if (!current) throw new Error('Nenhum perfil selecionado');
  return current;
}

export function maybeUser(): User | null {
  return current;
}

export function setCurrentUser(user: User | null): void {
  current = user;
  setPrefs({ currentUserId: user?.id ?? null });
  listeners.forEach((fn) => fn());
}

export function restoreUser(users: User[]): void {
  const id = prefs().currentUserId;
  current = users.find((u) => u.id === id) ?? null;
}

/** Avisa o layout para recalcular contadores (ex.: badge de revisões). */
export function notifyProgressChanged(): void {
  listeners.forEach((fn) => fn());
}

export function onSessionChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
