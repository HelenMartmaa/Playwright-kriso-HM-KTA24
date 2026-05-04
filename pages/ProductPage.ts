import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async getResultsCount(): Promise<number> {
    const resultsText = await this.page
      .getByText(/Otsingu vasteid leitud:\s*\d+/)
      .first()
      .textContent();

    return Number((resultsText || '').replace(/\D/g, '')) || 0;
  }

  async verifyResultsCountMoreThan(minCount: number) {
    const count = await this.getResultsCount();

    expect(count).toBeGreaterThan(minCount);
  }

  async applyEnglishLanguageFilter() {
    await this.page.getByRole('link', { name: /Inglise\s*\(\d+\)/ }).first().click();

    await expect(this.page.getByText('Keel: Inglise').first()).toBeVisible();
    await expect(
      this.page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()
    ).toBeVisible();
  }

  async applyCdFormatFilter() {
    await this.page.getByRole('link', { name: /CD\s*\(\d+\)/ }).first().click();

    await expect(this.page.getByText(/Formaat:\s*CD/i).first()).toBeVisible();
    await expect(
      this.page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()
    ).toBeVisible();
  }

  private async removeFilterByText(filterText: string | RegExp) {
    const activeFilter = this.page.getByText(filterText).first();

    await expect(activeFilter).toBeVisible();

    await activeFilter.getByRole('link').first().click();

    await expect(activeFilter).not.toBeVisible();
    await expect(
      this.page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()
    ).toBeVisible();
  }

  async removeCdAndEnglishFilters() {
    await this.removeFilterByText(/Formaat:\s*CD/i);
    await this.removeFilterByText('Keel: Inglise');
  }
}