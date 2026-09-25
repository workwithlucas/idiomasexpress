import { expect, test, type Page } from '@playwright/test';

/**
 * Estados de falha que o app precisa atravessar sem travar: banco local
 * danificado, aparelho sem voz francesa, microfone negado, Azure sem chave.
 */

test.use({ serviceWorkers: 'block' });

async function login(page: Page) {
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  await expect(page.locator('.today')).toBeVisible();
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
  await expect(page.locator('.today')).toBeVisible();
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
  await expect(page.locator('.review-card')).toBeVisible();
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
  await page.goto('/#/memoria');
  await page.locator('.hook-card .play').first().click();
  await expect(page.locator('.toast', { hasText: 'Nenhuma voz em francês' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { __spoken: number }).__spoken)).toBe(0);
  await page.goto('/#/ajustes');
  await expect(page.getByTestId('voice-info').locator('[data-status="no-french"]')).toContainText('nenhuma em francês');
});

test('vozes que chegam tarde e SEM o aviso voiceschanged (Safari) aparecem em Ajustes', async ({ page }) => {
  await page.addInitScript(() => {
    const mk = (name: string, lang: string) => ({ name, lang, voiceURI: name, localService: true, default: false });
    const list = [mk('Amélie', 'fr-CA'), mk('Thomas', 'fr_FR'), mk('Samantha', 'en-US')];
    let ready = false;
    setTimeout(() => (ready = true), 1200);
    speechSynthesis.getVoices = () => (ready ? list : []) as unknown as SpeechSynthesisVoice[];
    // de propósito: nunca dispara "voiceschanged"
  });
  await login(page);
  await page.goto('/#/ajustes');
  await expect(page.getByTestId('voice-select').locator('option')).toHaveText(['Automática (Thomas)', 'Amélie · Canadá', 'Thomas · França']);
  await expect(page.getByTestId('voice-info')).toContainText('2 vozes francesas');
});

test('navegador sem lista de vozes: Ajustes explica, não fica em branco', async ({ page }) => {
  await page.addInitScript(() => {
    speechSynthesis.getVoices = () => [];
  });
  await login(page);
  await page.goto('/#/ajustes');
  await expect(page.getByTestId('voice-info')).toContainText('Procurando');
  await expect(page.getByTestId('voice-info').locator('[data-status="none-listed"]')).toContainText('Testar voz', { timeout: 8000 });
  await expect(page.getByTestId('voice-info')).toContainText('iPhone');
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
  await page.goto('/#/memoria');
  await page.locator('.hook-card .play').first().click();
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

test('Azure sem chave: avisa, e a melodia aparece mesmo assim', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  await login(page);
  await page.goto(`/#/fala?texto=${encodeURIComponent('Je veux manger.')}`);
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('own-recording')).toBeVisible();
  await expect(page.getByTestId('prosody-tips')).toBeVisible();
  expect(await page.getByTestId('contour-user').count()).toBeGreaterThan(0);
  await expect(page.getByTestId('azure-status')).toContainText('ainda não está ligada');
  await expect(page.getByTestId('evaluate')).toHaveCount(0);
  await page.getByTestId('another-sentence').click();
  await expect(page.getByTestId('rec-start')).toBeEnabled();
});

test('Azure falhando (erro 500): nota avisa com calma, melodia continua', async ({ page, context }) => {
  const errors = collectErrors(page);
  await context.grantPermissions(['microphone']);
  await page.route('**/api/pronunciation**', (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({ json: { configured: true } })
      : route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'upstream', message: 'Azure respondeu 500' }) }),
  );
  await login(page);
  await page.goto(`/#/fala?texto=${encodeURIComponent('Je veux manger.')}`);
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('prosody-tips')).toBeVisible();
  await page.getByTestId('evaluate').click();
  await expect(page.getByTestId('assess-error')).toContainText('Não deu pra calcular a nota agora');
  await expect(page.getByTestId('assess-error')).not.toContainText('500'); // sem jargão técnico
  await expect(page.getByTestId('prosody')).toBeVisible();
  // O 500 aparece como falha de rede no console (esperado); nada além disso.
  expect(errors.filter((e) => !e.includes('500') && !e.includes('Nota de pronúncia indisponível'))).toEqual([]);
});

// ---- Nota por som: uso real e contínuo --------------------------------------

/** Grava ~2,6 s com o microfone falso (voz sintética) na tela Fale e compare. */
async function recordSentence(page: Page) {
  await page.goto(`/#/fala?texto=${encodeURIComponent('Je voudrais un café.')}`);
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(2600);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('prosody-tips')).toBeVisible(); // a melodia sai sempre
}

const okResult = {
  recognizedText: 'Je voudrais un café.', accuracy: 81, fluency: 90, completeness: 100, pronunciation: 78,
  words: [
    { word: 'Je', accuracy: 92, errorType: 'None', phonemes: [], syllables: [{ grapheme: 'je', accuracy: 92 }] },
    { word: 'voudrais', accuracy: 88, errorType: 'None', phonemes: [], syllables: [{ grapheme: 'vou', accuracy: 90 }, { grapheme: 'drais', accuracy: 86 }] },
    { word: 'un', accuracy: 85, errorType: 'None', phonemes: [], syllables: [{ grapheme: 'un', accuracy: 85 }] },
    { word: 'café', accuracy: 52, errorType: 'Mispronunciation', phonemes: [], syllables: [{ grapheme: 'ca', accuracy: 95 }, { grapheme: 'fé', accuracy: 31 }] },
  ],
};

test('nota real: geral em destaque, pior palavra/sílaba em accent, histórico salvo por palavra', async ({ page, context }) => {
  const errors = collectErrors(page);
  await context.grantPermissions(['microphone']);
  await page.route('**/api/pronunciation**', (route) =>
    route.request().method() === 'GET' ? route.fulfill({ json: { configured: true, valid: true } }) : route.fulfill({ json: okResult }),
  );
  await login(page);
  await recordSentence(page);
  await page.getByTestId('evaluate').click();
  await expect(page.getByTestId('overall-score')).toContainText('78');
  await expect(page.getByTestId('prosody')).toBeVisible(); // nota e melodia na mesma tela
  // Só "café" fica em destaque; e dentro dela, a sílaba "fé".
  await expect(page.locator('.word-score--focus')).toHaveText(['cafésoou diferente']);
  await expect(page.getByTestId('syllables').locator('.phoneme--focus')).toHaveText(['fé31']);
  // O destaque usa o token accent (nada de vermelho/verde).
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
  const border = await page.locator('.word-score--focus').evaluate((el) => getComputedStyle(el).borderTopColor);
  const hex = (rgb: string) => '#' + rgb.match(/\d+/g)!.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  expect(hex(border)).toBe(accent.toUpperCase());
  // Histórico: uma linha por palavra do banco reconhecida na frase.
  const hist = await page.evaluate(() => new Promise<{ word_id: string; score: number; overall: number }[]>((resolve) => {
    const req = indexedDB.open('idiomasexpress');
    req.onsuccess = () => {
      const all = req.result.transaction('pronunciation_history').objectStore('pronunciation_history').getAll();
      all.onsuccess = () => resolve(all.result);
    };
  }));
  expect(hist.map((r) => [r.word_id, r.score]).sort()).toEqual([['w_cafe', 52], ['w_je', 92], ['w_un', 85]]);
  expect(hist.every((r) => r.overall === 78)).toBe(true);
  expect(errors).toEqual([]);
});

test('cota do plano gratuito esgotada: avisa, não oferece "tentar de novo", melodia continua', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  let posts = 0;
  await page.route('**/api/pronunciation**', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured: true, valid: true } });
    posts++;
    return route.fulfill({ status: 429, json: { error: 'quota', message: 'O limite de uso do plano do Azure acabou. (HTTP 403: Out of call volume quota)' } });
  });
  await login(page);
  await recordSentence(page);
  await page.getByTestId('evaluate').click();
  await expect(page.getByTestId('assess-error')).toContainText('limite gratuito do Azure deste mês acabou');
  await expect(page.getByTestId('assess-error')).not.toContainText('HTTP');
  await expect(page.getByTestId('assess-retry')).toHaveCount(0);
  await expect(page.getByTestId('prosody')).toBeVisible();
  // Nova gravação na mesma tela: não insiste no Azure.
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(1500);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('azure-status')).toContainText('limite gratuito');
  await expect(page.getByTestId('evaluate')).toHaveCount(0);
  expect(posts).toBe(1);
});

test('chave recusada pelo Azure: mensagem clara já antes de avaliar, melodia continua', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  await page.route('**/api/pronunciation**', (route) => route.fulfill({ json: { configured: true, valid: false } }));
  await login(page);
  await recordSentence(page);
  await expect(page.getByTestId('azure-status')).toContainText('chave do Azure não foi aceita');
  await expect(page.getByTestId('evaluate')).toHaveCount(0);
  await expect(page.getByTestId('contour-user').first()).toBeVisible();
  await page.goto('/#/ajustes');
  await expect(page.getByTestId('azure-settings-status')).toHaveText('chave recusada');
});

test('Azure demorou (timeout): mensagem amigável, tela livre e "tentar de novo" funciona', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  let fail = true;
  await page.route('**/api/pronunciation**', async (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured: true } });
    if (fail) return route.fulfill({ status: 504, json: { error: 'timeout', message: 'O Azure demorou demais para responder.' } });
    return route.fulfill({ json: okResult });
  });
  await login(page);
  await recordSentence(page);
  await page.getByTestId('evaluate').click();
  await expect(page.getByTestId('assess-error')).toContainText('demorou demais');
  await expect(page.getByTestId('rec-start')).toBeEnabled(); // nada travado
  fail = false;
  await page.getByTestId('assess-retry').click();
  await expect(page.getByTestId('overall-score')).toContainText('78');
});

test('gravação silenciosa: pede para gravar de novo e nem chama o Azure', async ({ page, context }) => {
  await context.grantPermissions(['microphone']);
  // Microfone "mudo": um stream de áudio só com silêncio.
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const dest = ctx.createMediaStreamDestination();
      osc.connect(gain).connect(dest);
      osc.start();
      return dest.stream;
    };
  });
  let posts = 0;
  await page.route('**/api/pronunciation**', (route) => {
    if (route.request().method() === 'GET') return route.fulfill({ json: { configured: true, valid: true } });
    posts++;
    return route.fulfill({ json: okResult });
  });
  await login(page);
  await page.goto(`/#/fala?texto=${encodeURIComponent('Je voudrais un café.')}`);
  await page.getByTestId('rec-start').click();
  await page.waitForTimeout(1500);
  await page.getByTestId('rec-stop').click();
  await expect(page.getByTestId('recording-check')).toContainText('Grave de novo');
  await expect(page.getByTestId('evaluate')).toHaveCount(0);
  await expect(page.getByTestId('rec-start')).toBeEnabled();
  expect(posts).toBe(0);
});
