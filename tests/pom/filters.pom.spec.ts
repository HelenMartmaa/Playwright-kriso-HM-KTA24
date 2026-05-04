/**
 * Part II — Page Object Model tests
 * Test suite: Navigate Products via Filters
 *
 * Rules:
 *   - No raw selectors in test files — all locators live in page classes
 *   - Use only: getByRole, getByText, getByPlaceholder, getByLabel
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { ProductPage } from '../../pages/ProductPage';

test.describe.configure({ mode: 'serial' });

let page: Page;
let homePage: HomePage;
let productPage: ProductPage;

let initialProductCount = 0;
let languageFilteredProductCount = 0;
let formatFilteredProductCount = 0;

test.describe('Navigate Products via Filters (POM)', () => {
  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();

    homePage = new HomePage(page);

    await homePage.openUrl();
    await homePage.acceptCookiesIfVisible();
  });

  test.afterAll(async () => {
    await page.close().catch(() => {});
  });

  test('Test page has Kriso title', async () => {
    await homePage.verifyPageHasKrisoTitle();
  });

  test('Test music books section is visible and Kitarr category can be opened', async () => {
    productPage = await homePage.openGuitarCategory();

    initialProductCount = await productPage.getResultsCount();

    expect(initialProductCount).toBeGreaterThan(1);
  });

  test('Test language filter can be applied', async () => {
    await productPage.applyEnglishLanguageFilter();

    languageFilteredProductCount = await productPage.getResultsCount();

    expect(languageFilteredProductCount).toBeGreaterThan(0);
    expect(languageFilteredProductCount).toBeLessThan(initialProductCount);
  });

  test('Test CD format filter can be applied', async () => {
    await productPage.applyCdFormatFilter();

    formatFilteredProductCount = await productPage.getResultsCount();

    expect(formatFilteredProductCount).toBeGreaterThan(0);
    expect(formatFilteredProductCount).toBeLessThan(languageFilteredProductCount);
  });

  test('Test active filters can be removed and product count goes up', async () => {
    await productPage.removeCdAndEnglishFilters();

    const countAfterRemovingFilters = await productPage.getResultsCount();

    expect(countAfterRemovingFilters).toBeGreaterThan(formatFilteredProductCount);
    expect(countAfterRemovingFilters).toBe(initialProductCount);
  });
});