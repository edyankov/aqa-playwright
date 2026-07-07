// @ts-check
import { BasePage } from './base.page';
import { SignupModal } from './signup-modal.page';

/**
 * qauto landing page.
 */
export class HomePage extends BasePage {
    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        super(page);
        this.signUpButton = page.getByRole('button', { name: 'Sign up' });
    }

    async open() {
        await super.open('/');
    }

    /**
     * Open the registration modal and return its Page Object.
     * @returns {Promise<SignupModal>}
     */
    async openSignup() {
        await this.signUpButton.click();
        const modal = new SignupModal(this.page);
        await modal.expectVisible();
        return modal;
    }
}
