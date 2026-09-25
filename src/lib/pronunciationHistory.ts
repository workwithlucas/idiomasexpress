import type { PronunciationRecord, Word } from '../db/schema';
import type { PronunciationResult } from '../../server/pronunciation';

type Scored = Pick<PronunciationRecord, 'word_id' | 'score' | 'error_type' | 'syllables'>;

/** "Café." → "café"; "J’habite" → "j'habite" (acentos são mantidos: la ≠ là). */
const key = (s: string) => s.normalize('NFC').toLowerCase().replace(/[’`]/g, "'").replace(/^[^\p{L}']+|[^\p{L}']+$/gu, '');

/**
 * Liga as palavras avaliadas pelo Azure às palavras do banco.
 * - Gravou uma palavra do banco (targetWordId): um registro para ela, com a
 *   nota geral (serve também para expressões como "s'il vous plaît").
 * - Gravou uma frase: um registro por palavra da frase que existe no banco.
 */
export function scoredWords(result: PronunciationResult, words: Word[], targetWordId?: string): Scored[] {
  const syllablesOf = (ws: PronunciationResult['words']) => ws.flatMap((w) => w.syllables ?? []).map(({ grapheme, accuracy }) => ({ grapheme, accuracy }));
  if (targetWordId) {
    const single = result.words.length === 1 ? result.words[0] : null;
    return [{
      word_id: targetWordId,
      score: single ? single.accuracy : result.pronunciation,
      error_type: single ? single.errorType : result.words.find((w) => w.errorType !== 'None')?.errorType ?? 'None',
      syllables: syllablesOf(result.words),
    }];
  }
  const byFr = new Map<string, string>();
  for (const w of words) if (!byFr.has(key(w.fr))) byFr.set(key(w.fr), w.id);
  return result.words.flatMap((w) => {
    const id = byFr.get(key(w.word));
    return id ? [{ word_id: id, score: w.accuracy, error_type: w.errorType, syllables: syllablesOf([w]) }] : [];
  });
}
