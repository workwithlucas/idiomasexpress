/**
 * Liaison: a consoante final (normalmente muda) volta a soar quando a palavra
 * seguinte começa com vogal ou "h" mudo — petit = "peti", mas petit_ami.
 * Só existe dentro da frase, por isso é detectada no texto já montado.
 *
 * Usamos uma lista fechada de palavras que fazem ligação obrigatória (ou
 * praticamente sempre feita na fala), em vez de tentar todas as opcionais.
 */

/** Palavra → som que a consoante final assume na ligação. */
const LIAISON: Record<string, string> = {
  // determinantes
  les: 'z', des: 'z', ces: 'z', mes: 'z', tes: 'z', ses: 'z', nos: 'z', vos: 'z', leurs: 'z', aux: 'z',
  quels: 'z', quelles: 'z', un: 'n', aucun: 'n', mon: 'n', ton: 'n', son: 'n',
  // pronomes
  nous: 'z', vous: 'z', ils: 'z', elles: 'z', on: 'n', en: 'n',
  // números
  deux: 'z', trois: 'z', six: 'z', dix: 'z', vingt: 't', cent: 't',
  // adjetivos antes do substantivo
  petit: 't', grand: 't', gros: 'z', bon: 'n', premier: 'r', dernier: 'r',
  // palavras curtas invariáveis
  très: 'z', plus: 'z', dans: 'z', chez: 'z', sans: 'z', sous: 'z', tout: 't', quand: 't', bien: 'n',
  // verbo "être" (c'est_un, il est_à)
  est: 't',
};

/** Palavras com vogal/h no início que NÃO aceitam ligação (h aspirado etc.). */
const BLOCKERS = new Set(['oui', 'onze', 'huit', 'haut', 'haute', 'hors', 'hasard', 'héros', 'hibou', 'hollande', 'honte', 'hall']);

const VOWEL_START = /^[aeiouyàâäéèêëîïôöùûüœæh]/i;

export interface SentenceToken {
  /** Texto da palavra como aparece (com pontuação grudada). */
  text: string;
  /** Presente quando esta palavra liga com a seguinte. */
  liaison?: { sound: string; letter: string };
}

function core(word: string): string {
  // "c'est" → "est", "l'homme" → "homme"; tira pontuação das bordas.
  const w = word.toLowerCase().replace(/^[«"(¿¡]+|[»"),.;:!?…]+$/g, '');
  const parts = w.split(/['’]/);
  return parts[parts.length - 1];
}

/** Som da ligação entre duas palavras vizinhas (ou null, se não liga). */
export function liaisonBetween(text: string, next: string | undefined): { sound: string; letter: string } | null {
  if (!next || /[,.;:!?…]$/.test(text)) return null;
  // Expressões de várias palavras ("s'il vous plaît"): vale a última e a primeira.
  const last = text.trim().split(/\s+/).pop() ?? text;
  const first = next.trim().split(/\s+/)[0] ?? next;
  const sound = LIAISON[core(last)];
  const nextCore = core(first);
  if (!sound || !VOWEL_START.test(nextCore) || BLOCKERS.has(nextCore)) return null;
  const bare = last.replace(/[,.;:!?…]+$/, '');
  return { sound, letter: bare.charAt(bare.length - 1) };
}

export function analyzeLiaisons(sentence: string): SentenceToken[] {
  const words = sentence.trim().split(/\s+/).filter(Boolean);
  return words.map((text, i) => {
    const liaison = liaisonBetween(text, words[i + 1]);
    return liaison ? { text, liaison } : { text };
  });
}

