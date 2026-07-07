// @ts-check

export const EMAIL_PREFIX = 'edy-';

/** Unique email with the required "edy-" prefix. */
export const uniqueEmail = () =>
    `${EMAIL_PREFIX}${Date.now()}${Math.floor(Math.random() * 1000)}@test.com`;

export const VALID = {
    name: 'EdyName',
    lastName: 'EdyLastname',
    password: 'Password1',
};

/** Red border color shown on invalid fields (verified live). */
export const RED_BORDER = 'rgb(220, 53, 69)';

/** Error messages exactly as the app shows them (verified live). */
export const MSG = {
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
