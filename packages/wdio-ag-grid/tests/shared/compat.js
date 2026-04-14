import assert from "node:assert/strict";
import { beforeEach, describe, test as nodeTest } from "node:test";

class WdioLocator {
  constructor(browser, resolver) {
    this.browser = browser;
    this.resolver = resolver;
  }

  async _elements() {
    return this.resolver();
  }

  locator(selector) {
    return new WdioLocator(this.browser, async () => {
      const elements = await this._elements();
      const nested = [];

      for (const element of elements) {
        nested.push(...(await element.$$(selector)));
      }

      return nested;
    });
  }

  filter({ hasText }) {
    return new WdioLocator(this.browser, async () => {
      const elements = await this._elements();
      const filtered = [];

      for (const element of elements) {
        const text = (await element.getText()).trim();
        const matches =
          hasText instanceof RegExp ? hasText.test(text) : text.includes(hasText);

        if (matches) {
          filtered.push(element);
        }
      }

      return filtered;
    });
  }

  first() {
    return this.nth(0);
  }

  nth(index) {
    return new WdioLocator(this.browser, async () => {
      const elements = await this._elements();
      return elements[index] ? [elements[index]] : [];
    });
  }

  async count() {
    return (await this._elements()).length;
  }

  async waitFor({ state } = {}) {
    const elements = await this._elements();
    const element = elements[0];

    if (!element) {
      throw new Error("Unable to find locator element.");
    }

    if (state === "visible") {
      await element.waitForDisplayed();
      return;
    }

    await element.waitForExist();
  }

  async click() {
    const elements = await this._elements();
    await elements[0].click();
  }

  async dblclick() {
    const elements = await this._elements();
    await elements[0].doubleClick();
  }

  async fill(value) {
    const elements = await this._elements();
    await elements[0].setValue(value);
  }

  async type(value) {
    const elements = await this._elements();
    await elements[0].addValue(value);
  }

  async press(key) {
    await this.browser.keys(key);
  }

  async textContent() {
    const elements = await this._elements();
    const texts = [];

    for (const element of elements) {
      texts.push((await element.getText()).trim());
    }

    return texts.join(" ");
  }
}

export function createPage(browser, baseUrl) {
  return {
    async goto(path) {
      const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
      await browser.url(url);
    },
    locator(selector) {
      return new WdioLocator(browser, async () => browser.$$(selector));
    },
    async evaluate(fn, arg) {
      return browser.execute(fn, arg);
    },
  };
}

export function createTestApi({ getBrowser, getBaseUrl }) {
  const state = {
    page: null,
  };

  const test = (name, fn) =>
    nodeTest(name, async () => {
      if (!state.page) {
        state.page = createPage(getBrowser(), getBaseUrl());
      }

      await fn({ page: state.page });
    });

  test.describe = describe;
  test.beforeEach = (fn) =>
    beforeEach(async () => {
      state.page = createPage(getBrowser(), getBaseUrl());
      await fn({ page: state.page });
    });

  const expect = (actual) => {
    const isLocator = actual instanceof WdioLocator;

    const api = {
      toEqual(expected) {
        assert.deepStrictEqual(actual, expected);
      },
      toBe(expected) {
        assert.strictEqual(actual, expected);
      },
      toContain(expected) {
        if (typeof actual === "string") {
          assert.ok(actual.includes(expected));
          return;
        }

        assert.ok(actual.includes(expected));
      },
      toContainEqual(expected) {
        assert.ok(
          actual.some((item) => JSON.stringify(item) === JSON.stringify(expected)),
          `Expected ${JSON.stringify(expected)} to be present.`
        );
      },
      toBeGreaterThan(expected) {
        assert.ok(actual > expected);
      },
      toBeLessThan(expected) {
        assert.ok(actual < expected);
      },
      toContainText(expected) {
        if (isLocator) {
          return actual.textContent().then((text) => {
            assert.ok(text.includes(expected), `Expected "${text}" to include "${expected}"`);
          });
        }

        const text = String(actual);
        assert.ok(text.includes(expected), `Expected "${text}" to include "${expected}"`);
      },
    };

    api.not = {
      toContain(expected) {
        if (typeof actual === "string") {
          assert.ok(!actual.includes(expected));
          return;
        }

        assert.ok(!actual.includes(expected));
      },
      toBe(expected) {
        assert.notStrictEqual(actual, expected);
      },
    };

    return api;
  };

  return { expect, test };
}
