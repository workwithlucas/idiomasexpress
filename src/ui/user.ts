import type { User } from '../db/schema';
import { prefs, setPrefs } from '../lib/prefs';

/** Perfil ativo neste aparelho. */
let current: User | null = null;

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
}

export function restoreUser(users: User[]): void {
  const id = prefs().currentUserId;
  current = users.find((u) => u.id === id) ?? null;
}
