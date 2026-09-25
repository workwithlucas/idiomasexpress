import { expect, test } from '@playwright/test';
import { advanceDays, collectErrors, completeSession, readStore, repsByWord, spoken, stubSpeech } from './helpers';

/**
 * Fluxo completo:
 * primeira abertura → seed → perfil → sessão diária inteira (intercalada) →
 * reps persiste ao reabrir → cada módulo → dia seguinte começa pelas vencidas.
 */

const TWO_FRENCH_VOICES = [
  { name: 'Amélie', lang: 'fr-FR' },
  { name: 'Thomas', lang: 'fr-FR' },
  { name: 'Samantha', lang: 'en-US' },
];

test('do zero: sessão diária completa, sem erros, e reps persiste', async ({ page, context }) => {
  await stubSpeech(page, TWO_FRENCH_VOICES);
  const errors = collectErrors(page);

  // 1. Primeira abertura: seed no IndexedDB e escolha de perfil.
  await page.goto('/');
  await expect(page.locator('.profile-card')).toHaveCount(2);
  expect((await readStore(page, 'words')).length).toBeGreaterThanOrEqual(800);
  await page.click('[data-user="u_lucas"]');

  // 2. A sessão diária é a entrada.
  await expect(page.getByTestId('session-start')).toHaveText(/Começar/);
  await page.getByTestId('session-start').click();

  // 3. Sessão inteira: 16 passos, tipos misturados, nunca dois iguais seguidos.
  const types = await completeSession(page);
  expect(types).toHaveLength(16);
  for (let i = 1; i < types.length; i++) expect(types[i], `passo ${i}: ${types.join(' ')}`).not.toBe(types[i - 1]);
  for (const t of ['review', 'cognate', 'reading', 'frame', 'pair']) expect(types).toContain(t);
  expect(types.filter((t) => t === 'review').length).toBe(8); // metade revisão

  // 4. reps persiste entre "fechar e abrir".
  const reps = await repsByWord(page, 'u_lucas');
  expect(Object.values(reps).some((r) => r >= 1)).toBe(true);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto('/');
  await expect(reopened.getByTestId('session-more')).toBeVisible(); // sessão de hoje já feita
  expect(await repsByWord(reopened, 'u_lucas')).toEqual(reps);

  expect(errors).toEqual([]);
});

test('módulos: descoberta, vozes variadas, ligação, fala com melodia, situações', async ({ page }) => {
  await stubSpeech(page, TWO_FRENCH_VOICES);
  const errors = collectErrors(page);
  await page.route('**/api/pronunciation**', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { configured: true } })
      : route.fulfill({
          json: {
            recognizedText: 'Je veux manger.', accuracy: 80, fluency: 88, completeness: 100, pronunciation: 83,
            words: [{ word: 'veux', accuracy: 58, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'ø', accuracy: 35 }] }],
          },
        }),
  );
  await page.goto('/');
  await page.click('[data-user="u_eduarda"]');

  // Palavras-irmãs: exemplos → toque no que muda → regra como confirmação → aplicar.
  await page.goto('/#/cognatos');
  await page.getByTestId('discover-next').click();
  await expect(page.getByTestId('rule-pattern')).toHaveCount(0); // a regra NÃO aparece antes da tentativa
  await expect(page.locator('.pair-row')).toHaveCount(3);
  await page.locator('.tile').last().click(); // "nation"/"question": o fim muda
  await expect(page.getByTestId('rule-pattern')).toHaveText('-ção → -tion');
  await page.getByTestId('continue').click();
  await page.getByTestId('apply-input').fill('solution');
  await page.getByTestId('check').click();
  await expect(page.getByTestId('feedback')).toBeVisible();
  await page.getByTestId('continue').last().click(); // resultado do 1º exemplo → próximo
  for (let i = 0; i < 3; i++) {
    // Espera um exemplo NOVO (campo habilitado) ou o fim; depois de "Concluir" o
    // passo respondido ainda fica na tela até a lista recarregar do banco.
    await expect(page.locator('[data-testid=apply-input]:enabled').or(page.getByTestId('discover-next'))).toBeVisible();
    if (await page.getByTestId('discover-next').isVisible()) break;
    await page.getByTestId('dont-know').click();
    await page.getByTestId('continue').last().click();
  }
  await expect(page.locator('.dots__dot--on')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Falsos amigos' }).click();
  await expect(page.locator('.false-card').filter({ hasText: 'attendre' })).toContainText('ESPERAR');

  // Como se lê: ouvir 3 → deduzir o som → confirmação → reconhecer palavras novas.
  await page.goto('/#/leitura');
  await page.getByTestId('discover-next').click();
  await expect(page.getByTestId('rule-pattern')).toHaveCount(0);
  await page.locator('.choice[data-right="true"]').click();
  await expect(page.getByTestId('rule-pattern')).toContainText('"ô"');
  await page.getByTestId('continue').click();
  for (let i = 0; i < 2; i++) {
    await page.locator('.choice[data-right="true"]').click();
    await page.getByTestId('continue').last().click();
  }
  await expect(page.getByTestId('discover-next')).toBeVisible();

  // Ouvido fino: rodadas alternam entre vozes francesas diferentes.
  await page.goto('/#/escuta');
  await page.getByTestId('listen-start').click();
  const speakers = new Set<string>();
  for (let i = 0; i < 4; i++) {
    speakers.add((await page.locator('.listen').getAttribute('data-speaker'))!);
    await page.locator('.option').first().click();
    await page.getByTestId('next-round').click();
  }
  expect(speakers.size).toBeGreaterThanOrEqual(2);
  const voices = new Set((await spoken(page)).map((s) => s.voice).filter(Boolean));
  expect([...voices].sort()).toEqual(['Amélie', 'Thomas']);

  // Monte a frase: ligação marcada e falada na frase inteira.
  await page.goto('/#/frases?frame=f_lia_cest_un');
  await page.locator('.slot-option', { hasText: /^ami/ }).click();
  await expect(page.getByTestId('built-sentence')).toHaveText("C'est un ami.");
  await expect(page.locator('.lia')).toHaveCount(2);
  await expect(page.getByTestId('liaison-note')).toContainText('un‿ami');
  await expect.poll(async () => (await spoken(page)).map((s) => s.text)).toContain("C'est un ami.");
  // "Fale você": a pessoa repete e vê a própria melodia ao lado da do francês, na hora.
  await expect(page.getByTestId('next-frame')).toHaveText('Pular');
  await page.getByTestId('echo-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('echo-stop').click();
  await expect(page.getByTestId('prosody-tips')).toBeVisible();
  expect(await page.getByTestId('contour-user').count()).toBeGreaterThan(0);
  await expect(page.getByTestId('next-frame')).toHaveText(/Próxima/);

  // Truques de memória.
  await page.goto('/#/memoria');
  await page.fill('input[type=search]', 'attendre');
  await expect(page.locator('.hook-card')).toHaveCount(1);

  // Fale e compare: melodia (local) + nota (Azure simulado) na mesma tela.
  await page.goto(`/#/fala?texto=${encodeURIComponent('Je veux manger.')}`);
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('prosody')).toBeVisible();
  await expect(page.getByTestId('contour-target')).toHaveCount(1);
  expect(await page.getByTestId('contour-user').count()).toBeGreaterThan(0);
  await expect(page.getByTestId('prosody-tips')).toContainText('desceu no fim');
  await page.getByTestId('evaluate').click();
  await expect(page.getByTestId('assess-result')).toContainText('83');
  await expect(page.getByTestId('prosody')).toBeVisible();

  // Situações reais: pelo menos metade pede para produzir a frase.
  await page.goto('/#/situacoes/sc_lu_creche');
  await page.getByTestId('scene-start').click();
  let produce = 0;
  let total = 0;
  while (!(await page.getByTestId('scene-done').isVisible().catch(() => false))) {
    total++;
    if (await page.getByTestId('produce-pt').isVisible()) {
      produce++;
      await page.getByTestId('show-answer').click();
      await page.getByTestId('self-right').click();
    } else {
      await page.getByTestId('show-answer').click();
      await page.getByTestId('continue').click();
    }
  }
  expect(total).toBe(6);
  expect(produce).toBeGreaterThanOrEqual(total / 2);

  expect(errors).toEqual([]);
});

test('revisão alterna reconhecer (reps par) e produzir (reps ímpar), e isso sobrevive a reabrir', async ({ page, context }) => {
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await page.goto('/#/revisao');

  const first = (await page.locator('.review-card').getAttribute('data-word'))!;
  await expect(page.getByTestId('flash-direction')).toHaveText('O que significa?'); // reps 0
  await page.getByTestId('reveal').click();
  await page.locator('.rate__btn--good').click();
  await expect(page.locator('.review-card')).not.toHaveAttribute('data-word', first);
  expect((await repsByWord(page, 'u_lucas'))[first]).toBe(1);

  // Fecha e reabre no dia seguinte: a mesma palavra vem primeiro, agora para PRODUZIR.
  await advanceDays(page, 1);
  await page.close();
  const again = await context.newPage();
  await stubSpeech(again);
  await again.goto('/#/revisao');
  await expect(again.locator('.review-card')).toHaveAttribute('data-word', first);
  await expect(again.getByTestId('flash-direction')).toHaveText('Como se diz em francês?');
  expect((await repsByWord(again, 'u_lucas'))[first]).toBe(1);
  await again.getByTestId('reveal').click();
  await again.locator('.rate__btn--good').click();
  expect((await repsByWord(again, 'u_lucas'))[first]).toBe(2); // próxima vez: reconhecer
});

test('FSRS: "Fácil" some da fila por muito mais tempo que "Não lembrei"', async ({ page }) => {
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_eduarda"]');
  await page.goto('/#/revisao');

  const rate = async (button: string) => {
    const id = await page.locator('.review-card').getAttribute('data-word');
    await page.getByTestId('reveal').click();
    await page.locator(button).click();
    await expect(page.locator('.review-card')).not.toHaveAttribute('data-word', id!);
    return id!;
  };
  const easyWord = await rate('.rate__btn--easy');
  const againWord = await rate('.rate__btn--again');

  await advanceDays(page, 1);
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('1');
  await page.goto('/#/revisao');
  await expect(page.locator('.review-card')).toHaveAttribute('data-word', againWord);

  await advanceDays(page, 4); // +5: a "Fácil" ainda não voltou
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('1');

  await advanceDays(page, 10); // +15: as duas vencidas
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('2');
  expect(easyWord).not.toBe(againWord);
});

test('dia seguinte: a sessão nova começa pelas palavras vencidas', async ({ page }) => {
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await page.getByTestId('session-start').click();
  await completeSession(page);

  await advanceDays(page, 2);
  await page.goto('/#/');
  await expect(page.getByTestId('due-nudge')).toBeVisible();
  await page.getByTestId('session-start').click();
  await expect(page.locator('.session-stage')).toHaveAttribute('data-type', 'review');
  const plan = await page.evaluate(() => JSON.parse(localStorage.getItem('ie.session.v1.u_lucas')!));
  const due = await readStore<{ user_id: string; word_id: string; due_at: string }>(page, 'review_states');
  const now = await page.evaluate(() => Date.now() + Number(localStorage.getItem('ie.clockOffsetDays') ?? 0) * 86_400_000);
  const dueIds = new Set(due.filter((s) => s.user_id === 'u_lucas' && Date.parse(s.due_at) <= now).map((s) => s.word_id));
  const reviewItems = plan.items.filter((i: { type: string }) => i.type === 'review');
  expect(reviewItems.length).toBe(8);
  expect(reviewItems.every((i: { ref: string }) => dueIds.has(i.ref))).toBe(true);
});

test('offline: app, sessão e melodia funcionam sem rede', async ({ page, context }) => {
  await stubSpeech(page);
  await page.goto('/');
  await expect(page.locator('.profile-card')).toHaveCount(2);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname);
    return urls;
  });
  expect(cached).toEqual(expect.arrayContaining(['/index.html', '/seed/seed.json', '/manifest.webmanifest']));

  const failed: string[] = [];
  // Conta o que falta offline. ERR_ABORTED não é falta de cache: é um pedido
  // da página anterior cancelado pelo próprio reload abaixo.
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? '';
    if (!r.url().includes('/api/') && !why.includes('ERR_ABORTED')) failed.push(`${r.url()} (${why})`);
  });
  await context.setOffline(true);
  await page.reload();
  await page.click('[data-user="u_lucas"]');
  await page.getByTestId('session-start').click();
  await expect(page.locator('.session-stage')).toBeVisible();
  for (const route of ['cognatos', 'leitura', 'escuta', 'frases', 'memoria', 'revisao', 'situacoes/sc_lu_pediatra']) {
    await page.goto(`/#/${route}`);
    await expect(page.locator('main')).not.toBeEmpty();
  }
  // A melodia é calculada no aparelho: aparece mesmo sem rede.
  await page.goto(`/#/fala?texto=${encodeURIComponent('Je veux manger.')}`);
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('prosody-tips')).toBeVisible();
  expect(await page.getByTestId('contour-user').count()).toBeGreaterThan(0);
  await expect(page.getByTestId('azure-status')).toContainText('Sem internet');
  expect(failed, `pedidos que falharam offline: ${failed.join(', ')}`).toEqual([]);
  await context.setOffline(false);
});
