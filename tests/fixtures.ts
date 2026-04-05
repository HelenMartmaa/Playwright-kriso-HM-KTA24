import { test as base } from '@playwright/test';
import { HomePage }    from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage }    from '../pages/CartPage';

/**
 * Custom fixtures that inject page objects into tests automatically.
 * Import `test` from this file instead of '@playwright/test'.
 *
 * Usage:
 *   import { test } from './fixtures';
 *   import { expect } from '@playwright/test';
 *
 *   test('my test', async ({ home, product, cart }) => { ... });
 */
export const test = base.extend<{
  home:    HomePage;
  product: ProductPage;
  cart:    CartPage;
}>({
  home:    async ({ page }, use) => { await use(new HomePage(page)); },
  product: async ({ page }, use) => { await use(new ProductPage(page)); },
  cart:    async ({ page }, use) => { await use(new CartPage(page)); },
});
