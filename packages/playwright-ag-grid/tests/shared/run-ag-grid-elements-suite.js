import { expect, test } from "@playwright/test";

import { createAgGrid, filterOperator } from "../../src/index.js";
import {
  agGridElementsSelector,
  expectedPorscheRowsAfterEditing,
  expectedPorscheRowsBeforeEditing,
} from "./fixtures.js";

function expectRowsSubset(actualRows, expectedRows) {
  for (const expectedRow of expectedRows) {
    expect(actualRows).toContainEqual(expectedRow);
  }
}

export function runAgGridElementsSuite({ pagePath, versionLabel }) {
  test.describe(`playwright ag-grid elements scenarios (${versionLabel})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pagePath);
      await expect(page.locator(".example-version")).toContainText(`AG Grid ${versionLabel}`);
      await page.locator(".ag-cell").first().waitFor({ state: "visible" });
    });

    test("updates a grid cell value", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridElementsSelector));

      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "Porsche",
          operator: filterOperator.equals,
        },
        hasApplyButton: true,
      });

      expectRowsSubset(await grid.getData(), expectedPorscheRowsBeforeEditing);

      const priceCell = await grid.getCellLocator(
        { Make: "Porsche", Price: "72000" },
        "Price"
      );
      await priceCell.dblclick();
      await priceCell.locator("input").fill("66000");
      await priceCell.locator("input").press("Enter");

      expectRowsSubset(await grid.getData(), expectedPorscheRowsAfterEditing);
    });
  });
}
