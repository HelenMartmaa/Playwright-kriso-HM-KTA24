/**
 * Part I — Flat tests (no POM)
 * Test suite: Add Books to Shopping Cart
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

let firstCartItemText = '';
let secondCartItemText = '';

let basketTotalWithOneItem = 0;
let basketTotalWithTwoItems = 0;

async function acceptCookiesIfVisible(page: Page) {
  const acceptButton = page.getByRole('button', { name: 'Nõustun' });

  if (await acceptButton.isVisible().catch(() => false)) {
    await acceptButton.click();
  }
}

async function searchByKeyword(page: Page, keyword: string) {
  const searchInput = page.getByRole('textbox', {
    name: 'Pealkiri, autor, ISBN, märksõ',
  });

  await searchInput.click();
  await searchInput.fill(keyword);
  await page.getByRole('button', { name: 'Search' }).click();
}

async function returnToSearchResults(page: Page) {
  await page.goto('https://www.kriso.ee/');
  await searchByKeyword(page, 'tolkien');

  const addToCartLinks = page.getByRole('link', { name: 'Lisa ostukorvi' });
  await expect(addToCartLinks.nth(1)).toBeVisible();
}

async function clickGoToCart(page: Page) {
  await page.getByRole('link', { name: /Mine ostukorvi/i }).click();
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function getPricesFromText(text: string): number[] {
  return (text.match(/\d+[,.]\d{2}\s*€/g) || [])
    .map((priceText) =>
      Number(priceText.replace('€', '').replace(',', '.').trim())
    )
    .filter((price) => !Number.isNaN(price));
}

function getSubtotalFromCartRow(rowText: string): number {
  const prices = getPricesFromText(rowText);

  if (prices.length === 0) {
    throw new Error(`No price found in cart row: ${rowText}`);
  }

  // Cart row usually contains item price and subtotal.
  // The last price in the row is the subtotal.
  return prices[prices.length - 1];
}

async function getCartProductRows(page: Page): Promise<string[]> {
  const rows = await page.getByRole('row').allTextContents();

  return rows
    .map(normalizeText)
    .filter((row) =>
      row.includes('€') &&
      !/isbn|pealkiri|kogus|hind|summa|eemalda|kokku|transport|total/i.test(row)
    );
}

async function getCartRowsSubtotal(page: Page): Promise<number> {
  const cartRows = await getCartProductRows(page);

  return cartRows.reduce((sum, row) => {
    return sum + getSubtotalFromCartRow(row);
  }, 0);
}

// The remove icon is an empty-name link inside the cart table cell.
// It has no visible text, so role-based location is used instead of CSS selector.
async function removeFirstCartItem(page: Page) {
  await page.getByRole('cell').nth(5).getByRole('link', { name: '' }).click();
}

test.describe('Add Books to Shopping Cart', () => {
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

  test('Test search by keyword and confirm multiple results', async () => {
    await searchByKeyword(page, 'tolkien');

    const addToCartLinks = page.getByRole('link', { name: 'Lisa ostukorvi' });
    await expect(addToCartLinks.first()).toBeVisible();

    const resultCount = await addToCartLinks.count();
    expect(resultCount).toBeGreaterThan(1);
  });

  test('Test add first book to cart and confirm cart contains 1 item', async () => {
    await page.getByRole('link', { name: 'Lisa ostukorvi' }).first().click();

    await expect(page.getByText('Toode lisati ostukorvi')).toBeVisible();

    await clickGoToCart(page);

    await expect(page).toHaveURL(/basket/i);

    const cartRows = await getCartProductRows(page);

    expect(cartRows.length).toBe(1);

    firstCartItemText = cartRows[0];

    expect(firstCartItemText).not.toBe('');
    expect(firstCartItemText).toContain('€');

    basketTotalWithOneItem = await getCartRowsSubtotal(page);

    expect(basketTotalWithOneItem).toBeGreaterThan(0);

    await returnToSearchResults(page);
  });

  test('Test add second book to cart', async () => {
    const addToCartLinks = page.getByRole('link', { name: 'Lisa ostukorvi' });

    await expect(addToCartLinks.nth(1)).toBeVisible();

    await addToCartLinks.nth(1).click();

    await expect(page.getByText('Toode lisati ostukorvi')).toBeVisible();
  });

  test('Test cart contains 2 items and total price is accurate', async () => {
    await clickGoToCart(page);

    await expect(page).toHaveURL(/basket/i);

    const cartRows = await getCartProductRows(page);

    expect(cartRows.length).toBe(2);
    expect(cartRows).toContain(firstCartItemText);

    secondCartItemText = cartRows.find((row) => row !== firstCartItemText) || '';

    expect(secondCartItemText).not.toBe('');
    expect(secondCartItemText).toContain('€');

    basketTotalWithTwoItems = await getCartRowsSubtotal(page);

    expect(basketTotalWithTwoItems).toBeGreaterThan(basketTotalWithOneItem);
  });

  test('Test remove first item from cart and total updates', async () => {
    await removeFirstCartItem(page);

    const cartRows = await getCartProductRows(page);

    expect(cartRows.length).toBe(1);
    expect(cartRows).not.toContain(firstCartItemText);
    expect(cartRows).toContain(secondCartItemText);

    const basketTotalAfterRemovingItem = await getCartRowsSubtotal(page);

    expect(basketTotalAfterRemovingItem).toBeGreaterThan(0);
    expect(basketTotalAfterRemovingItem).toBeLessThan(basketTotalWithTwoItems);
  });
});