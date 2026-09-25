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
 * Atravessa o Momento aberto do começo ao fim, do jeito que uma pessoa faria:
 * escuta, acende o que já sabe, deduz a chave (errando uma vez), aplica,
 * monta a frase com `slot`, pula a fala e termina.
 */
export async function completeMomento(page: Page, opts: { slot?: string; record?: boolean } = {}): Promise<void> {
  const next = page.getByTestId('momento-next');
  await expect(page.getByTestId('step-listen')).toBeVisible();
  await next.click();
  await page.getByTestId('reveal-known').click();
  await next.click();
  await expect(page.getByTestId('step-key')).toBeVisible();
  await page.locator('[data-testid=step-key] .opt[data-right="false"]').first().click();
  await page.locator('[data-testid=step-key] > .opts .opt[data-right="true"]').click();
  for (const card of await page.getByTestId('apply').all()) await card.locator('.opt[data-right="true"]').click();
  await next.click();
  await page.locator('.chip').filter({ hasText: opts.slot ?? 'café' }).first().click();
  await next.click();
  await expect(page.getByTestId('step-speak')).toBeVisible();
  if (opts.record) {
    await page.getByTestId('rec-start').click();
    await page.waitForTimeout(2600);
    await page.getByTestId('rec-stop').click();
    await expect(page.getByTestId('prosody-tips')).toBeVisible();
    await next.click();
  } else {
    await page.getByTestId('skip-speak').click();
  }
  await expect(page.getByTestId('step-take')).toBeVisible();
  await next.click();
  await expect(page.getByTestId('hero')).toBeVisible();
}

/** Faz os reencontros que estiverem na tela (Lembrei em todos). Devolve as direções. */
export async function doReencontros(page: Page): Promise<{ word?: string; direction?: string; kind?: string }[]> {
  const seen: { word?: string; direction?: string; kind?: string }[] = [];
  await page.getByTestId('reencontro').waitFor({ timeout: 5000 }).catch(() => undefined);
  for (let i = 0; i < 12; i++) {
    const card = page.getByTestId('reencontro');
    if (!(await card.isVisible().catch(() => false))) break;
    await page.getByTestId('reencontro-show').click();
    const kind = (await card.getAttribute('data-kind')) ?? 'word';
    const word = (await card.getAttribute('data-word')) ?? undefined;
    const direction = (await card.getAttribute('data-direction')) ?? undefined;
    seen.push({ word, direction, kind });
    const before = word ?? kind;
    if (kind === 'phrase') await page.getByTestId('reencontro-done').click();
    else await page.getByTestId('reencontro-good').click();
    await expect.poll(async () => {
      const c = page.getByTestId('reencontro');
      if (!(await c.isVisible().catch(() => false))) return 'fim';
      // O cartão pode sair da tela entre as duas leituras: nunca espera por ele.
      const attr = (name: string) => c.getAttribute(name, { timeout: 300 }).catch(() => null);
      return (await attr('data-word')) ?? (await attr('data-kind')) ?? 'fim';
    }, { message: `reencontro ${i + 1} (${before}) não avançou; vistos: ${JSON.stringify(seen)}` }).not.toBe(before);
  }
  return seen;
}

/** Avança a data do app (Ajustes → Para testar). */
export async function advanceDays(page: Page, days: number) {
  await page.goto('/#/ajustes');
  for (let i = 0; i < days; i++) await page.getByTestId('clock-plus-1').click();
}
