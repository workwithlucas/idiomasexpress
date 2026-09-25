import { expect, test, type Browser, type Page } from '@playwright/test';
import { advanceDays, collectErrors, readStore, repsByWord, stubSpeech } from './helpers';

/**
 * (O aviso "Service Worker registration blocked by Playwright" vem do bloqueio
 * de SW abaixo, não do app.)
 *
 * Dois aparelhos = dois contextos de navegador (IndexedDB separados), falando
 * com o mesmo /api/sync (no preview, a loja em memória faz o papel do Netlify Blobs).
 */
test.use({ serviceWorkers: 'block' });

const CODE = `casal-teste-${Date.now()}`;

async function device(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await expect(page.locator('.today')).toBeVisible();
  return page;
}

async function linkCode(page: Page) {
  await page.goto('/#/ajustes');
  await page.getByTestId('sync-code-input').fill(CODE);
  await page.getByTestId('sync-save').click();
  await expect(page.getByTestId('sync-status')).toContainText('Última sincronização');
}

test('A revisa e sincroniza; B recebe o estado com o reps certo; a volta também chega', async ({ browser }) => {
  // --- Aparelho A: primeira revisão da palavra (reps 0 → 1) e sincroniza.
  const a = await device(browser);
  const errorsA = collectErrors(a);
  await a.goto('/#/revisao');
  const word = (await a.locator('.review-card').getAttribute('data-word'))!;
  await expect(a.getByTestId('flash-direction')).toHaveText('O que significa?');
  await a.getByTestId('reveal').click();
  await a.locator('.rate__btn--good').click();
  expect((await repsByWord(a, 'u_lucas'))[word]).toBe(1);
  await linkCode(a);

  // --- Aparelho B, do zero: mesmo código → recebe a palavra com reps 1.
  const b = await device(browser);
  expect((await repsByWord(b, 'u_lucas'))[word]).toBeUndefined();
  await linkCode(b);
  await expect(b.getByTestId('sync-status')).toContainText('palavra');
  const bStates = await repsByWord(b, 'u_lucas');
  expect(bStates[word]).toBe(1);
  // O estado chegou inteiro (não só o reps): mesma data de vencimento que em A.
  const due = async (p: Page) => (await readStore<{ user_id: string; word_id: string; due_at: string }>(p, 'review_states')).find((s) => s.user_id === 'u_lucas' && s.word_id === word)!.due_at;
  expect(await due(b)).toBe(await due(a));

  // No dia seguinte, em B, a palavra vem para PRODUZIR (reps ímpar): a alternância veio junto.
  await advanceDays(b, 1);
  await b.goto('/#/revisao');
  await expect(b.locator('.review-card')).toHaveAttribute('data-word', word);
  await expect(b.getByTestId('flash-direction')).toHaveText('Como se diz em francês?');
  await b.getByTestId('reveal').click();
  await b.locator('.rate__btn--good').click();
  expect((await repsByWord(b, 'u_lucas'))[word]).toBe(2);
  await b.goto('/#/ajustes');
  await b.getByTestId('sync-now').click();
  await expect(b.getByTestId('sync-status')).toContainText('Última sincronização');

  // --- A reabre o app: a sincronização automática da abertura traz o reps 2.
  await a.reload();
  await expect.poll(async () => (await repsByWord(a, 'u_lucas'))[word]).toBe(2);
  expect(await due(a)).toBe(await due(b));

  // --- Offline: o app abre e funciona igual; a sincronização só fica para depois.
  await a.context().setOffline(true);
  await a.reload().catch(() => undefined);
  await a.goto('/#/revisao').catch(() => undefined);
  await a.context().setOffline(false);
  expect(errorsA.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource|blocked by Playwright/.test(e))).toEqual([]);
});

test('sem código, nada é enviado; com a rede fora, o app abre normalmente', async ({ page, context }) => {
  const errors = collectErrors(page);
  let calls = 0;
  await page.route('**/api/sync', (r) => { calls++; return r.continue(); });
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await expect(page.locator('.today')).toBeVisible();
  await page.goto('/#/ajustes');
  await expect(page.getByTestId('sync-code-input')).toBeVisible();
  expect(calls).toBe(0);
  // Código curto: avisa, sem chamar o servidor.
  await page.getByTestId('sync-code-input').fill('curto');
  await page.getByTestId('sync-save').click();
  await expect(page.getByTestId('sync-status')).toContainText('pelo menos 8');
  expect(calls).toBe(0);
  // Com código e sem rede: "Sincronizar agora" explica e nada quebra.
  await page.getByTestId('sync-code-input').fill(CODE + '-offline');
  await context.setOffline(true);
  await page.getByTestId('sync-save').click();
  await expect(page.getByTestId('sync-status')).toContainText('Sem internet');
  await page.goto('/#/revisao');
  await expect(page.locator('.review-card')).toBeVisible();
  await context.setOffline(false);
  expect(errors.filter((e) => !/blocked by Playwright/.test(e))).toEqual([]);
});
