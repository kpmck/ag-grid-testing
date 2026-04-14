import { createTestApi } from "./compat.js";

import { createAgGrid, filterOperator } from "../../src/index.js";
import {
  agGridElementsSelector,
  expectedPorscheRowsAfterEditing,
  expectedPorscheRowsBeforeEditing,
} from "./fixtures.js";

function expectRowsSubset(expect, actualRows, expectedRows) {
  for (const expectedRow of expectedRows) {
    expect(
      actualRows.some((row) =>
        Object.entries(expectedRow).every(([key, value]) => row[key] === value)
      )
    ).toBe(true);
  }
}

export function runAgGridElementsSuite({ getBaseUrl, getBrowser, pagePath, versionLabel }) {
  const { expect, test } = createTestApi({ getBrowser, getBaseUrl });

  test.describe(`wdio ag-grid elements scenarios (${versionLabel})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pagePath);
      await expect(page.locator(".example-version")).toContainText(`AG Grid ${versionLabel}`);
      await page.locator(".ag-cell").first().waitFor({ state: "visible" });
    });

    test("updates a grid cell value", async () => {
      const browser = getBrowser();
      const grid = createAgGrid(await browser.$(agGridElementsSelector));

      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "Porsche",
          operator: filterOperator.equals,
        },
        hasApplyButton: true,
      });

      expectRowsSubset(expect, await grid.getData(), expectedPorscheRowsBeforeEditing);

      const priceCell = await grid.getCellLocator(
        { Make: "Porsche", Price: "72000" },
        "Price"
      );
      await priceCell.doubleClick();
      const input = await priceCell.$("input");
      await input.waitForDisplayed();
      await input.setValue("66000");
      await browser.keys("Enter");

      expectRowsSubset(expect, await grid.getData(), expectedPorscheRowsAfterEditing);
    });
  });
}
