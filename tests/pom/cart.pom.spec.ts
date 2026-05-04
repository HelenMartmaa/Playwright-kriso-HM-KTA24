/**
 * Part II — Page Object Model tests
 * Test suite: Add Books to Shopping Cart
 *
 * Rules:
 *   - No raw selectors in test files — all locators live in page classes
 *   - Use only: getByRole, getByText, getByPlaceholder, getByLabel
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';
import { CartPage } from '../../pages/CartPage';

test.describe.configure({ mode: 'serial' });

let page: Page;
let homePage: HomePage;
let cartPage: CartPage;

let firstCartItemText = '';
let secondCartItemText = '';

let basketTotalWithOneItem = 0;
let basketTotalWithTwoItems = 0;

test.describe('Add Books to Shopping Cart (POM)', () => {
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

  test('Test search by keyword and confirm multiple results', async () => {
    await homePage.searchByKeyword('tolkien');
    await homePage.verifyMultipleProductsCanBeAddedToCart();
  });

  test('Test add first book to cart and confirm cart contains 1 item', async () => {
    await homePage.addToCartByIndex(0);
    await homePage.verifyAddToCartMessage();

    cartPage = await homePage.openCartFromAddToCartMessage();

    await cartPage.verifyCartItemCount(1);

    firstCartItemText = await cartPage.getFirstCartItemText();

    expect(firstCartItemText).not.toBe('');
    expect(firstCartItemText).toContain('€');

    basketTotalWithOneItem = await cartPage.getCartRowsSubtotal();

    expect(basketTotalWithOneItem).toBeGreaterThan(0);

    await homePage.returnToSearchResults('tolkien');
  });

  test('Test add second book to cart', async () => {
    await homePage.addToCartByIndex(1);
    await homePage.verifyAddToCartMessage();
  });

  test('Test cart contains 2 items and total price is accurate', async () => {
    cartPage = await homePage.openCartFromAddToCartMessage();

    await cartPage.verifyCartItemCount(2);
    await cartPage.verifyCartContainsItem(firstCartItemText);

    secondCartItemText = await cartPage.getSecondCartItemText(firstCartItemText);

    expect(secondCartItemText).not.toBe('');
    expect(secondCartItemText).toContain('€');

    basketTotalWithTwoItems = await cartPage.getCartRowsSubtotal();

    expect(basketTotalWithTwoItems).toBeGreaterThan(basketTotalWithOneItem);
  });

  test('Test remove first item from cart and total updates', async () => {
    await cartPage.removeFirstItem();

    await cartPage.verifyCartItemCount(1);
    await cartPage.verifyCartDoesNotContainItem(firstCartItemText);
    await cartPage.verifyCartContainsItem(secondCartItemText);

    const basketTotalAfterRemovingItem = await cartPage.getCartRowsSubtotal();

    expect(basketTotalAfterRemovingItem).toBeGreaterThan(0);
    expect(basketTotalAfterRemovingItem).toBeLessThan(basketTotalWithTwoItems);
  });
});