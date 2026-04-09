import { expect, test } from "@playwright/test";

import { createAgGrid } from "../src/index.js";

test.describe("agGridWaitForAnimation", () => {
  test("waits for AG Grid-owned animations to finish", async ({ page }) => {
    await page.goto("/animation-wait/ag-owned.html");
    await page.locator(".ag-cell").first().waitFor({ state: "visible" });

    await page.evaluate(() => {
      window.startAnimationWaitScenario();
      window.__animationProbe.waitStartedAt = Date.now();
    });

    const grid = createAgGrid(page.locator("#myGrid"));
    await grid.waitForAnimation();

    const probe = await page.evaluate(() => ({
      ...window.__animationProbe,
      elapsedMs: Date.now() - window.__animationProbe.waitStartedAt,
    }));

    expect(probe.agStarted).toBe(true);
    expect(probe.agFinished).toBe(true);
    expect(probe.elapsedMs).toBeGreaterThan(200);
    expect(probe.elapsedMs).toBeLessThan(2000);
  });

  test("ignores third-party subtree animations whose finished promise never resolves", async ({ page }) => {
    await page.goto("/animation-wait/third-party-subtree.html");
    await page.locator(".ag-cell").first().waitFor({ state: "visible" });

    await page.evaluate(() => {
      window.startAnimationWaitScenario();
      window.__animationProbe.waitStartedAt = Date.now();
    });

    expect(await page.locator("#myGrid .os-scrollbar-handle").count()).toBeGreaterThan(0);

    const grid = createAgGrid(page.locator("#myGrid"));
    await grid.waitForAnimation();

    const probe = await page.evaluate(() => ({
      ...window.__animationProbe,
      elapsedMs: Date.now() - window.__animationProbe.waitStartedAt,
    }));

    expect(probe.agFinished).toBe(true);
    expect(probe.thirdPartyInstalled).toBe(true);
    expect(probe.elapsedMs).toBeLessThan(2000);
  });
});
