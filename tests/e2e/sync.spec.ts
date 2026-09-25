import { expect, test, type Browser, type Page } from '@playwright/test';
import { advanceDays, collectErrors, completeMomento, doReencontros, readStore, repsByWord, stubSpeech } from './helpers';

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
  await expect(page.getByTestId('hero')).toBeVisible();
  return page;
}

async function linkCode(page: Page) {
  await page.goto('/#/ajustes');
  await page.getByTestId('sync-code-input').fill(CODE);
  await page.getByTestId('sync-save').click();
  await expect(page.getByTestId('sync-status')).toContainText('Última sincronização');
}

type Progress = { user_id: string; momento_id: string; completed_at: string; built_phrase: string };

test('A conclui o Momento 1 e sincroniza; B recebe o Momento, a frase e as palavras; a volta também chega', async ({ browser }) => {
  // --- Aparelho A: conclui o Momento 1 com "thé" e sincroniza.
  const a = await device(browser);
  const errorsA = collectErrors(a);
  await a.getByTestId('start').click();
  await completeMomento(a, { slot: 'thé' });
  await linkCode(a);
  const progressA = (await readStore<Progress>(a, 'momento_progress'))[0];
  expect(progressA.built_phrase).toBe("Un thé, s'il vous plaît.");

  // --- Aparelho B, do zero: mesmo código → Momento concluído, frase e palavras.
  const b = await device(browser);
  await expect(b.getByTestId('hero-title')).toHaveText('Um café, por favor');
  await linkCode(b);
  expect(await readStore<Progress>(b, 'momento_progress')).toEqual([progressA]);
  await b.goto('/#/');
  await expect(b.getByTestId('cando')).toHaveText('Pedir algo num café');
  await b.goto('/#/caderno');
  await expect(b.getByTestId('phrases')).toContainText("Un thé, s'il vous plaît.");
  expect(Object.keys(await repsByWord(b, 'u_lucas')).sort()).toEqual(Object.keys(await repsByWord(a, 'u_lucas')).sort());

  // --- B refaz o Momento mais tarde com outra frase: a frase nova vale, a 1ª data fica.
  await advanceDays(b, 1);
  await b.goto('/#/momento/m01');
  await completeMomento(b, { slot: 'croissant' });
  await b.goto('/#/ajustes');
  await b.getByTestId('sync-now').click();
  await expect(b.getByTestId('sync-status')).toContainText('Última sincronização');

  // --- A reabre: a sincronização automática traz a frase nova, sem perder a conclusão.
  await a.reload();
  await expect.poll(async () => (await readStore<Progress>(a, 'momento_progress'))[0]?.built_phrase).toBe("Un croissant, s'il vous plaît.");
  expect((await readStore<Progress>(a, 'momento_progress'))[0].completed_at).toBe(progressA.completed_at);

  // --- Reencontros em B (reps 0 → 1) chegam em A com o reps certo.
  await b.goto('/#/reencontros?hoje=1');
  const done = (await doReencontros(b)).filter((r) => r.kind === 'word');
  expect(done.length).toBeGreaterThan(0);
  await b.goto('/#/ajustes');
  await b.getByTestId('sync-now').click();
  await expect(b.getByTestId('sync-status')).toContainText('Última sincronização');
  await a.reload();
  await expect.poll(async () => (await repsByWord(a, 'u_lucas'))[done[0].word!]).toBe(1);

  expect(errorsA.filter((e) => !/ERR_INTERNET_DISCONNECTED|Failed to load resource|blocked by Playwright/.test(e))).toEqual([]);
});

test('sem código, nada é enviado; com a rede fora, o app abre normalmente', async ({ page, context }) => {
  const errors = collectErrors(page);
  let calls = 0;
  await page.route('**/api/sync', (r) => { calls++; return r.continue(); });
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await expect(page.getByTestId('hero')).toBeVisible();
  await page.goto('/#/ajustes');
  await expect(page.getByTestId('sync-code-input')).toBeVisible();
  expect(calls).toBe(0);
  // Código curto: avisa, sem chamar o servidor.
  await page.getByTestId('sync-code-input').fill('curto');
  await page.getByTestId('sync-save').click();
  await expect(page.getByTestId('sync-status')).toContainText('pelo menos 8');
  expect(calls).toBe(0);
  // Com código e sem rede: explica e nada quebra.
  await page.getByTestId('sync-code-input').fill(CODE + '-offline');
  await context.setOffline(true);
  await page.getByTestId('sync-save').click();
  await expect(page.getByTestId('sync-status')).toContainText('Sem internet');
  await page.goto('/#/momento/m01');
  await expect(page.getByTestId('step-listen')).toBeVisible();
  await context.setOffline(false);
  expect(errors.filter((e) => !/blocked by Playwright/.test(e))).toEqual([]);
});
