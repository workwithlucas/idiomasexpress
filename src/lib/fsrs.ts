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

/** Aplica uma avaliação e devolve o novo estado (não persiste). */
export function review(rs: ReviewState, result: ReviewResult, at: Date): ReviewState {
  const { card } = scheduler.next(toCard(rs), at, RESULT_TO_RATING[result]);
  return fromCard(card, rs.user_id, rs.word_id, result, rs.created_at);
}

/** Próxima data de cada botão, para mostrar "10 min", "3 d" etc. antes de avaliar. */
export function previewIntervals(rs: ReviewState, at: Date): Record<ReviewResult, Date> {
  const card = toCard(rs);
  const out = {} as Record<ReviewResult, Date>;
  for (const key of Object.keys(RESULT_TO_RATING) as ReviewResult[]) {
    out[key] = scheduler.next(card, at, RESULT_TO_RATING[key]).card.due;
  }
  return out;
}

export function formatInterval(from: Date, to: Date): string {
  const min = Math.max(1, Math.round((to.getTime() - from.getTime()) / 60_000));
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return `${d} d`;
  const m = Math.round(d / 30);
  if (m < 12) return `${m} m`;
  return `${(d / 365).toFixed(1).replace('.0', '')} a`;
}

/** Palavra considerada "consolidada" quando a estabilidade passa de 21 dias. */
export const MATURE_STABILITY_DAYS = 21;
