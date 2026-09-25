import type { Frame, Momento, Word } from '../db/schema';
import { fillFrame, primaryPt } from './text';

/**
 * Regras puras do Momento (sem banco, sem tela): o que conta como ponte, os
 * números mostrados ("14 de 17") e quais palavras entram nos reencontros.
 */

/** Palavra que "já mora no seu português": tem ponte ou segue uma regra de cognato. */
export function hasBridge(w: Word | undefined): boolean {
  return !!w && (!!w.bridge || !!w.cognate_rule_id);
}

/** Palavras distintas do diálogo, na ordem em que aparecem. */
export function dialogueWordIds(m: Momento): string[] {
  return [...new Set(m.lines.flatMap((l) => l.word_ids))];
}

export interface MomentoStats {
  /** Palavras distintas do diálogo. */
  total: number;
  /** Quantas delas têm ponte com o português. */
  known: number;
  knownIds: Set<string>;
}

export function momentoStats(m: Momento, wordById: Map<string, Word>): MomentoStats {
  const ids = dialogueWordIds(m);
  const knownIds = new Set(ids.filter((id) => hasBridge(wordById.get(id))));
  return { total: ids.length, known: knownIds.size, knownIds };
}

/**
 * Palavras do Momento que entram nos reencontros: as novas e as de ponte,
 * menos as de ponte "igual" (café, normal), que não precisam voltar. A palavra
 * escolhida no molde entra junto, com o mesmo critério.
 */
export function reviewWordIds(m: Momento, wordById: Map<string, Word>, extra: (string | undefined)[] = []): string[] {
  return [...new Set([...dialogueWordIds(m), ...extra.filter((x): x is string => !!x)])].filter((id) => {
    const w = wordById.get(id);
    return !!w && w.bridge?.kind !== 'igual';
  });
}

export interface Phrase {
  fr: string;
  pt: string;
  wordId?: string;
}

/** A frase do molde com a palavra escolhida. */
export function buildPhrase(frame: Frame, word: Word): Phrase {
  return { fr: fillFrame(frame.template, word.fr), pt: fillFrame(frame.pt, primaryPt(word)), wordId: word.id };
}

/** Reconstrói a frase guardada (texto em francês) com a tradução, pelo molde. */
export function phraseFromBuilt(frame: Frame | undefined, built: string, wordById: Map<string, Word>): Phrase {
  if (frame) {
    for (const id of frame.slot_pool_ids) {
      const w = wordById.get(id);
      if (w && buildPhrase(frame, w).fr === built) return buildPhrase(frame, w);
    }
  }
  return { fr: built, pt: '' };
}

/** Primeira aparição de cada palavra na trilha: o "Momento de origem". */
export function wordOrigins(momentos: Momento[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const m of momentos) for (const id of dialogueWordIds(m)) if (!out.has(id)) out.set(id, m.id);
  return out;
}

/**
 * Mistura os reencontros para que palavras seguidas venham de Momentos
 * diferentes (rodízio por origem, mantendo a ordem de vencimento dentro de cada um).
 */
export function mixByOrigin<T>(items: T[], originOf: (x: T) => string | undefined): T[] {
  const groups = new Map<string, T[]>();
  for (const it of items) {
    const k = originOf(it) ?? '';
    groups.set(k, [...(groups.get(k) ?? []), it]);
  }
  const out: T[] = [];
  const lists = [...groups.values()];
  while (out.length < items.length) for (const l of lists) if (l.length) out.push(l.shift()!);
  return out;
}
