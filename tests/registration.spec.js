// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Registration form tests for https://qauto.forstudy.space/
 * baseURL and basic auth (guest / welcome2qauto) are set in playwright.config.js,
 * so tests navigate with page.goto('/').
 *
 * Coverage follows the official requirements table (Name, Last name, Email,
 * Password, Re-enter password, Register button), including the red border check
 * and the "Register disabled while data is invalid" acceptance criterion.
 *
 * REQUIREMENT: every user we create uses the "edy-" email prefix so that
 * auto-test users can be told apart from real ones in the shared database.
 *
 * Verified live on this exact form: field ids (#signupName, ...),
 * error container .invalid-feedback inside .form-group, red border rgb(220, 53, 69),
 * modal container .modal-content, logout text "Log out", success URL /panel/garage.
 *
 * NOTE on the required-error trigger: a field must be touched + dirty before the
 * "... required" error appears — a plain focus/blur is not enough, so triggerEmpty()
 * types a character and clears it.
 *
 * NOTE on trim: the requirements say Name/Last name should trim spaces, but the live
 * site does NOT trim — "  A  " stays invalid as-is. Tests assert the REAL behaviour;
 * the discrepancy is flagged in the "spaces" test as a likely bug vs requirements.
 */

const EMAIL_PREFIX = 'edy-';

// Unique, prefixed email for positive / duplicate scenarios
const uniqueEmail = () => `${EMAIL_PREFIX}${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;

const VALID = { name: 'EdyName', lastName: 'EdyLastname', password: 'Password1' };

// Red border color shown on invalid fields (verified live)
const RED_BORDER = 'rgb(220, 53, 69)';

// All error messages the form actually shows (verified live).
// Note: the site shows "Name required" (not "Name is required" as in the requirements table).
const MSG = {
    nameRequired: 'Name required',
    nameInvalid: 'Name is invalid',
    nameLength: 'Name has to be from 2 to 20 characters long',
    lastNameRequired: 'Last name required',
    lastNameInvalid: 'Last name is invalid',
    lastNameLength: 'Last name has to be from 2 to 20 characters long',
    emailRequired: 'Email required',
    emailIncorrect: 'Email is incorrect',
    passwordRequired: 'Password required',
    passwordRule:
        'Password has to be from 8 to 15 characters long and contain at least one integer, one capital, and one small letter',
    repeatRequired: 'Re-enter password required',
    passwordsMismatch: 'Passwords do not match',
};

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

    // ========== POSITIVE ==========

    test('Positive: user can register with valid data', async ({ page }) => {
        const fields = getFields(page);

        await fillForm(fields, { ...VALID, email: uniqueEmail(), repeatPassword: VALID.password });

        await expect(fields.registerBtn).toBeEnabled();
        await fields.registerBtn.click();

        // Successful registration lands the user in their garage
        await expect(page).toHaveURL(/\/panel\/garage/);
        await expect(page.getByRole('heading', { name: 'Garage' })).toBeVisible();
    });

    // ========== NEGATIVE: all fields empty ==========

    test('Negative: empty required fields show messages and disable Register', async ({ page }) => {
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

        await expect(fieldError(page, '#signupName')).toHaveText(MSG.nameRequired);
        await expect(fieldError(page, '#signupLastName')).toHaveText(MSG.lastNameRequired);
        await expect(fieldError(page, '#signupEmail')).toHaveText(MSG.emailRequired);
        await expect(fieldError(page, '#signupPassword')).toHaveText(MSG.passwordRequired);
        await expect(fieldError(page, '#signupRepeatPassword')).toHaveText(MSG.repeatRequired);
        await expect(fields.registerBtn).toBeDisabled();
    });

    // ========== NEGATIVE: Field "Name" ==========

    test('Negative: empty Name shows required error and red border', async ({ page }) => {
        const fields = getFields(page);

        await triggerEmpty(fields.name);

        await expect(fieldError(page, '#signupName')).toHaveText(MSG.nameRequired);
        await expect(fields.name).toHaveCSS('border-color', RED_BORDER);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: Name with digits shows "Name is invalid" and red border', async ({ page }) => {
        const fields = getFields(page);

        await fields.name.fill('John123');
        await fields.name.blur();

        await expect(fieldError(page, '#signupName')).toHaveText(MSG.nameInvalid);
        await expect(fields.name).toHaveCSS('border-color', RED_BORDER);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: Name shorter than 2 characters is rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.name.fill('A');
        await fields.name.blur();

        await expect(fieldError(page, '#signupName')).toHaveText(MSG.nameLength);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: Name longer than 20 characters is rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.name.fill('A'.repeat(21));
        await fields.name.blur();

        await expect(fieldError(page, '#signupName')).toHaveText(MSG.nameLength);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: Name of only spaces is rejected (site does not trim)', async ({ page }) => {
        const fields = getFields(page);

        // Requirements say Name should be trimmed; the live site does NOT trim,
        // so a spaces-padded value stays invalid. Asserting the REAL behaviour.
        await fields.name.fill('  A  ');
        await fields.name.blur();

        await expect(fields.name).toHaveClass(/is-invalid/);
        await expect(fields.registerBtn).toBeDisabled();
    });

    // ========== NEGATIVE: Field "Last name" ==========

    test('Negative: empty Last name shows required error and red border', async ({ page }) => {
        const fields = getFields(page);

        await triggerEmpty(fields.lastName);

        await expect(fieldError(page, '#signupLastName')).toHaveText(MSG.lastNameRequired);
        await expect(fields.lastName).toHaveCSS('border-color', RED_BORDER);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: Last name with digits shows "Last name is invalid"', async ({ page }) => {
        const fields = getFields(page);

        await fields.lastName.fill('Doe123');
        await fields.lastName.blur();

        await expect(fieldError(page, '#signupLastName')).toHaveText(MSG.lastNameInvalid);
        await expect(fields.lastName).toHaveCSS('border-color', RED_BORDER);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: Last name shorter than 2 characters is rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.lastName.fill('D');
        await fields.lastName.blur();

        await expect(fieldError(page, '#signupLastName')).toHaveText(MSG.lastNameLength);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: Last name longer than 20 characters is rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.lastName.fill('D'.repeat(21));
        await fields.lastName.blur();

        await expect(fieldError(page, '#signupLastName')).toHaveText(MSG.lastNameLength);
        await expect(fields.registerBtn).toBeDisabled();
    });

    // ========== NEGATIVE: Field "Email" ==========

    test('Negative: empty Email shows required error and red border', async ({ page }) => {
        const fields = getFields(page);

        await triggerEmpty(fields.email);

        await expect(fieldError(page, '#signupEmail')).toHaveText(MSG.emailRequired);
        await expect(fields.email).toHaveCSS('border-color', RED_BORDER);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: invalid email format shows "Email is incorrect" and red border', async ({
        page,
    }) => {
        const fields = getFields(page);

        await fields.email.fill('edy-invalid-email');
        await fields.email.blur();

        await expect(fieldError(page, '#signupEmail')).toHaveText(MSG.emailIncorrect);
        await expect(fields.email).toHaveCSS('border-color', RED_BORDER);
        await expect(fields.registerBtn).toBeDisabled();
    });

    // ========== NEGATIVE: Field "Password" ==========

    test('Negative: empty Password shows required error', async ({ page }) => {
        const fields = getFields(page);

        await triggerEmpty(fields.password);

        await expect(fieldError(page, '#signupPassword')).toHaveText(MSG.passwordRequired);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: too short password is rejected', async ({ page }) => {
        const fields = getFields(page);

        // "123" — too short and has no letters
        await fields.password.fill('123');
        await fields.password.blur();

        await expect(fieldError(page, '#signupPassword')).toHaveText(MSG.passwordRule);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: password without a capital letter is rejected', async ({ page }) => {
        const fields = getFields(page);

        // 9 chars, has digit + lowercase, but no uppercase
        await fields.password.fill('password1');
        await fields.password.blur();

        await expect(fieldError(page, '#signupPassword')).toHaveText(MSG.passwordRule);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: password without a digit is rejected', async ({ page }) => {
        const fields = getFields(page);

        // 9 chars, has uppercase + lowercase, but no digit
        await fields.password.fill('Passwordd');
        await fields.password.blur();

        await expect(fieldError(page, '#signupPassword')).toHaveText(MSG.passwordRule);
        await expect(fields.registerBtn).toBeDisabled();
    });

    // ========== NEGATIVE: Field "Re-enter password" ==========

    test('Negative: empty Re-enter password shows required error and red border', async ({
        page,
    }) => {
        const fields = getFields(page);

        await triggerEmpty(fields.repeatPassword);

        await expect(fieldError(page, '#signupRepeatPassword')).toHaveText(MSG.repeatRequired);
        await expect(fields.repeatPassword).toHaveCSS('border-color', RED_BORDER);
        await expect(fields.registerBtn).toBeDisabled();
    });

    test('Negative: mismatched passwords are rejected', async ({ page }) => {
        const fields = getFields(page);

        await fields.password.fill('Password1');
        await fields.repeatPassword.fill('Password2');
        await fields.repeatPassword.blur();

        await expect(fieldError(page, '#signupRepeatPassword')).toHaveText(MSG.passwordsMismatch);
        await expect(fields.registerBtn).toBeDisabled();
    });

    // ========== NEGATIVE: duplicate email ==========

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
