import { content, countIntroducedToday, getDiscovered, getDueStates, getNewWords } from '../db/repo';
import { dayKey, now } from './clock';
import { prefs } from './prefs';
import { shuffle } from './text';

/**
 * Sessão diária intercalada (interleaving): tipos de exercício misturados,
 * nunca dois do mesmo tipo seguidos.
 *
 * Composição (16 passos):
 *  - ~metade revisão: primeiro as palavras vencidas, depois palavras novas do dia;
 *  - ~metade conteúdo novo: descobrir padrões de cognatos e de leitura,
 *    completar frases e treinar o ouvido com pares.
 */
export type SessionItemType = 'review' | 'cognate' | 'reading' | 'frame' | 'pair';

export interface SessionItem {
  type: SessionItemType;
  /** id da palavra, regra, frame ou par. */
  ref: string;
}

export interface SessionPlan {
  day: string;
  userId: string;
  items: SessionItem[];
  index: number;
  right: number;
}

export const SESSION_SIZE = 16;
const MAX_LESSONS_PER_KIND = 2; // descobertas são mais longas: no máximo 2 de cada

/**
 * Ordena sem repetir tipo em sequência. Guloso: a cada passo, o tipo com mais
 * itens restantes que não seja o anterior; empates favorecem a revisão (que
 * tem prioridade) e depois sorteio. Dentro de cada tipo, a ordem original
 * é mantida (vencidas antes das novas).
 */
export function interleave(items: SessionItem[], lead: SessionItemType[] = []): SessionItem[] {
  const leads = [...lead];
  const buckets = new Map<SessionItemType, SessionItem[]>();
  for (const it of items) buckets.set(it.type, [...(buckets.get(it.type) ?? []), it]);
  const out: SessionItem[] = [];
  let last: SessionItemType | null = null;
  while (out.length < items.length) {
    const candidates = [...buckets.entries()].filter(([t, list]) => list.length && t !== last);
    if (!candidates.length) {
      // Só sobrou o mesmo tipo: acontece apenas se um tipo passar da metade.
      const rest = [...buckets.values()].flat();
      out.push(...rest);
      break;
    }
    const max = Math.max(...candidates.map(([, l]) => l.length));
    const top = candidates.filter(([, l]) => l.length === max);
    // "lead": na primeira sessão, os primeiros conteúdos seguem uma ordem fixa.
    const leadPick: [SessionItemType, SessionItem[]] | undefined = last === 'review' && leads.length ? candidates.find(([t]) => t === leads[0]) : undefined;
    if (leadPick) leads.shift();
    const pick: [SessionItemType, SessionItem[]] = leadPick ?? top.find(([t]) => t === 'review') ?? top[Math.floor(Math.random() * top.length)];
    out.push(pick[1].shift()!);
    last = pick[0];
  }
  return out;
}

export async function buildPlan(userId: string): Promise<SessionPlan> {
  const c = content();
  const half = SESSION_SIZE / 2;

  // Metade revisão: vencidas (prioridade), completadas com palavras novas do dia.
  const due = (await getDueStates(userId)).sort((a, b) => a.due_at.localeCompare(b.due_at)).slice(0, half);
  const review: SessionItem[] = due.map((s) => ({ type: 'review', ref: s.word_id }));
  if (review.length < half) {
    const allowance = Math.max(0, prefs().newPerDay - (await countIntroducedToday(userId)));
    const fresh = await getNewWords(userId, Math.min(half - review.length, allowance));
    review.push(...fresh.map((w) => ({ type: 'review' as const, ref: w.id })));
  }

  // Outra metade (ou mais, se faltou revisão): conteúdo novo.
  const contentCount = SESSION_SIZE - review.length;
  const discovered = await getDiscovered(userId);
  const nextRules = <T extends { id: string }>(rules: T[]) => {
    const fresh = rules.filter((r) => !discovered.has(r.id));
    return (fresh.length ? fresh : shuffle(rules)).slice(0, MAX_LESSONS_PER_KIND);
  };
  const cognates = nextRules(c.cognateRules);
  const readings = nextRules(c.readingRules);
  const lessons = Math.min(contentCount, cognates.length + readings.length);
  const cog = cognates.slice(0, Math.ceil(lessons / 2));
  const read = readings.slice(0, lessons - cog.length);

  const remaining = contentCount - cog.length - read.length;
  // Moldes: sempre pelo menos um que gera ligação (liaison).
  const liaisonFrames = shuffle(c.frames.filter((f) => f.id.startsWith('f_lia_')));
  const otherFrames = shuffle(c.frames.filter((f) => !f.id.startsWith('f_lia_')));
  const frameCount = Math.ceil(remaining / 2);
  const frames = [liaisonFrames[0], ...shuffle([...liaisonFrames.slice(1), ...otherFrames])].filter(Boolean).slice(0, frameCount);
  const pairs = shuffle(c.minimalPairs).slice(0, remaining - frames.length);

  // Primeira sessão da vida: logo no começo, uma descoberta ("eu mesmo achei")
  // e uma frase para repetir e ver a própria melodia. Depois, tudo sorteado.
  const firstEver = discovered.size === 0;
  const items = interleave([
    ...review,
    ...cog.map((r) => ({ type: 'cognate' as const, ref: r.id })),
    ...read.map((r) => ({ type: 'reading' as const, ref: r.id })),
    ...frames.map((f) => ({ type: 'frame' as const, ref: f.id })),
    ...pairs.map((p) => ({ type: 'pair' as const, ref: p.id })),
  ], firstEver ? ['cognate', 'frame'] : []);
  return { day: dayKey(now()), userId, items, index: 0, right: 0 };
}

// ---- Persistência leve (este aparelho) --------------------------------------

const key = (userId: string) => `ie.session.v1.${userId}`;

export function loadPlan(userId: string): SessionPlan | null {
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) return null;
    const plan = JSON.parse(raw) as SessionPlan;
    if (plan.day !== dayKey(now()) || !Array.isArray(plan.items)) return null;
    return plan;
  } catch {
    return null;
  }
}

export function savePlan(plan: SessionPlan): void {
  try {
    localStorage.setItem(key(plan.userId), JSON.stringify(plan));
  } catch {
    /* sem storage: a sessão vale só enquanto a tela estiver aberta */
  }
}

export function clearPlan(userId: string): void {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    /* ignora */
  }
}

export function planDone(plan: SessionPlan | null): boolean {
  return !!plan && plan.index >= plan.items.length;
}
