import { after } from "node:test";

import { createTestApi } from "./shared/compat.js";
import { createAgGrid } from "../src/index.js";
import { createWdioTestContext } from "./shared/runtime.js";

const context = await createWdioTestContext();

after(async () => {
  await context.close();
});

const { expect, test } = createTestApi({
  getBaseUrl: () => context.baseUrl,
  getBrowser: () => context.browser,
});

test.describe("agGridWaitForAnimation", () => {
  test("waits for AG Grid-owned animations to finish", async ({ page }) => {
    await page.goto("/animation-wait/ag-owned.html");
    await page.locator(".ag-cell").first().waitFor({ state: "visible" });

    await page.evaluate(() => {
      window.startAnimationWaitScenario();
      window.__animationProbe.waitStartedAt = Date.now();
    });

    const grid = createAgGrid(await context.browser.$("#myGrid"));
    await grid.waitForAnimation();

    const probe = await page.evaluate(() => ({
      ...window.__animationProbe,
      elapsedMs: Date.now() - window.__animationProbe.waitStartedAt,
    }));

    await expect(probe.agStarted).toBe(true);
    await expect(probe.agFinished).toBe(true);
    await expect(probe.elapsedMs).toBeGreaterThan(200);
    await expect(probe.elapsedMs).toBeLessThan(2000);
  });

  test("ignores third-party subtree animations whose finished promise never resolves", async ({ page }) => {
    await page.goto("/animation-wait/third-party-subtree.html");
    await page.locator(".ag-cell").first().waitFor({ state: "visible" });

    await page.evaluate(() => {
      window.startAnimationWaitScenario();
      window.__animationProbe.waitStartedAt = Date.now();
    });

    await expect(await page.locator("#myGrid .os-scrollbar-handle").count()).toBeGreaterThan(0);

    const grid = createAgGrid(await context.browser.$("#myGrid"));
    await grid.waitForAnimation();

    const probe = await page.evaluate(() => ({
      ...window.__animationProbe,
      elapsedMs: Date.now() - window.__animationProbe.waitStartedAt,
    }));

    await expect(probe.agFinished).toBe(true);
    await expect(probe.thirdPartyInstalled).toBe(true);
    await expect(probe.elapsedMs).toBeLessThan(2000);
  });
});
