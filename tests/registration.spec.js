// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Registration form tests for https://qauto.forstudy.space/
 * baseURL and basic auth (guest / welcome2qauto) are set in playwright.config.js,
 * so tests navigate with page.goto('/').
 *
 * REQUIREMENT: every user we create uses the "edy-" email prefix so that
 * auto-test users can be told apart from real ones in the shared database.
 *
 * Selectors and behaviours below are the ones verified live on this exact form:
 * field ids (#signupName, ...), error container .invalid-feedback inside .form-group,
 * modal container .modal-content, logout text "Log out", success URL /panel/garage.
 * Note: the site does NOT trim spaces and requires a field to be touched + dirty
 * before the "required" error appears (a plain focus/blur is not enough).
 */

const EMAIL_PREFIX = 'edy-';

// Unique, prefixed email for positive / duplicate scenarios
const uniqueEmail = () => `${EMAIL_PREFIX}${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;

const VALID = {
    name: 'AqaName',
    lastName: 'AqaLastname',
    password: 'Password1',
};

const PW_ERROR =
    'Password has to be from 8 to 15 characters long and contain at least one integer, one capital, and one small letter';

// Field locators inside the registration modal
function getFields(page) {
    return {
        name: page.locator('#signupName'),
        lastName: page.locator('#signupLastName'),
        email: page.locator('#signupEmail'),
        password: page.locator('#signupPassword'),
        repeatPassword: page.locator('#signupRepeatPassword'),
        registerBtn: page.locator('.modal-content').getByRole('button', { name: 'Register' }),
    };
}

// The .invalid-feedback error that belongs to a specific field (scoped to its .form-group)
function fieldError(page, fieldSelector) {
    return page
        .locator('.form-group', { has: page.locator(fieldSelector) })
        .locator('.invalid-feedback');
}

// Open the Registration modal from the landing page
async function openRegistration(page) {
    await page.goto('/');
    await page.getByRole('button', { name: 'Sign up' }).click();
    await expect(page.locator('.modal-content')).toBeVisible();
    await expect(page.locator('.modal-content h4')).toContainText('Registration');
}

// Make a field "touched + dirty" without leaving a value, so the required error shows.
// (Plain focus/blur does NOT trigger it — the field must become dirty first.)
async function triggerEmpty(field) {
    await field.fill('a');
    await field.fill('');
    await field.blur();
}

// Fill all fields; pass overrides to break a single one
async function fillForm(fields, data) {
    await fields.name.fill(data.name);
    await fields.lastName.fill(data.lastName);
    await fields.email.fill(data.email);
    await fields.password.fill(data.password);
    await fields.repeatPassword.fill(data.repeatPassword);
}

test.describe('Registration form', () => {
    test.beforeEach(async ({ page }) => {
        await openRegistration(page);
    });

    // ---------- POSITIVE ----------

    test('Positive: user can register with valid data', async ({ page }) => {
        const fields = getFields(page);

        await fillForm(fields, { ...VALID, email: uniqueEmail(), repeatPassword: VALID.password });

        await expect(fields.registerBtn).toBeEnabled();
        await fields.registerBtn.click();

        // Successful registration lands the user in their garage
        await expect(page).toHaveURL(/\/panel\/garage/);
        await expect(page.getByRole('heading', { name: 'Garage' })).toBeVisible();
    });

    // ---------- NEGATIVE ----------

    test('Negative: empty required fields show validation messages', async ({ page }) => {
        const fields = getFields(page);

        for (const field of [
            fields.name,
            fields.lastName,
            fields.email,
            fields.password,
            fields.repeatPassword,
        ]) {
            await triggerEmpty(field);
        }

        await expect(fieldError(page, '#signupName')).toHaveText('Name required');
        await expect(fieldError(page, '#signupLastName')).toHaveText('Last name required');
        await expect(fieldError(page, '#signupEmail')).toHaveText('Email required');
        await expect(fieldError(page, '#signupPassword')).toHaveText('Password required');
        await expect(fieldError(page, '#signupRepeatPassword')).toHaveText(
            'Re-enter password required'
        );
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: name shorter than 2 characters is rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.name.fill('A');
        await fields.name.blur();

        await expect(fieldError(page, '#signupName')).toHaveText(
            'Name has to be from 2 to 20 characters long'
        );
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: name longer than 20 characters is rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.name.fill('A'.repeat(21));
        await fields.name.blur();

        await expect(fieldError(page, '#signupName')).toHaveText(
            'Name has to be from 2 to 20 characters long'
        );
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: name with digits shows "Name is invalid"', async ({ page }) => {
        const fields = getFields(page);

        await fields.name.fill('John123');
        await fields.name.blur();

        await expect(fieldError(page, '#signupName')).toHaveText('Name is invalid');
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: invalid email format is rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.email.fill('edy-invalid-email');
        await fields.email.blur();

        await expect(fieldError(page, '#signupEmail')).toHaveText('Email is incorrect');
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: too short password is rejected', async ({ page }) => {
        const fields = getFields(page);

        // "123" — too short and has no letters
        await fields.password.fill('123');
        await fields.password.blur();

        await expect(fieldError(page, '#signupPassword')).toHaveText(PW_ERROR);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: password without a capital letter is rejected', async ({ page }) => {
        const fields = getFields(page);

        // 9 chars, has digit + lowercase, but no uppercase
        await fields.password.fill('password1');
        await fields.password.blur();

        await expect(fieldError(page, '#signupPassword')).toHaveText(PW_ERROR);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: mismatched passwords are rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.password.fill('Password1');
        await fields.repeatPassword.fill('Password2');
        await fields.repeatPassword.blur();

        await expect(fieldError(page, '#signupRepeatPassword')).toHaveText('Passwords do not match');
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: registering an already existing email is rejected', async ({ page }) => {
        const fields = getFields(page);

        // Register a fresh user first...
        const email = uniqueEmail();
        await fillForm(fields, { ...VALID, email, repeatPassword: VALID.password });
        await fields.registerBtn.click();
        await expect(page).toHaveURL(/\/panel\/garage/);

        // ...log out and try to register with the same email again
        await page.getByText('Log out').click();
        await page.getByRole('button', { name: 'Sign up' }).click();
        await expect(page.locator('.modal-content')).toBeVisible();

        const fields2 = getFields(page);
        await fillForm(fields2, { ...VALID, email, repeatPassword: VALID.password });
        await fields2.registerBtn.click();

        // Server rejects the duplicate; we stay off the garage page
        await expect(page.getByText(/already exists/i)).toBeVisible();
        await expect(page).not.toHaveURL(/\/panel\/garage/);
    });
});
