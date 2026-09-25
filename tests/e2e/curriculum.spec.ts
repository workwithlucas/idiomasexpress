import { expect, test } from '@playwright/test';
import { collectErrors, completeMomento, readStore, stubSpeech } from './helpers';

/**
 * Os 37 Momentos, um atrás do outro, pelo caminho que o app oferece
 * (o cartão de Hoje sempre aponta o próximo). Nenhum erro, e no fim a
 * trilha fica completa e "O que você já consegue dizer" tem os 37.
 */
test.use({ serviceWorkers: 'block' });
test.setTimeout(600_000);

test('a trilha inteira: 37 Momentos seguidos pelo cartão de Hoje', async ({ page }) => {
  await stubSpeech(page, [{ name: 'Amélie', lang: 'fr-FR' }, { name: 'Thomas', lang: 'fr-FR' }]);
  const errors = collectErrors(page);
  await page.goto('/');
  await page.click('[data-user="u_lucas"]');
  const titles: string[] = [];
  for (let i = 0; i < 37; i++) {
    await expect(page.getByTestId('hero-title')).toBeVisible();
    titles.push((await page.getByTestId('hero-title').textContent()) ?? '');
    await page.getByTestId('start').click();
    await completeMomento(page);
  }
  expect(new Set(titles).size).toBe(37);
  await expect(page.getByTestId('hero')).toContainText('Você passou por todos os momentos');
  await expect(page.getByTestId('cando').locator('li')).toHaveCount(37);
  expect((await readStore(page, 'momento_progress')).length).toBe(37);
  await page.goto('/#/caderno');
  await expect(page.getByTestId('phrases').locator('li')).toHaveCount(37);
  expect(errors.filter((e) => !/blocked by Playwright/.test(e))).toEqual([]);
});
