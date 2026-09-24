/** Preferências deste aparelho (localStorage). Progresso fica no IndexedDB. */
export interface Prefs {
  currentUserId: string | null;
  voiceURI: string | null;
  speechRate: number;
  newPerDay: number;
  autoplay: boolean;
  /** Toques curtos de acerto/erro. */
  sounds: boolean;
}

const KEY = 'ie.prefs';
const DEFAULTS: Prefs = { currentUserId: null, voiceURI: null, speechRate: 0.9, newPerDay: 10, autoplay: true, sounds: true };

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
