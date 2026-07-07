// @ts-check

/**
 * Base class for all Page Objects.
 * Holds the page reference and shared navigation.
 */
export class BasePage {
    /** @param {import('@playwright/test').Page} page */
    constructor(page) {
        this.page = page;
    }

    /** @param {string} path */
    async open(path = '/') {
        await this.page.goto(path);
    }
}
