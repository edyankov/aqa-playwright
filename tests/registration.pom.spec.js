// @ts-check
import { test } from '@playwright/test';
import { HomePage } from '../pages/home.page';
import { GaragePage } from '../pages/garage.page';
import { MSG, VALID, uniqueEmail } from '../data/registration.data';

/**
 * Registration form tests — https://qauto.forstudy.space/
 * Rewritten with the Page Object Model: the spec contains no raw selectors,
 * only Page Object methods and assertions.
 *
 * baseURL + basic auth (guest / welcome2qauto) are set in playwright.config.js.
 * Every created user uses the "edy-" email prefix.
 * Coverage matches the official requirements table (Name, Last name, Email,
 * Password, Re-enter password, Register button) including the red border check.
 */

test.describe('Registration form (POM)', () => {
    /** @type {HomePage} */
    let homePage;
    /** @type {import('../pages/signup-modal.page').SignupModal} */
    let signup;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.open();
        signup = await homePage.openSignup();
    });

    // ========== POSITIVE ==========

    test('Positive: user can register with valid data', async ({ page }) => {
        await signup.expectRegisterDisabled();
        await signup.register({ ...VALID, email: uniqueEmail(), repeatPassword: VALID.password });

        const garage = new GaragePage(page);
        await garage.expectLoaded();
    });

    // ========== NEGATIVE: all fields empty ==========

    test('Negative: empty required fields show messages and disable Register', async () => {
        for (const field of Object.values(signup.fields)) {
            await signup.triggerEmpty(field);
        }

        await signup.expectFieldError(signup.nameInput, MSG.nameRequired);
        await signup.expectFieldError(signup.lastNameInput, MSG.lastNameRequired);
        await signup.expectFieldError(signup.emailInput, MSG.emailRequired);
        await signup.expectFieldError(signup.passwordInput, MSG.passwordRequired);
        await signup.expectFieldError(signup.repeatPasswordInput, MSG.repeatRequired);
        await signup.expectRegisterDisabled();
    });

    // ========== NEGATIVE: Field "Name" ==========

    test('Negative: empty Name shows required error and red border', async () => {
        await signup.triggerEmpty(signup.nameInput);

        await signup.expectFieldError(signup.nameInput, MSG.nameRequired);
        await signup.expectRedBorder(signup.nameInput);
        await signup.expectRegisterDisabled();
    });

    test('Negative: Name with digits shows "Name is invalid" and red border', async () => {
        await signup.fillName('John123');

        await signup.expectFieldError(signup.nameInput, MSG.nameInvalid);
        await signup.expectRedBorder(signup.nameInput);
        await signup.expectRegisterDisabled();
    });

    test('Negative: Name shorter than 2 characters is rejected', async () => {
        await signup.fillName('A');

        await signup.expectFieldError(signup.nameInput, MSG.nameLength);
        await signup.expectRegisterDisabled();
    });

    test('Negative: Name longer than 20 characters is rejected', async () => {
        await signup.fillName('A'.repeat(21));

        await signup.expectFieldError(signup.nameInput, MSG.nameLength);
        await signup.expectRegisterDisabled();
    });

    test('Negative: Name of only spaces is rejected (site does not trim)', async () => {
        // Requirements say Name should be trimmed; the live site does NOT trim,
        // so a spaces-padded value stays invalid. Asserting the REAL behaviour.
        await signup.fillName('  A  ');

        await signup.expectInvalid(signup.nameInput);
        await signup.expectRegisterDisabled();
    });

    // ========== NEGATIVE: Field "Last name" ==========

    test('Negative: empty Last name shows required error and red border', async () => {
        await signup.triggerEmpty(signup.lastNameInput);

        await signup.expectFieldError(signup.lastNameInput, MSG.lastNameRequired);
        await signup.expectRedBorder(signup.lastNameInput);
        await signup.expectRegisterDisabled();
    });

    test('Negative: Last name with digits shows "Last name is invalid"', async () => {
        await signup.fillLastName('Doe123');

        await signup.expectFieldError(signup.lastNameInput, MSG.lastNameInvalid);
        await signup.expectRedBorder(signup.lastNameInput);
        await signup.expectRegisterDisabled();
    });

    test('Negative: Last name shorter than 2 characters is rejected', async () => {
        await signup.fillLastName('D');

        await signup.expectFieldError(signup.lastNameInput, MSG.lastNameLength);
        await signup.expectRegisterDisabled();
    });

    test('Negative: Last name longer than 20 characters is rejected', async () => {
        await signup.fillLastName('D'.repeat(21));

        await signup.expectFieldError(signup.lastNameInput, MSG.lastNameLength);
        await signup.expectRegisterDisabled();
    });

    // ========== NEGATIVE: Field "Email" ==========

    test('Negative: empty Email shows required error and red border', async () => {
        await signup.triggerEmpty(signup.emailInput);

        await signup.expectFieldError(signup.emailInput, MSG.emailRequired);
        await signup.expectRedBorder(signup.emailInput);
        await signup.expectRegisterDisabled();
    });

    test('Negative: invalid email format shows "Email is incorrect" and red border', async () => {
        await signup.fillEmail('edy-invalid-email');

        await signup.expectFieldError(signup.emailInput, MSG.emailIncorrect);
        await signup.expectRedBorder(signup.emailInput);
        await signup.expectRegisterDisabled();
    });

    // ========== NEGATIVE: Field "Password" ==========

    test('Negative: empty Password shows required error', async () => {
        await signup.triggerEmpty(signup.passwordInput);

        await signup.expectFieldError(signup.passwordInput, MSG.passwordRequired);
        await signup.expectRegisterDisabled();
    });

    test('Negative: too short password is rejected', async () => {
        await signup.fillPassword('123');

        await signup.expectFieldError(signup.passwordInput, MSG.passwordRule);
        await signup.expectRegisterDisabled();
    });

    test('Negative: password without a capital letter is rejected', async () => {
        await signup.fillPassword('password1');

        await signup.expectFieldError(signup.passwordInput, MSG.passwordRule);
        await signup.expectRegisterDisabled();
    });

    test('Negative: password without a digit is rejected', async () => {
        await signup.fillPassword('Passwordd');

        await signup.expectFieldError(signup.passwordInput, MSG.passwordRule);
        await signup.expectRegisterDisabled();
    });

    // ========== NEGATIVE: Field "Re-enter password" ==========

    test('Negative: empty Re-enter password shows required error and red border', async () => {
        await signup.triggerEmpty(signup.repeatPasswordInput);

        await signup.expectFieldError(signup.repeatPasswordInput, MSG.repeatRequired);
        await signup.expectRedBorder(signup.repeatPasswordInput);
        await signup.expectRegisterDisabled();
    });

    test('Negative: mismatched passwords are rejected', async () => {
        await signup.fillPassword('Password1');
        await signup.fillRepeatPassword('Password2');

        await signup.expectFieldError(signup.repeatPasswordInput, MSG.passwordsMismatch);
        await signup.expectRegisterDisabled();
    });

    // ========== NEGATIVE: duplicate email ==========

    test('Negative: registering an already existing email is rejected', async ({ page }) => {
        const email = uniqueEmail();

        // Register a fresh user first...
        await signup.register({ ...VALID, email, repeatPassword: VALID.password });
        const garage = new GaragePage(page);
        await garage.expectLoaded();

        // ...log out and try to register with the same email again
        await garage.logout();
        const signup2 = await homePage.openSignup();
        await signup2.register({ ...VALID, email, repeatPassword: VALID.password });

        await signup2.expectUserExists();
        await garage.expectNotLoaded();
    });
});
