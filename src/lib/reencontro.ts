import type { ReviewState } from '../db/schema';

export type Direction = 'recognize' | 'produce';

/**
 * Direção do reencontro, determinística pelo número de revisões já feitas:
 * par → reconhecer (francês → português); ímpar → produzir (português → francês).
 */
export function directionFor(state: Pick<ReviewState, 'reps'> | undefined): Direction {
  return (state?.reps ?? 0) % 2 === 0 ? 'recognize' : 'produce';
}
