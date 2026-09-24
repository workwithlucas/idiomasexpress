import { expect, test, type Page } from '@playwright/test';

/**
 * Estados de falha que o app precisa atravessar sem travar: banco local
 * danificado, aparelho sem voz francesa, microfone negado, Azure sem chave.
 */

test.use({ serviceWorkers: 'block' });

async function login(page: Page) {
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await expect(page.locator('.hero-card')).toBeVisible();
}

/** Executa uma alteração direta no IndexedDB do app. */
function mutateDB(page: Page, stores: string[], body: string) {
  return page.evaluate(
    ({ stores, body }) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('idiomasexpress');
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(stores, 'readwrite');
          new Function('tx', body)(tx);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    { stores, body },
  );
}

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

test('conteúdo apagado com seed_version intacto é repopulado no próximo boot', async ({ page }) => {
  const errors = collectErrors(page);
  await login(page);
  await mutateDB(page, ['words', 'frames', 'users'], "['words','frames','users'].forEach((s) => tx.objectStore(s).clear());");
  await page.reload();
  // Perfis voltaram, e o perfil salvo continua ativo.
  await expect(page.locator('.hero-card')).toBeVisible();
  await page.goto('/#/frases');
  await expect(page.locator('.slot-option').first()).toBeVisible();
  await page.goto('/#/fala');
  await expect(page.getByTestId('speak-target')).not.toBeEmpty();
  expect(errors).toEqual([]);
});

test('estado de revisão corrompido não trava a revisão', async ({ page }) => {
  const errors = collectErrors(page);
  await login(page);
  await mutateDB(
    page,
    ['review_states'],
    `tx.objectStore('review_states').put({ user_id: 'u_lucas', word_id: 'w_de', due_at: '2000-01-01T00:00:00.000Z', stability: 'x', difficulty: null, state: 99, reps: 'a', lapses: null, scheduled_days: null, elapsed_days: null, learning_steps: null, last_review: 'lixo', created_at: 'lixo', last_result: null });
     tx.objectStore('review_states').put({ user_id: 'u_lucas', word_id: 'w_palavra_removida', due_at: '2000-01-01T00:00:00.000Z', stability: 1, difficulty: 5, state: 2, reps: 1, lapses: 0, scheduled_days: 1, elapsed_days: 0, learning_steps: 0, last_review: null, created_at: '2000-01-01T00:00:00.000Z', last_result: 'good' });`,
  );
  await page.reload();
  // O órfão não conta; o corrompido volta a ser uma palavra nova vencida.
  await expect(page.getByTestId('due-count')).toHaveText('1');
  await page.goto('/#/revisao');
  await page.getByTestId('reveal').click();
  await page.locator('.rate__btn--good').click();
  await expect(page.getByTestId('flash-fr')).toBeVisible();
  expect(errors.filter((e) => !e.includes('corrompido'))).toEqual([]);
});

test('localStorage inválido cai na seleção de perfil', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('ie.prefs', '{lixo');
    localStorage.setItem('ie.clockOffsetDays', 'abc');
  });
  await page.goto('/');
  await expect(page.locator('.profile-card')).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('sem voz francesa: não fala em outro idioma e avisa', async ({ page }) => {
  await page.addInitScript(() => {
    const mk = (name: string, lang: string) => ({ name, lang, voiceURI: name, localService: true, default: false });
    const list = [mk('Samantha', 'en-US'), mk('Luciana', 'pt-BR')];
    (window as unknown as { __spoken: number }).__spoken = 0;
    speechSynthesis.getVoices = () => list as unknown as SpeechSynthesisVoice[];
    speechSynthesis.speak = () => {
      (window as unknown as { __spoken: number }).__spoken++;
    };
  });
  await login(page);
  await page.goto('/#/leitura');
  await page.locator('.chip-example .play').first().click();
  await expect(page.locator('.toast', { hasText: 'Nenhuma voz em francês' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __spoken: number }).__spoken)).toBe(0);
  await page.goto('/#/ajustes');
  await expect(page.getByTestId('no-french-voice')).toBeVisible();
});

test('com voz francesa disponível, sempre usa ela (mesmo com preferência antiga inválida)', async ({ page }) => {
  await page.addInitScript(() => {
    const mk = (name: string, lang: string) => ({ name, lang, voiceURI: name, localService: true, default: false });
    const list = [mk('Samantha', 'en-US'), mk('Thomas', 'fr_FR')];
    const w = window as unknown as { __utt: { voice: string | null; lang: string }[] };
    w.__utt = [];
    window.SpeechSynthesisUtterance = class {
      text: string;
      voice: { name: string } | null = null;
      lang = '';
      rate = 1;
      onend?: () => void;
      constructor(t: string) {
        this.text = t;
      }
    } as unknown as typeof SpeechSynthesisUtterance;
    speechSynthesis.getVoices = () => list as unknown as SpeechSynthesisVoice[];
    speechSynthesis.speak = (u) => {
      w.__utt.push({ voice: (u.voice as { name: string } | null)?.name ?? null, lang: u.lang });
      setTimeout(() => (u as unknown as { onend?: () => void }).onend?.(), 10);
    };
    localStorage.setItem('ie.prefs', JSON.stringify({ voiceURI: 'Samantha' }));
  });
  await login(page);
  await page.goto('/#/leitura');
  await page.locator('.chip-example .play').first().click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { __utt: unknown[] }).__utt)).toEqual([{ voice: 'Thomas', lang: 'fr-FR' }]);
});

test('microfone negado: mensagem clara, app continua usável', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      throw new DOMException('Permission denied', 'NotAllowedError');
    };
  });
  await login(page);
  await page.goto('/#/fala?texto=bonjour');
  await page.getByTestId('rec-start').click();
  await expect(page.getByTestId('mic-error')).toContainText('Permissão de microfone negada');
  await expect(page.getByTestId('rec-start')).toBeEnabled();
  await page.getByTestId('another-word').click();
  await expect(page.getByTestId('speak-target')).not.toHaveText('bonjour');
  expect(errors).toEqual([]);
});

test('toque múltiplo em Gravar abre um único microfone', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  await page.addInitScript(() => {
    const w = window as unknown as { __gum: number };
    w.__gum = 0;
    const orig = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = (c) => {
      w.__gum++;
      return orig(c);
    };
  });
  await login(page);
  await page.goto('/#/fala?texto=bonjour');
  await page.evaluate(() => {
    const b = document.querySelector<HTMLButtonElement>('[data-testid=rec-start]')!;
    b.click();
    b.click();
    b.click();
  });
  await expect(page.getByTestId('rec-stop')).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __gum: number }).__gum)).toBe(1);
  await page.getByTestId('rec-stop').click();
});

test('Azure sem chave: avisa e permite seguir sem nota', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  await login(page);
  await page.goto('/#/fala?texto=bonjour');
  await expect(page.getByTestId('azure-status')).toContainText('ainda não foi configurado');
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(1200);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('own-recording')).toBeVisible();
  await expect(page.getByTestId('evaluate')).toBeDisabled();
  await page.getByTestId('another-sentence').click();
  await expect(page.getByTestId('rec-start')).toBeEnabled();
});
