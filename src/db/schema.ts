/**
 * Modelo de dados do app. Os tipos principais seguem a especificação da v1;
 * campos extras (marcados como "extensão") existem para a UI ou para o FSRS.
 */

export type Gender = 'm' | 'f' | 'mpl' | 'fpl';

export interface Word {
  id: string;
  fr: string;
  pt: string;
  /** Transcrição fonética (IPA), sem as barras. */
  ipa: string;
  /** Posição na lista de frequência (1 = mais comum). 1–300 = núcleo; 301+ = complemento. */
  freq_rank: number;
  theme: string;
  cognate_rule_id?: string;
  /** Associação de memória em português — só para palavras NÃO cognatas. */
  memory_hook_pt?: string;
  /**
   * Controle de áudio TTS. A Web Speech API sintetiza no aparelho e não expõe o
   * áudio gerado, então na v1 o campo marca que a palavra já foi sintetizada com
   * sucesso neste dispositivo. Fica pronto para uma v2 que armazene blobs de TTS.
   */
  audio_generated: boolean;
  /** extensão: gênero gramatical (substantivos), usado para exibir o artigo. */
  gender?: Gender;
}

export interface CognateRule {
  id: string;
  pattern: string;
  examples: string[];
  /** extensão */
  explanation: string;
}

/** extensão: alerta de falso cognato. */
export interface FalseCognate {
  id: string;
  word_id: string;
  looks_like: string;
  warning_pt: string;
}

export interface MinimalPair {
  id: string;
  word_a_id: string;
  word_b_id: string;
  /** extensão: contraste sonoro trabalhado, ex. "u francês [y] × u português [u]". */
  feature: string;
}

export interface Frame {
  id: string;
  /** Molde com "___" no lugar do slot, ex. "je veux ___". */
  template: string;
  slot_pool_ids: string[];
  /** extensão: tradução do molde, com o mesmo marcador "___". */
  pt: string;
  /** extensão: observação (ex.: formas femininas). */
  note_pt?: string;
}

export interface Scene {
  id: string;
  name: string;
  word_ids: string[];
  frame_ids: string[];
  /** extensões */
  icon: string;
  description: string;
}

/** extensão: exemplo de regra de leitura — palavra do banco ou expressão avulsa. */
export type ReadingExample = { word_id: string } | { fr: string; ipa: string; pt: string };

/** extensão: regra de pronúncia letra → som. */
export interface ReadingRule {
  id: string;
  grapheme: string;
  sound: string;
  tip_pt: string;
  examples: ReadingExample[];
}

export type ReviewResult = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewState {
  word_id: string;
  user_id: string;
  stability: number;
  difficulty: number;
  /** ISO 8601 (UTC). */
  due_at: string;
  last_result: ReviewResult | null;
  // --- extensões necessárias para o FSRS reconstruir o cartão fielmente ---
  state: number; // ts-fsrs State: 0 New, 1 Learning, 2 Review, 3 Relearning
  reps: number;
  lapses: number;
  scheduled_days: number;
  elapsed_days: number;
  learning_steps: number;
  last_review: string | null;
  created_at: string;
}

/**
 * Histórico de pronúncia: a nota de UMA palavra do banco numa gravação avaliada
 * pelo Azure. Uma frase gravada gera um registro por palavra reconhecida no
 * banco. Serve para acompanhar a evolução ao longo do tempo.
 */
export interface PronunciationRecord {
  /** uuid (permite mesclar exportações de aparelhos diferentes). */
  id: string;
  user_id: string;
  word_id: string;
  /** ISO 8601 (UTC). */
  at: string;
  /** Nota da palavra (0–100, "AccuracyScore" do Azure). */
  score: number;
  /** None | Mispronunciation | Omission | … (do Azure). */
  error_type: string;
  /** Nota por sílaba, com as letras (fr-FR não traz o nome do fonema). */
  syllables: { grapheme: string; accuracy: number }[];
  /** Frase ou palavra gravada e a nota geral de pronúncia dela. */
  text: string;
  overall: number;
}

export interface User {
  id: string;
  name: string;
  household_id?: string;
}

export type ModuleId =
  | 'cognates'
  | 'reading'
  | 'listening'
  | 'builder'
  | 'memory'
  | 'speaking'
  | 'review'
  | 'scenes';

/** extensão: registro de atividade (streak, estatísticas, exportação). */
export interface Activity {
  id: string;
  user_id: string;
  at: string;
  module: ModuleId;
  kind: string;
  correct?: boolean;
  word_id?: string;
  score?: number;
}

export interface SeedData {
  version: number;
  words: Word[];
  cognate_rules: CognateRule[];
  false_cognates: FalseCognate[];
  reading_rules: ReadingRule[];
  minimal_pairs: MinimalPair[];
  frames: Frame[];
  scenes: Scene[];
  users: User[];
}
