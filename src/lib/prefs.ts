/** Preferências deste aparelho (localStorage). Progresso fica no IndexedDB. */
export interface Prefs {
  currentUserId: string | null;
  voiceURI: string | null;
  speechRate: number;
  autoplay: boolean;
  /** Dia (yyyy-mm-dd) em que a pessoa pulou os reencontros. */
  skipReencontrosDay: string | null;
  /** Toques curtos de acerto/erro. */
  sounds: boolean;
}

const KEY = 'ie.prefs';
const DEFAULTS: Prefs = { currentUserId: null, voiceURI: null, speechRate: 0.9, autoplay: true, sounds: true, skipReencontrosDay: null };

let cache: Prefs | null = null;

export function prefs(): Prefs {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache!;
}

export function setPrefs(patch: Partial<Prefs>): Prefs {
  cache = { ...prefs(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* sem storage: mantém em memória */
  }
  return cache;
}
