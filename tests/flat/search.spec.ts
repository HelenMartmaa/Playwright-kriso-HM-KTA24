/**
 * Part I — Flat tests (no POM)
 * Test suite: Search for Books by Keywords
 *
 * Rules:
 *   - Use only: getByRole, getByText, getByPlaceholder, getByLabel
 *   - No CSS class selectors, no XPath
 *
 * Tip: run `npx playwright codegen https://www.kriso.ee` to discover selectors.
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

let page: Page;

// Previous tests - didn't meet the criteria of the rules
/* test.describe('Search for Books by Keywords', () => {

    test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();
  
      await page.goto('https://www.kriso.ee/');
      await page.getByRole('button', { name: 'Nõustun' }).click();
    });
  
    test.afterAll(async () => {
      await page.context().close();
    });

    test('Test logo is visible', async () => {
      const logo = page.locator('.logo-icon');
      await expect(logo).toBeVisible();
    }); 

  test('Test no products found', async () => {
    await page.locator('#top-search-text').click();
    await page.locator('#top-search-text').fill('jaslkfjalskjdkls');
    await page.locator('#top-search-btn-wrap').click();

    await expect(page.locator('.msg.msg-info')).toContainText('Teie poolt sisestatud märksõnale vastavat raamatut ei leitud. Palun proovige uuesti!');
  });

    test('Test search results contain keyword', async () => {
    await page.locator('#top-search-text').click();
    await page.locator('#top-search-text').fill('tolkien');
    await page.locator('#top-search-btn-wrap').click();

    //TODO check results contain keyword
  });

    test('Test search by ISBN', async () => {
    await page.locator('#top-search-text').click();
    await page.locator('#top-search-text').fill('9780307588371');
    await page.locator('#top-search-btn-wrap').click();

    //TODO check correct book is shown
  });

}); */

async function acceptCookiesIfVisible(page: Page) {
  const acceptButton = page.getByRole('button', { name: 'Nõustun' });

  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

async function searchByKeyword(page: Page, keyword: string) {
  const searchInput = page.getByRole('textbox', {
    name: /Pealkiri, autor, ISBN, märksõ/i,
  });

  await searchInput.click();
  await searchInput.fill(keyword);
  await page.getByRole('button', { name: 'Search' }).click();
}

test.describe('Search for Books by Keywords', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      locale: 'et-EE',
      timezoneId: 'Europe/Tallinn',
      extraHTTPHeaders: {
        'Accept-Language': 'et-EE,et;q=0.9,en;q=0.8',
      },
    });
    page = await context.newPage();

    await page.goto('https://www.kriso.ee/');
    await acceptCookiesIfVisible(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  // Title check
  test('Test page has Kriso title', async () => {
    await expect(page).toHaveTitle(/Kriso|Krisostomus/i);
  });

  // Invalid keyword seach check
  test('Test no products found', async () => {
    await searchByKeyword(page, 'xqzwmfkj');

    await expect(
      page.getByText(/Teie poolt sisestatud märksõnale vastavat raamatut ei leitud/i)
    ).toBeVisible();
  });

  // Tolkien as search keywork check
  test('Test search results contain keyword', async () => {
    await searchByKeyword(page, 'tolkien');

    const addToCartLinks = page.getByRole('link', { name: 'Lisa ostukorvi' });
    await expect(addToCartLinks.first()).toBeVisible();

    const resultCount = await addToCartLinks.count();
    expect(resultCount).toBeGreaterThan(1);

    const tolkienTextCount = await page.getByText(/tolkien/i).count();
    expect(tolkienTextCount).toBeGreaterThan(1);
  });

  // Search Gone Girl book by ISBN
  test('Test search by ISBN', async () => {
    await searchByKeyword(page, '9780307588371');

    await expect(page.getByText(/Gone Girl/i).first()).toBeVisible();
  });
});