import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type Grade } from 'ts-fsrs';
import type { ReviewResult, ReviewState } from '../db/schema';

/**
 * Agendador FSRS (ts-fsrs). Retenção alvo de 90%, intervalo máximo de 1 ano e
 * passos curtos de aprendizado (1 min, 10 min) para palavras novas/esquecidas.
 */
const scheduler = fsrs(
  generatorParameters({
    request_retention: 0.9,
    maximum_interval: 365,
    enable_fuzz: true,
    enable_short_term: true,
  }),
);

export const RESULT_TO_RATING: Record<ReviewResult, Grade> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export function newReviewState(userId: string, wordId: string, at: Date): ReviewState {
  return fromCard(createEmptyCard(at), userId, wordId, null, at.toISOString());
}

export function toCard(rs: ReviewState): Card {
  return {
    due: new Date(rs.due_at),
    stability: rs.stability,
    difficulty: rs.difficulty,
    elapsed_days: rs.elapsed_days,
    scheduled_days: rs.scheduled_days,
    learning_steps: rs.learning_steps,
    reps: rs.reps,
    lapses: rs.lapses,
    state: rs.state,
    last_review: rs.last_review ? new Date(rs.last_review) : undefined,
  };
}

function fromCard(card: Card, userId: string, wordId: string, result: ReviewResult | null, createdAt: string): ReviewState {
  return {
    word_id: wordId,
    user_id: userId,
    stability: card.stability,
    difficulty: card.difficulty,
    due_at: card.due.toISOString(),
    last_result: result,
    state: card.state,
    reps: card.reps,
    lapses: card.lapses,
    scheduled_days: card.scheduled_days,
    elapsed_days: card.elapsed_days,
    learning_steps: card.learning_steps,
    last_review: card.last_review ? card.last_review.toISOString() : null,
    created_at: createdAt,
  };
}

const finite = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const validDate = (d: unknown): boolean => typeof d === 'string' && !Number.isNaN(Date.parse(d));

/** Confere se um estado salvo (ou importado) tem todos os campos que o FSRS precisa. */
export function isValidReviewState(rs: ReviewState): boolean {
  return (
    !!rs && typeof rs.user_id === 'string' && typeof rs.word_id === 'string' &&
    validDate(rs.due_at) && validDate(rs.created_at) &&
    (rs.last_review === null || validDate(rs.last_review)) &&
    finite(rs.stability) && rs.stability >= 0 && finite(rs.difficulty) &&
    finite(rs.reps) && finite(rs.lapses) && finite(rs.scheduled_days) && finite(rs.elapsed_days) &&
    finite(rs.learning_steps) && [0, 1, 2, 3].includes(rs.state)
  );
}

/** Aplica uma avaliação e devolve o novo estado (não persiste). */
export function review(rs: ReviewState, result: ReviewResult, at: Date): ReviewState {
  const { card } = scheduler.next(toCard(rs), at, RESULT_TO_RATING[result]);
  return fromCard(card, rs.user_id, rs.word_id, result, rs.created_at);
}

export const MATURE_STABILITY_DAYS = 21;
