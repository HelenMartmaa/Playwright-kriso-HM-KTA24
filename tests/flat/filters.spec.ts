/**
 * Part I — Flat tests (no POM)
 * Test suite: Navigate Products via Filters
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

let initialProductCount = 0;
let languageFilteredProductCount = 0;
let formatFilteredProductCount = 0;

async function acceptCookiesIfVisible(page: Page) {
  const acceptButton = page.getByRole('button', { name: 'Nõustun' });

  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

async function getResultsCount(page: Page): Promise<number> {
  const resultsText = await page
    .getByText(/Otsingu vasteid leitud:\s*\d+/)
    .first()
    .textContent();

  return Number((resultsText || '').replace(/\D/g, '')) || 0;
}

async function openGuitarCategory(page: Page) {
  await page.getByRole('link', { name: 'Muusikaraamatud ja noodid' }).click();
  await page.getByRole('link', { name: 'Kitarr' }).click();

  await expect(page).toHaveURL(/instrument=Guitar/i);
  await expect(page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()).toBeVisible();
}

async function applyEnglishLanguageFilter(page: Page) {
  await page.getByRole('link', { name: /Inglise\s*\(\d+\)/ }).click();

  await expect(page.getByText('Keel: Inglise').first()).toBeVisible();
  await expect(page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()).toBeVisible();
}

async function applyCdFormatFilter(page: Page) {
  await page.getByRole('link', { name: /CD\s*\(\d+\)/ }).click();

  await expect(page.getByText(/Formaat:\s*CD/i).first()).toBeVisible();
  await expect(page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()).toBeVisible();
}

async function removeFilterByText(page: Page, filterText: string | RegExp) {
  const activeFilter = page.getByText(filterText).first();

  await expect(activeFilter).toBeVisible();

  // The active filter remove icon is inside the active filter item.
  // It usually has no visible text, so we click the empty-name link inside it.
  await activeFilter.getByRole('link', { name: '' }).click();

  await expect(activeFilter).not.toBeVisible();
  await expect(page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()).toBeVisible();
}

async function removeCdAndEnglishFilters(page: Page) {
  await removeFilterByText(page, /Formaat:\s*CD/i);
  await removeFilterByText(page, 'Keel: Inglise');
}

test.describe('Navigate Products via Filters', () => {
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

  test('Test page has Kriso title', async () => {
    await expect(page).toHaveTitle(/Kriso|Krisostomus/i);
  });

  test('Test music books section is visible and Kitarr category can be opened', async () => {
    await expect(
      page.getByRole('link', { name: 'Muusikaraamatud ja noodid' })
    ).toBeVisible();

    await openGuitarCategory(page);

    initialProductCount = await getResultsCount(page);

    expect(initialProductCount).toBeGreaterThan(1);
  });

  test('Test language filter can be applied', async () => {
    await applyEnglishLanguageFilter(page);

    languageFilteredProductCount = await getResultsCount(page);

    expect(languageFilteredProductCount).toBeGreaterThan(0);
    expect(languageFilteredProductCount).toBeLessThan(initialProductCount);
  });

  test('Test CD format filter can be applied', async () => {
    await applyCdFormatFilter(page);

    formatFilteredProductCount = await getResultsCount(page);

    expect(formatFilteredProductCount).toBeGreaterThan(0);
    expect(formatFilteredProductCount).toBeLessThan(languageFilteredProductCount);
  });

  test('Test active filters can be removed and product count goes up', async () => {
    await removeCdAndEnglishFilters(page);

    const countAfterRemovingFilters = await getResultsCount(page);

    expect(countAfterRemovingFilters).toBeGreaterThan(formatFilteredProductCount);
    expect(countAfterRemovingFilters).toBe(initialProductCount);
  });
});