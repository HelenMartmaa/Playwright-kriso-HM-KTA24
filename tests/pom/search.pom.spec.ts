/**
 * Part II — Page Object Model tests
 * Test suite: Search for Books by Keywords
 *
 * Rules:
 *   - No raw selectors in test files — all locators live in page classes
 *   - Use only: getByRole, getByText, getByPlaceholder, getByLabel
 */
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { HomePage } from '../../pages/HomePage';

let page: Page;
let homePage: HomePage;

test.describe('Search for Books by Keywords (POM)', () => {

  test.beforeAll(async ({ browser }) => {
      const context = await browser.newContext();
      page = await context.newPage();
  
      homePage = new HomePage(page);
  
      await homePage.openUrl();
      await homePage.acceptCookies();
    });
  
    test.afterAll(async () => {
      await page.context().close();
    });
  
    test('Test logo is visible', async () => {
      await homePage.verifyLogo();
    }); 

});
