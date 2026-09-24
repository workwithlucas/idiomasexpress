import { expect, test, type Page } from '@playwright/test';

/**
 * Fluxo completo da v1:
 * primeira abertura → seed carrega → escolher perfil → os 8 módulos →
 * revisão espaçada → dia seguinte simulado mostra as revisões vencidas.
 *
 * A Web Speech API é substituída por um stub (o Chromium headless não tem
 * vozes) que registra o que foi "falado"; o Azure é simulado via page.route.
 */

declare global {
  interface Window {
    __spoken: string[];
  }
}

async function stubSpeech(page: Page) {
  await page.addInitScript(() => {
    window.__spoken = [];
    const synth = window.speechSynthesis;
    synth.speak = (u: SpeechSynthesisUtterance) => {
      window.__spoken.push(u.text);
      setTimeout(() => u.onend?.(new Event('end') as SpeechSynthesisEvent), 30);
    };
    synth.cancel = () => {};
  });
}

const spoken = (page: Page) => page.evaluate(() => window.__spoken);

test('primeiro uso até a revisão do dia seguinte', async ({ page }) => {
  await stubSpeech(page);

  let azureRequest: { url: string; contentType: string | null; size: number } | null = null;
  await page.route('**/api/pronunciation**', async (route) => {
    const req = route.request();
    if (req.method() === 'GET') return route.fulfill({ json: { configured: true } });
    azureRequest = { url: req.url(), contentType: req.headers()['content-type'] ?? null, size: req.postDataBuffer()?.length ?? 0 };
    return route.fulfill({
      json: {
        recognizedText: 'Demander.', accuracy: 84, fluency: 90, completeness: 100, pronunciation: 86,
        words: [{ word: 'demander', accuracy: 72, errorType: 'Mispronunciation', phonemes: [{ phoneme: 'ɑ̃', accuracy: 48 }, { phoneme: 'e', accuracy: 95 }] }],
      },
    });
  });

  // 1. Primeira abertura: seed é carregado no IndexedDB e aparece a escolha de perfil.
  await page.goto('/');
  await expect(page.locator('.profile-card')).toHaveCount(2);
  const wordCount = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const req = indexedDB.open('idiomasexpress');
        req.onsuccess = () => {
          const c = req.result.transaction('words').objectStore('words').count();
          c.onsuccess = () => resolve(c.result);
        };
      }),
  );
  expect(wordCount).toBeGreaterThanOrEqual(300);

  // 2. Escolher perfil.
  await page.click('[data-user="u_lucas"]');
  await expect(page.locator('.greeting h2')).toContainText('Lucas');
  await expect(page.getByTestId('due-count')).toHaveText('0');
  await expect(page.locator('.hero-card')).toContainText('10 palavras novas');

  // 3. Módulo 1 — Cognatos.
  await page.click('[data-module="cognates"]');
  const rule = page.locator('[data-rule="cr_cao_tion"]');
  await rule.locator('summary').click();
  await expect(rule.locator('.word-row')).not.toHaveCount(0);
  await rule.locator('.word-row .play').first().click();
  await expect.poll(() => spoken(page)).toContain('question');
  await rule.locator('.word-row .icon-btn').first().click(); // + revisão
  await expect(page.locator('.toast', { hasText: 'entrou na sua revisão' })).toBeVisible();
  await page.getByRole('tab', { name: /Falsos amigos/ }).click();
  await expect(page.locator('.false-card').filter({ hasText: 'attendre' })).toContainText('ESPERAR');

  // 4. Módulo 2 — Regras de leitura.
  await page.goto('/#/leitura');
  expect(await page.locator('.reading-card').count()).toBeGreaterThanOrEqual(30);
  await page.locator('[data-rule="rr_oi"] .chip-example .play').first().click();
  await expect.poll(() => spoken(page)).toContain('moi');

  // 5. Módulo 3 — Discriminação sonora.
  await page.goto('/#/escuta');
  await page.getByTestId('listen-start').click();
  await page.locator('.option').first().click();
  await expect(page.getByTestId('listening-feedback')).toBeVisible();
  await page.getByTestId('next-round').click();
  await expect(page.locator('.option').first()).toBeEnabled();

  // 6. Módulo 4 — Construtor de frases (ordem de clique do slot → frase falada).
  await page.goto('/#/frases?frame=f_je_veux');
  await page.locator('.slot-option', { hasText: 'manger' }).click();
  await expect(page.getByTestId('built-sentence')).toHaveText('Je veux manger.');
  await expect.poll(() => spoken(page)).toContain('Je veux manger.');
  // digitando sem acento também vale
  await page.getByTestId('next-frame').click();
  await page.selectOption('select.select', 'f_ou_la');
  await page.fill('input.input', 'creche');
  await page.click('form.typed button');
  await expect(page.getByTestId('built-sentence')).toHaveText('Où est la crèche ?');

  // 7. Módulo 5 — Associação de memória.
  await page.goto('/#/memoria');
  expect(await page.locator('.hook-card').count()).toBeGreaterThan(10);
  await page.fill('input[type=search]', 'attendre');
  await expect(page.locator('.hook-card')).toHaveCount(1);

  // 8. Módulo 6 — Repetição falada com avaliação (Azure simulado).
  await page.goto('/#/fala?texto=demander');
  await expect(page.getByTestId('speak-target')).toHaveText('demander');
  await page.getByTestId('rec-start').click();
  await expect(page.getByTestId('rec-stop')).toBeVisible();
  await page.waitForTimeout(1500);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('own-recording')).toBeVisible();
  await page.getByTestId('evaluate').click();
  await expect(page.getByTestId('assess-result')).toContainText('86');
  await expect(page.locator('.phoneme')).toHaveCount(2);
  expect(azureRequest).not.toBeNull();
  expect(azureRequest!.contentType).toBe('audio/wav');
  expect(azureRequest!.url).toContain('text=demander');
  expect(azureRequest!.size).toBeGreaterThan(44);

  // 9. Módulo 8 — Frases por situação (reaproveita palavras e frames).
  await page.goto('/#/situacoes');
  await page.click('[data-scene="sc_creche"]');
  await expect(page.locator('.frame-item')).not.toHaveCount(0);
  await page.locator('.sentence .play').first().click();
  await expect.poll(async () => (await spoken(page)).at(-1)).toMatch(/malade|chercher|oublié|heure|fièvre|toux/);

  // 10. Módulo 7 — Revisão espaçada: limite de 10 novas/dia, contando a adicionada em Cognatos.
  await page.goto('/#/revisao');
  await expect(page.getByTestId('review-remaining')).toHaveText('10 restantes');
  // Metade das palavras novas é "esquecida" na 1ª vez (Errei) e depois
  // acertada; a outra metade é acertada direto (Bom). Pelo FSRS, as esquecidas
  // voltam em ~1 dia e as outras em ~2 dias.
  const reveal = page.getByTestId('reveal');
  const finished = page.getByTestId('review-finished');
  let newSeen = 0;
  for (let i = 0; i < 80; i++) {
    await expect(reveal.or(finished)).toBeVisible();
    if (await finished.isVisible()) break;
    const isNew = (await page.locator('.flash .pill--new').count()) > 0;
    await reveal.click();
    const miss = isNew && newSeen++ % 2 === 0;
    await page.locator(miss ? '.rate__btn--again' : '.rate__btn--good').click();
  }
  await expect(finished).toContainText('Sessão concluída');
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('0');
  await expect(page.locator('.stat').nth(1)).toContainText('10');
  // todos os módulos praticados hoje aparecem marcados
  await expect(page.locator('.module-tile__done')).toHaveCount(8);

  // 11. Dia seguinte simulado: aparecem exatamente as palavras cujo due_at
  // (gravado pelo FSRS no IndexedDB) já passou.
  const expectedDue = (days: number) =>
    page.evaluate(
      (d) =>
        new Promise<number>((resolve) => {
          const req = indexedDB.open('idiomasexpress');
          req.onsuccess = () => {
            const all = req.result.transaction('review_states').objectStore('review_states').getAll();
            all.onsuccess = () => {
              const limit = new Date(Date.now() + d * 86_400_000).toISOString();
              resolve((all.result as { user_id: string; due_at: string }[]).filter((r) => r.user_id === 'u_lucas' && r.due_at <= limit).length);
            };
          };
        }),
      days,
    );
  expect(await expectedDue(0)).toBe(0);
  const dueTomorrow = await expectedDue(1);
  expect(dueTomorrow).toBe(5); // as 5 esquecidas voltam amanhã

  await page.goto('/#/ajustes');
  await page.getByTestId('clock-plus-1').click();
  await expect(page.locator('.clock-banner')).toBeVisible();
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText(String(dueTomorrow));
  await expect(page.locator('[data-badge="review"]')).toHaveText(String(dueTomorrow));
  await page.goto('/#/revisao');
  await expect(page.locator('.flash .pill--new')).toHaveCount(0); // primeiro cartão é revisão vencida, não nova

  // +1 dia (total +2): as marcadas "Bom" também vencem.
  const dueIn2 = await expectedDue(2);
  expect(dueIn2).toBe(10);
  await page.goto('/#/ajustes');
  await page.getByTestId('clock-plus-1').click();
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('10');

  // 12. Progresso é por perfil: Eduarda não herda as revisões do Lucas.
  await page.goto('/#/perfil');
  await page.click('[data-user="u_eduarda"]');
  await expect(page.getByTestId('due-count')).toHaveText('0');

  // 13. Exportar progresso gera um JSON com os estados de revisão.
  await page.goto('/#/ajustes');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId('export').click()]);
  const text = await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c).toString());
  const file = JSON.parse(text);
  expect(file.type).toBe('progress');
  expect(file.review_states.filter((r: { user_id: string }) => r.user_id === 'u_lucas')).toHaveLength(10);
});

test('FSRS: palavra "Fácil" some da fila por muito mais tempo que "Errei"', async ({ page }) => {
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_eduarda"]');
  await page.goto('/#/revisao');

  const rate = async (button: string) => {
    const fr = await page.getByTestId('flash-fr').innerText();
    await page.getByTestId('reveal').click();
    await page.locator(button).click();
    await expect(page.getByTestId('flash-fr')).not.toHaveText(fr); // próximo cartão já na tela
    return fr;
  };
  const easyWord = await rate('.rate__btn--easy');
  const againWord = await rate('.rate__btn--again');
  expect(easyWord).not.toBe(againWord);

  const advance = async (days: number) => {
    await page.goto('/#/ajustes');
    for (let i = 0; i < days; i++) await page.getByTestId('clock-plus-1').click();
  };

  // +1 dia: só a "Errei" está vencida (a "Fácil" foi para ~10 dias).
  await advance(1);
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('1');
  await page.goto('/#/revisao');
  await expect(page.getByTestId('flash-fr')).toHaveText(againWord);

  // +5 dias no total: a "Fácil" ainda não voltou.
  await advance(4);
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('1');

  // +15 dias: agora as duas estão vencidas.
  await advance(10);
  await page.goto('/#/');
  await expect(page.getByTestId('due-count')).toHaveText('2');
});

test('funciona offline depois da primeira visita (service worker)', async ({ page, context }) => {
  await stubSpeech(page);
  await page.goto('/');
  await expect(page.locator('.profile-card')).toHaveCount(2);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // página passa a ser controlada pelo SW
  await expect(page.locator('.profile-card')).toHaveCount(2);
  expect(await page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

  // O precache contém o app shell e o seed.
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      for (const req of await (await caches.open(name)).keys()) urls.push(new URL(req.url).pathname);
    }
    return urls;
  });
  expect(cached).toEqual(expect.arrayContaining(['/index.html', '/seed/seed.json', '/manifest.webmanifest']));
  expect(cached.some((u) => /\/assets\/index-.*\.js$/.test(u))).toBe(true);
  expect(cached.some((u) => /\/assets\/index-.*\.css$/.test(u))).toBe(true);

  const failed: string[] = [];
  page.on('requestfailed', (r) => !r.url().includes('/api/') && failed.push(r.url()));
  await context.setOffline(true);
  await page.reload();
  await page.click('[data-user="u_lucas"]');
  for (const route of ['cognatos', 'leitura', 'escuta', 'frases', 'memoria', 'fala', 'revisao', 'situacoes/sc_medico']) {
    await page.goto(`/#/${route}`);
    await expect(page.locator('main')).not.toBeEmpty();
  }
  await expect(page.locator('.rule')).toHaveCount(0); // está em situacoes agora
  await page.goto('/#/cognatos');
  await expect(page.locator('.rule')).not.toHaveCount(0);
  await page.goto('/#/fala');
  await expect(page.getByTestId('azure-status')).toContainText('Sem internet');
  expect(failed).toEqual([]); // nenhum recurso (fonte, script, seed) faltando offline
  await context.setOffline(false);
});
