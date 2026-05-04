import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  private normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }

  private getPricesFromText(text: string): number[] {
    return (text.match(/\d+[,.]\d{2}\s*€/g) || [])
      .map((priceText) =>
        Number(priceText.replace('€', '').replace(',', '.').trim())
      )
      .filter((price) => !Number.isNaN(price));
  }

  private getSubtotalFromCartRow(rowText: string): number {
    const prices = this.getPricesFromText(rowText);

    if (prices.length === 0) {
      throw new Error(`No price found in cart row: ${rowText}`);
    }

    return prices[prices.length - 1];
  }

  async getCartProductRows(): Promise<string[]> {
    const rows = await this.page.getByRole('row').allTextContents();

    return rows
      .map((row) => this.normalizeText(row))
      .filter((row) =>
        row.includes('€') &&
        !/isbn|pealkiri|kogus|hind|summa|eemalda|kokku|transport|total/i.test(row)
      );
  }

  async verifyCartItemCount(expectedCount: number) {
    const cartRows = await this.getCartProductRows();

    expect(cartRows.length).toBe(expectedCount);
  }

  async getFirstCartItemText(): Promise<string> {
    const cartRows = await this.getCartProductRows();

    expect(cartRows.length).toBeGreaterThan(0);

    return cartRows[0];
  }

  async getSecondCartItemText(firstCartItemText: string): Promise<string> {
    const cartRows = await this.getCartProductRows();

    const secondItem = cartRows.find((row) => row !== firstCartItemText) || '';

    expect(secondItem).not.toBe('');

    return secondItem;
  }

  async verifyCartContainsItem(itemText: string) {
    const cartRows = await this.getCartProductRows();

    expect(cartRows).toContain(itemText);
  }

  async verifyCartDoesNotContainItem(itemText: string) {
    const cartRows = await this.getCartProductRows();

    expect(cartRows).not.toContain(itemText);
  }

  async getCartRowsSubtotal(): Promise<number> {
    const cartRows = await this.getCartProductRows();

    return cartRows.reduce((sum, row) => {
      return sum + this.getSubtotalFromCartRow(row);
    }, 0);
  }

  async removeFirstItem() {
    const firstProductRow = this.page.getByRole('row').nth(1);
    const removeLinkInsideRow = firstProductRow.getByRole('link', { name: '' });

    if (await removeLinkInsideRow.isVisible().catch(() => false)) {
      await removeLinkInsideRow.click();
      return;
    }

    await this.page.getByRole('cell').nth(5).getByRole('link', { name: '' }).click();
  }
}