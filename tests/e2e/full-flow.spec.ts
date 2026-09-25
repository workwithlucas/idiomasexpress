import { expect, test } from '@playwright/test';
import { advanceDays, collectErrors, completeMomento, doReencontros, readStore, repsByWord, spoken, stubSpeech } from './helpers';

/**
 * A experiência nova, de ponta a ponta:
 * primeira abertura → perfil → Hoje → Momento 1 inteiro (6 passos) → Hoje
 * com a trilha atualizada → Caderno → Como funciona → dia seguinte com
 * reencontros antes do próximo Momento → offline.
 */

const TWO_FRENCH_VOICES = [
  { name: 'Amélie', lang: 'fr-FR' },
  { name: 'Thomas', lang: 'fr-FR' },
  { name: 'Samantha', lang: 'en-US' },
];

test('Momento 1 completo, igual ao protótipo, sem erros', async ({ page }) => {
  await stubSpeech(page, TWO_FRENCH_VOICES);
  const errors = collectErrors(page);

  // Primeira abertura: seed no IndexedDB e escolha de perfil.
  await page.goto('/');
  await expect(page.locator('.profile-card')).toHaveCount(2);
  expect((await readStore(page, 'words')).length).toBeGreaterThanOrEqual(1100);
  expect((await readStore(page, 'momentos')).length).toBeGreaterThanOrEqual(1);
  await page.click('[data-user="u_lucas"]');

  // Hoje: três abas, um cartão, um botão. Nada de "o que você quer treinar".
  await expect(page.locator('.tab')).toHaveText(['Hoje', 'Caderno', 'Como funciona']);
  await expect(page.getByTestId('hero-title')).toHaveText('Um café, por favor');
  await expect(page.getByTestId('hero-meta')).toHaveText('6 minutos');
  await expect(page.getByTestId('cando-empty')).toHaveText('Termine seu primeiro momento e ele aparece aqui.');
  await page.getByTestId('start').click();

  // 1. Escute: seis falas, duas vozes diferentes, tradução escondida.
  await expect(page.locator('.tabs')).toHaveCount(0);
  await expect(page.locator('.seg i.on')).toHaveCount(1);
  await expect(page.locator('.line')).toHaveCount(6);
  await expect(page.locator('.line .pt').first()).toBeHidden();
  await page.getByTestId('toggle-pt').click();
  await expect(page.locator('.line .pt').first()).toHaveText('Bom dia! O que eu lhe sirvo?');
  await page.getByTestId('play-all').click();
  await expect.poll(async () => (await spoken(page)).length).toBeGreaterThanOrEqual(6);
  const conv = (await spoken(page)).slice(0, 6);
  expect(conv[0].text).toBe('Bonjour ! Qu\'est-ce que je vous sers ?');
  expect(new Set(conv.map((s) => s.voice)).size).toBe(2); // a atendente e "Você" com vozes diferentes
  await expect(page.getByText('Não precisa entender tudo. Só escute.')).toBeVisible();
  await page.getByTestId('momento-next').click();

  // 2. Você já sabe: 14 de 17, calculado; tocar numa palavra abre a folha.
  await expect(page.getByTestId('momento-next')).toBeDisabled();
  await page.getByTestId('reveal-known').click();
  await expect(page.getByTestId('reveal-count')).toContainText('14 de 17');
  await expect(page.getByTestId('reveal-count')).toContainText('palavras desta conversa já moram no seu português.');
  await expect(page.locator('.tok--known').first()).toBeVisible();
  await page.locator('.tok', { hasText: 'lait' }).first().click();
  await expect(page.getByTestId('word-sheet')).toContainText('Lait e leite vêm da mesma palavra latina.');
  await page.getByTestId('sheet-close').click();
  await page.locator('.tok', { hasText: 'Avec' }).click();
  await expect(page.getByTestId('word-sheet')).toContainText('Você não precisa decorar: ela volta nos seus reencontros.');
  await page.getByTestId('sheet-close').click();
  await page.getByTestId('momento-next').click();

  // 3. A chave: letras caladas. Erro → "Quase." com pista; acerto → "Isso.".
  await expect(page.locator('.kw')).toHaveCount(3);
  await page.locator('[data-testid=step-key] > .opts .opt').first().click();
  await expect(page.getByText('Quase. Ouve as três de novo e repara só no finalzinho.')).toBeVisible();
  await expect(page.getByTestId('momento-next')).toBeDisabled();
  await page.locator('[data-testid=step-key] > .opts .opt[data-right="true"]').click();
  await expect(page.getByTestId('key-reveal')).toContainText('Isso. Em francês, a consoante do fim costuma ficar calada.');
  await page.getByTestId('key-more').click();
  await expect(page.getByTestId('guide-sheet')).toContainText('Letras que ficam caladas');
  await page.getByTestId('sheet-close').click();
  const apply = page.getByTestId('apply');
  await apply.first().locator('.opt[data-right="false"]').click();
  await expect(apply.first()).toContainText('Quase. Lembra da letra do fim.');
  await apply.first().locator('.opt[data-right="true"]').click();
  await expect(apply.first()).toContainText('Isso. chocolat quer dizer chocolate.');
  await apply.nth(1).locator('.opt[data-right="true"]').click();
  await expect(page.getByText('careful')).toBeVisible();
  await page.getByTestId('momento-next').click();

  // 4. Monte: cada troca toca e mostra a tradução; nenhuma opção é "errada".
  await expect(page.locator('.chip')).toHaveCount(5);
  await page.locator('.chip', { hasText: 'thé' }).click();
  await expect(page.getByTestId('built-pt')).toHaveText('Um chá, por favor.');
  await page.locator('.chip', { hasText: 'chocolat chaud' }).click();
  await expect(page.getByTestId('built-pt')).toHaveText('Um chocolate quente, por favor.');
  await expect.poll(async () => (await spoken(page)).map((s) => s.text)).toContain("Un chocolat chaud, s'il vous plaît.");
  await page.getByTestId('momento-next').click();

  // 5. Fale: grava e vê a melodia (Azure sem chave no teste: só o aviso).
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('prosody-tips')).toBeVisible();
  await expect(page.getByTestId('azure-status')).toBeVisible();
  await page.getByTestId('momento-next').click();

  // 6. Leve com você: textos fixos e números calculados.
  await expect(page.getByTestId('can-do')).toHaveText('Agora você consegue pedir algo num café.');
  await expect(page.getByTestId('first-ever')).toHaveText('Você acabou de entender uma conversa inteira em francês.');
  await expect(page.getByTestId('today-phrase')).toHaveText("Un chocolat chaud, s'il vous plaît.");
  await expect(page.getByText('Sua frase de hoje foi para o Caderno. Amanhã ela volta para um reencontro rápido.')).toBeVisible();
  await expect(page.getByTestId('stats')).toContainText('17palavras encontradas');
  await expect(page.getByTestId('stats')).toContainText('14já eram suas');
  await expect(page.getByTestId('stats')).toContainText('1chave nova');
  await expect(page.getByTestId('momento-next')).toHaveText('Terminar');
  await page.getByTestId('momento-next').click();

  // Hoje depois: capítulo com a barra cheia, check no Momento, "consegue dizer".
  await expect(page.locator('.chap').first().getByTestId('chap-count')).toHaveText(/^1 de \d+$/);
  await expect(page.locator('.stat--done.stat--pop')).toHaveCount(1);
  await expect(page.getByTestId('cando')).toHaveText('Pedir algo num café');

  // Caderno: a frase de hoje e as 17 palavras (já era sua / nova).
  await page.locator('.tab', { hasText: 'Caderno' }).click();
  await expect(page.getByTestId('phrases')).toContainText("Un chocolat chaud, s'il vous plaît.");
  await expect(page.getByTestId('words').locator('.list-row')).toHaveCount(17);
  await expect(page.getByTestId('words').locator('.tag--mine')).toHaveCount(14);
  await page.getByTestId('word-search').fill('leite');
  await expect(page.getByTestId('words').locator('.list-row')).toHaveCount(1);
  await page.getByTestId('words').locator('.list-row').click();
  await expect(page.getByTestId('word-sheet')).toContainText('Apareceu no momento “Um café, por favor”.');
  await page.getByTestId('sheet-close').click();

  // Como funciona: 13 capítulos, sempre abertos; o 2 mostra onde apareceu.
  await page.locator('.tab', { hasText: 'Como funciona' }).click();
  await expect(page.locator('.list-row')).toHaveCount(13);
  await expect(page.locator('[data-chapter="2"]')).toContainText('Apareceu no momento “Um café, por favor”');
  await page.locator('[data-chapter="11"]').click();
  await expect(page.getByTestId('guide-11')).toContainText('Pronto. Você já fala do futuro em francês.');

  // Progresso gravado no banco.
  const progress = await readStore<{ user_id: string; momento_id: string; built_phrase: string }>(page, 'momento_progress');
  expect(progress).toEqual([expect.objectContaining({ user_id: 'u_lucas', momento_id: 'm01', built_phrase: "Un chocolat chaud, s'il vous plaît." })]);
  expect(errors).toEqual([]);
});

test('reencontros no dia seguinte: antes do Momento, alternando reconhecer e produzir pelo reps', async ({ page, context }) => {
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_eduarda"]');
  await page.getByTestId('start').click();
  await completeMomento(page, { slot: 'thé' });
  // Hoje mesmo, nada volta: as palavras novas voltam amanhã.
  expect(Object.values(await repsByWord(page, 'u_eduarda')).every((r) => r === 0)).toBe(true);

  await advanceDays(page, 1);
  await page.goto('/#/');
  await expect(page.getByTestId('hero-meta')).toContainText('Começa com 8 reencontros rápidos');
  await expect(page.getByTestId('skip-reencontros')).toBeVisible();
  await page.getByTestId('start').click();
  const first = await doReencontros(page);
  expect(first).toHaveLength(8);
  expect(first[0].kind).toBe('phrase'); // a frase de ontem volta primeiro
  const words = first.filter((r) => r.kind === 'word');
  expect(words.every((r) => r.direction === 'recognize')).toBe(true); // reps 0 → reconhecer
  // E emenda direto no próximo Momento (ou volta para Hoje, se ainda não houver outro).
  await expect(page.getByTestId('step-listen').or(page.getByTestId('hero'))).toBeVisible();
  const reps = await repsByWord(page, 'u_eduarda');
  for (const w of words) expect(reps[w.word!]).toBe(1);

  // As que sobraram (além das 8) ficam no Caderno, opcionais.
  await page.goto('/#/caderno');
  await expect(page.getByTestId('review-more')).toBeVisible();

  // Fecha e reabre dias depois: as mesmas palavras voltam, agora para PRODUZIR (reps ímpar).
  await advanceDays(page, 4);
  await page.close();
  const again = await context.newPage();
  await stubSpeech(again);
  await again.goto('/#/');
  await again.getByTestId('start').click();
  const second = await doReencontros(again);
  const produced = second.filter((r) => words.some((w) => w.word === r.word));
  expect(produced.length).toBeGreaterThan(0);
  expect(produced.every((r) => r.direction === 'produce')).toBe(true);
  const reps2 = await repsByWord(again, 'u_eduarda');
  for (const r of produced) expect(reps2[r.word!]).toBe(2);
});

test('pular reencontros hoje: o Momento começa direto e nada é cobrado', async ({ page }) => {
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await page.getByTestId('start').click();
  await completeMomento(page);
  await advanceDays(page, 1);
  await page.goto('/#/');
  await page.getByTestId('skip-reencontros').click();
  await expect(page.getByTestId('skip-reencontros')).toHaveCount(0);
  await expect(page.getByTestId('hero')).not.toContainText('reencontro');
  // Tudo que venceu fica no Caderno, opcional.
  await page.goto('/#/caderno');
  await page.getByTestId('review-more-start').click();
  const done = await doReencontros(page);
  expect(done.length).toBeGreaterThan(0);
  await expect(page).toHaveURL(/#\/caderno/);
});

test('offline: o Momento inteiro funciona sem rede, com melodia e aviso da nota', async ({ page, context }) => {
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
  page.on('requestfailed', (r) => {
    const why = r.failure()?.errorText ?? '';
    if (!r.url().includes('/api/') && !why.includes('ERR_ABORTED')) failed.push(`${r.url()} (${why})`);
  });
  await context.setOffline(true);
  await page.reload();
  await page.click('[data-user="u_lucas"]');
  await page.getByTestId('start').click();
  await completeMomento(page, { slot: 'croissant', record: false });
  // A fala offline: a melodia sai no aparelho; a nota avisa que volta com internet.
  await page.goto('/#/momento/m01?passo=5');
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('prosody-tips')).toBeVisible();
  await expect(page.getByTestId('azure-status')).toContainText('Sem internet');
  for (const route of ['caderno', 'como-funciona', 'como-funciona/4', 'ajustes']) {
    await page.goto(`/#/${route}`);
    await expect(page.locator('main')).not.toBeEmpty();
  }
  expect((await readStore(page, 'momento_progress')).length).toBe(1);
  expect(failed, `pedidos que falharam offline: ${failed.join(', ')}`).toEqual([]);
  await context.setOffline(false);
});

test('par mínimo no fim da escuta: tocado com a outra voz, sem certo/errado em cor', async ({ page }) => {
  await stubSpeech(page, TWO_FRENCH_VOICES);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await page.goto('/#/momento/m03');
  const q = page.getByTestId('pair-question');
  await expect(q).toContainText('Ela disse vu ou vous?');
  await q.locator('.opt[data-word="w_vu"]').click();
  await expect(q).toContainText('Quase.');
  await q.locator('.opt[data-word="w_vous"]').click();
  await expect(q).toContainText('Isso. Era vous');
  const voices = new Set((await spoken(page)).filter((s) => s.text === 'vous').map((s) => s.voice));
  expect(voices).toEqual(new Set(['Thomas'])); // a voz de "Você", não a da atendente
});
