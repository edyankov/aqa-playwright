// @ts-check
import { expect } from '@playwright/test';
import { BasePage } from './base.page';
import { RED_BORDER } from '../data/registration.data';

/**
 * Registration modal. Encapsulates every field locator, the Register button,
 * the error locators and all field-level actions/assertions.
 *
 * Selectors and behaviours are the ones verified live on this exact form.
 */
export class SignupModal extends BasePage {
    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        super(page);

        this.container = page.locator('.modal-content');
        this.nameInput = page.locator('#signupName');
        this.lastNameInput = page.locator('#signupLastName');
        this.emailInput = page.locator('#signupEmail');
        this.passwordInput = page.locator('#signupPassword');
        this.repeatPasswordInput = page.locator('#signupRepeatPassword');
        this.registerButton = this.container.getByRole('button', { name: 'Register' });
    }

    /** Map "field name -> locator" for loops (e.g. the all-empty test). */
    get fields() {
        return {
            name: this.nameInput,
            lastName: this.lastNameInput,
            email: this.emailInput,
            password: this.passwordInput,
            repeatPassword: this.repeatPasswordInput,
        };
    }

    async expectVisible() {
        await expect(this.container).toBeVisible();
        await expect(this.container.locator('h4')).toContainText('Registration');
    }

    /**
     * The .invalid-feedback error scoped to a specific field's .form-group.
     * Scoping avoids substring collisions (e.g. "Name required" vs "Last name required").
     * @param {import('@playwright/test').Locator} fieldLocator
     */
    fieldError(fieldLocator) {
        return this.page
            .locator('.form-group', { has: fieldLocator })
            .locator('.invalid-feedback');
    }

    // ---- actions ----

    /**
     * Make a field touched + dirty without leaving a value, so the "required"
     * error appears (a plain focus/blur is NOT enough on this form).
     * @param {import('@playwright/test').Locator} fieldLocator
     */
    async triggerEmpty(fieldLocator) {
        await fieldLocator.fill('a');
        await fieldLocator.fill('');
        await fieldLocator.blur();
    }

    async fillName(value) {
        await this.nameInput.fill(value);
        await this.nameInput.blur();
    }

    async fillLastName(value) {
        await this.lastNameInput.fill(value);
        await this.lastNameInput.blur();
    }

    async fillEmail(value) {
        await this.emailInput.fill(value);
        await this.emailInput.blur();
    }

    async fillPassword(value) {
        await this.passwordInput.fill(value);
        await this.passwordInput.blur();
    }

    async fillRepeatPassword(value) {
        await this.repeatPasswordInput.fill(value);
        await this.repeatPasswordInput.blur();
    }

    /**
     * Fill the whole form (no blur between fields).
     * @param {{name:string,lastName:string,email:string,password:string,repeatPassword:string}} data
     */
    async fill(data) {
        await this.nameInput.fill(data.name);
        await this.lastNameInput.fill(data.lastName);
        await this.emailInput.fill(data.email);
        await this.passwordInput.fill(data.password);
        await this.repeatPasswordInput.fill(data.repeatPassword);
    }

    async submit() {
        await this.registerButton.click();
    }

    /**
     * Fill the form and submit.
     * @param {{name:string,lastName:string,email:string,password:string,repeatPassword:string}} data
     */
    async register(data) {
        await this.fill(data);
        await this.submit();
    }

    // ---- assertions ----

    /**
     * @param {import('@playwright/test').Locator} fieldLocator
     * @param {string} text
     */
    async expectFieldError(fieldLocator, text) {
        await expect(this.fieldError(fieldLocator)).toHaveText(text);
    }

    /** @param {import('@playwright/test').Locator} fieldLocator */
    async expectRedBorder(fieldLocator) {
        await expect(fieldLocator).toHaveCSS('border-color', RED_BORDER);
    }

    /** @param {import('@playwright/test').Locator} fieldLocator */
    async expectInvalid(fieldLocator) {
        await expect(fieldLocator).toHaveClass(/is-invalid/);
    }

    async expectRegisterDisabled() {
        await expect(this.registerButton).toBeDisabled();
    }

    async expectRegisterEnabled() {
        await expect(this.registerButton).toBeEnabled();
    }

    /** Server-side "user already exists" error (matched by text, not by class). */
    async expectUserExists() {
        await expect(this.page.getByText(/already exists/i)).toBeVisible();
    }
}
