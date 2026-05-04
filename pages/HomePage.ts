import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartPage } from './CartPage';
import { ProductPage } from './ProductPage';

export class HomePage extends BasePage {
  private readonly url = 'https://www.kriso.ee/';

  constructor(page: Page) {
    super(page);
  }

  async openUrl() {
    await this.page.goto(this.url);
  }

  async verifyNoProductsFoundMessage() {
    await expect(
      this.page.getByText(
        'Teie poolt sisestatud märksõnale vastavat raamatut ei leitud. Palun proovige uuesti!'
      )
    ).toBeVisible();
  }

  async getResultsCount(): Promise<number> {
    const resultsText = await this.page
      .getByText(/Otsingu vasteid leitud:\s*\d+/)
      .first()
      .textContent();

    return Number((resultsText || '').replace(/\D/g, '')) || 0;
  }

  async verifyResultsCountMoreThan(minCount: number) {
    await expect(
      this.page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()
    ).toBeVisible();

    const total = await this.getResultsCount();

    expect(total).toBeGreaterThan(minCount);
  }

  async verifySearchResultsContainKeyword(keyword: string) {
    const keywordResults = this.page.getByText(new RegExp(keyword, 'i'));

    await expect(keywordResults.first()).toBeVisible();

    const count = await keywordResults.count();
    expect(count).toBeGreaterThan(1);
  }

  async verifyBookIsShown(bookTitle: string) {
    await expect(this.page.getByText(new RegExp(bookTitle, 'i')).first()).toBeVisible();
  }

  async verifyMultipleProductsCanBeAddedToCart() {
    const addToCartLinks = this.page.getByRole('link', { name: 'Lisa ostukorvi' });

    await expect(addToCartLinks.first()).toBeVisible();

    const count = await addToCartLinks.count();
    expect(count).toBeGreaterThan(1);
  }

  async addToCartByIndex(index: number) {
    await this.page.getByRole('link', { name: 'Lisa ostukorvi' }).nth(index).click();
  }

  async verifyAddToCartMessage() {
    await expect(this.page.getByText('Toode lisati ostukorvi')).toBeVisible();
  }

  async openCartFromAddToCartMessage(): Promise<CartPage> {
    await this.page.getByRole('link', { name: /Mine ostukorvi/i }).click();

    await expect(this.page).toHaveURL(/basket/i);

    return new CartPage(this.page);
  }

  async returnToSearchResults(keyword: string) {
    await this.openUrl();
    await this.searchByKeyword(keyword);

    await expect(
      this.page.getByRole('link', { name: 'Lisa ostukorvi' }).nth(1)
    ).toBeVisible();
  }

  async openGuitarCategory(): Promise<ProductPage> {
    const musicSection = this.page
      .getByRole('link', { name: 'Muusikaraamatud ja noodid' })
      .first();

    await expect(musicSection).toBeVisible();

    const guitarLink = this.page.getByRole('link', { name: 'Kitarr' }).first();

    if (!(await guitarLink.isVisible().catch(() => false))) {
      await musicSection.click();
    }

    await expect(guitarLink).toBeVisible();
    await guitarLink.click();

    await expect(this.page).toHaveURL(/instrument=Guitar/i);
    await expect(
      this.page.getByText(/Otsingu vasteid leitud:\s*\d+/).first()
    ).toBeVisible();

    return new ProductPage(this.page);
  }
}