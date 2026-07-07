// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * Garage panel — where a user lands after a successful registration/login.
 */
export class GaragePage extends BasePage {
    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        super(page);
        this.heading = page.getByRole('heading', { name: 'Garage' });
        this.logoutButton = page.getByText('Log out');
    }

    /** Assert we are on the garage page. */
    async expectLoaded() {
        await expect(this.page).toHaveURL(/\/panel\/garage/);
        await expect(this.heading).toBeVisible();
    }

    /** Assert we did NOT reach the garage (e.g. after a failed registration). */
    async expectNotLoaded() {
        await expect(this.page).not.toHaveURL(/\/panel\/garage/);
    }

    async logout() {
        await this.logoutButton.click();
    }
}
