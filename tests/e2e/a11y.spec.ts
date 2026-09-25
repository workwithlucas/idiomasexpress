import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { completeMomento, stubSpeech } from './helpers';

/**
 * Verificador de acessibilidade (axe-core, WCAG 2.1 A/AA) em todas as telas
 * e em cada passo do Momento, no tema claro e no escuro.
 */
test.use({ serviceWorkers: 'block' });

async function check(page: Page, where: string) {
  // Deixa as transições de opacidade terminarem (o axe mede cor final).
  await page.waitForTimeout(400);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map((v) => `${where}: ${v.id} (${v.nodes.map((n) => n.target.join(' ')).join(' | ')})`)).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
  test(`sem problemas de acessibilidade · tema ${scheme === 'light' ? 'claro' : 'escuro'}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await stubSpeech(page, [{ name: 'Amélie', lang: 'fr-FR' }, { name: 'Thomas', lang: 'fr-FR' }]);
    await page.goto('/');
    await check(page, 'perfil');
    await page.click('[data-user="u_lucas"]');
    await expect(page.getByTestId('hero')).toBeVisible();
    await check(page, 'hoje');

    await page.getByTestId('start').click();
    await check(page, 'passo 1');
    await page.getByTestId('toggle-pt').click();
    await page.getByTestId('momento-next').click();
    await page.getByTestId('reveal-known').click();
    await page.waitForTimeout(1600);
    await check(page, 'passo 2');
    await page.locator('.tok').first().click();
    await check(page, 'folha da palavra');
    await page.getByTestId('sheet-close').click();
    await page.getByTestId('momento-next').click();
    await page.locator('[data-testid=step-key] > .opts .opt[data-right="false"]').first().click();
    await check(page, 'passo 3 (quase)');
    await page.locator('[data-testid=step-key] > .opts .opt[data-right="true"]').click();
    for (const card of await page.getByTestId('apply').all()) await card.locator('.opt[data-right="true"]').click();
    await check(page, 'passo 3');
    await page.getByTestId('key-more').click();
    await check(page, 'entender melhor');
    await page.getByTestId('sheet-close').click();
    await page.getByTestId('momento-next').click();
    await page.locator('.chip').nth(1).click();
    await check(page, 'passo 4');
    await page.getByTestId('momento-next').click();
    await page.getByTestId('rec-start').click();
    await page.waitForTimeout(2600);
    await page.getByTestId('rec-stop').click();
    await expect(page.getByTestId('prosody-tips')).toBeVisible();
    await check(page, 'passo 5');
    await page.getByTestId('momento-next').click();
    await check(page, 'passo 6');
    await page.getByTestId('momento-next').click();
    await expect(page.getByTestId('hero')).toBeVisible();
    await page.waitForTimeout(1600);
    await check(page, 'hoje depois');

    await page.goto('/#/caderno');
    await check(page, 'caderno');
    await page.goto('/#/como-funciona');
    await check(page, 'como funciona');
    for (const n of [1, 4, 5, 13]) {
      await page.goto(`/#/como-funciona/${n}`);
      await check(page, `capítulo ${n}`);
    }
    await page.goto('/#/como-funciona/4');
    await page.getByTestId('practice-start').click();
    await check(page, 'prática de ouvido');
    await page.goto('/#/ajustes');
    await check(page, 'ajustes');
  });
}

test('reencontro e "Revisar mais" também passam no verificador', async ({ page }) => {
  await stubSpeech(page);
  await page.goto('/');
  await page.click('[data-user="u_eduarda"]');
  await page.getByTestId('start').click();
  await completeMomento(page);
  await page.goto('/#/ajustes');
  await page.getByTestId('clock-plus-1').click();
  await page.goto('/#/');
  await page.getByTestId('start').click();
  await expect(page.getByTestId('reencontro')).toBeVisible();
  await check(page, 'reencontro (frase)');
  await page.getByTestId('reencontro-show').click();
  await check(page, 'reencontro aberto');
});
