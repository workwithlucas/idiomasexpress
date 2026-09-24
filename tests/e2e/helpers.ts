import { expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __spoken: { text: string; voice: string | null; pitch: number }[];
  }
}

/**
 * Substitui a síntese de voz (o Chromium de teste não tem vozes) por um stub
 * que registra cada fala. Com `voices`, simula vozes instaladas.
 */
export async function stubSpeech(page: Page, voices: { name: string; lang: string }[] = []) {
  await page.addInitScript((voices) => {
    window.__spoken = [];
    const list = voices.map((v) => ({ ...v, voiceURI: v.name, localService: true, default: false }));
    speechSynthesis.getVoices = () => list as unknown as SpeechSynthesisVoice[];
    window.SpeechSynthesisUtterance = class {
      text: string;
      voice: { name: string } | null = null;
      lang = '';
      rate = 1;
      pitch = 1;
      onend?: () => void;
      onstart?: () => void;
      onboundary?: () => void;
      onerror?: () => void;
      constructor(t: string) {
        this.text = t;
      }
    } as unknown as typeof SpeechSynthesisUtterance;
    speechSynthesis.speak = (u) => {
      const x = u as unknown as { text: string; voice: { name: string } | null; pitch: number; onend?: () => void };
      window.__spoken.push({ text: x.text, voice: x.voice?.name ?? null, pitch: x.pitch });
      setTimeout(() => x.onend?.(), 15);
    };
    speechSynthesis.cancel = () => {};
  }, voices);
}

export const spoken = (page: Page) => page.evaluate(() => window.__spoken);

export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(`[${m.type()}] ${m.text()}`));
  return errors;
}

/** Lê o IndexedDB do app. */
export function readStore<T>(page: Page, store: string): Promise<T[]> {
  return page.evaluate(
    (store) =>
      new Promise<T[]>((resolve) => {
        const req = indexedDB.open('idiomasexpress');
        req.onsuccess = () => {
          const all = req.result.transaction(store).objectStore(store).getAll();
          all.onsuccess = () => {
            req.result.close();
            resolve(all.result as T[]);
          };
        };
      }),
    store,
  );
}

export async function repsByWord(page: Page, userId: string): Promise<Record<string, number>> {
  const states = await readStore<{ user_id: string; word_id: string; reps: number }>(page, 'review_states');
  return Object.fromEntries(states.filter((s) => s.user_id === userId).map((s) => [s.word_id, s.reps]));
}

/**
 * Responde o passo atual da sessão, seja qual for o tipo. Devolve o tipo.
 * Responde de propósito a pior opção às vezes? Não: aqui sempre acerta ou
 * pede ajuda ("Não sei") — o objetivo é atravessar o fluxo.
 */
export async function answerCurrentStep(page: Page): Promise<void> {
  const v = (sel: string) => page.locator(sel).first().isVisible().catch(() => false);
  // A tela troca com animação: um clique pode mirar um elemento que acabou de
  // sair. Cliques curtos e tolerantes; o laço tenta de novo com a tela nova.
  const tap = (sel: string, which: 'first' | 'last' = 'first') => page.locator(sel)[which]().click({ timeout: 1500 }).catch(() => undefined);
  const progress = () => page.locator('.session-top .progress__bar').getAttribute('style', { timeout: 1500 }).catch(() => null);
  const start = await progress();
  for (let guard = 0; guard < 40; guard++) {
    if (await v('[data-testid=session-done]')) return;
    if ((await progress()) !== start) return;
    if (await v('[data-testid=reveal]')) await tap('[data-testid=reveal]');
    else if (await v('.rate__btn')) await tap('.rate__btn--good');
    else if ((await v('.tile')) && !(await v('[data-testid=feedback]'))) await tap('.tile', 'last');
    else if ((await v('[data-testid=apply-input]')) && (await page.getByTestId('apply-input').isEnabled().catch(() => false))) await tap('[data-testid=dont-know]');
    else if ((await v('.choice:not([disabled])')) && !(await v('[data-testid=feedback]'))) await tap('.choice[data-right="true"]');
    else if (await v('.slot-option')) await tap('.slot-option');
    else if (await v('.option:not([disabled])')) await tap('.option');
    else await tap('[data-testid=continue], [data-testid=next-frame], [data-testid=next-round]', 'last');
    await page.waitForTimeout(100);
  }
  throw new Error('Passo da sessão não avançou');
}

/** Completa a sessão diária inteira; devolve a sequência de tipos. */
export async function completeSession(page: Page): Promise<string[]> {
  const types: string[] = [];
  for (let i = 0; i < 40; i++) {
    await expect(page.locator('.session-stage').or(page.getByTestId('session-done')).first()).toBeVisible();
    if (await page.getByTestId('session-done').isVisible()) break;
    types.push((await page.locator('.session-stage').getAttribute('data-type')) ?? '?');
    const before = await page.locator('.session-top .progress__bar').getAttribute('style');
    await answerCurrentStep(page);
    await expect.poll(async () => (await page.getByTestId('session-done').isVisible()) || (await page.locator('.session-top .progress__bar').getAttribute('style')) !== before).toBe(true);
  }
  await expect(page.getByTestId('session-done')).toBeVisible();
  return types;
}

/** Avança a data do app (Ajustes → Para testar). */
export async function advanceDays(page: Page, days: number) {
  await page.goto('/#/ajustes');
  for (let i = 0; i < days; i++) await page.getByTestId('clock-plus-1').click();
}
