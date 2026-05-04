import { Page, expect } from '@playwright/test';

export class BasePage {
  constructor(protected readonly page: Page) {}

  async acceptCookiesIfVisible() {
    const consentButton = this.page.getByRole('button', { name: 'Nõustun' });

    if (await consentButton.isVisible().catch(() => false)) {
      await consentButton.click();
    }
  }

  async verifyPageHasKrisoTitle() {
    await expect(this.page).toHaveTitle(/Kriso|Krisostomus/i);
  }

  async searchByKeyword(keyword: string) {
    const searchInput = this.page.getByRole('textbox', {
      name: /Pealkiri, autor, ISBN, märksõ/i,
    });

    await searchInput.click();
    await searchInput.fill(keyword);
    await this.page.getByRole('button', { name: 'Search' }).click();
  }
}