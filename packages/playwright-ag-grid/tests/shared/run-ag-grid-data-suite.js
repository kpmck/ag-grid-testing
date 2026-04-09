import { expect, test } from "@playwright/test";

import { createAgGrid, filterOperator, sort } from "../../src/index.js";
import {
  agGridSelector,
  expectedFirstPageTableData,
} from "./fixtures.js";

export function runAgGridDataSuite({ pagePath, versionLabel }) {
  test.describe(`playwright ag-grid data scenarios (${versionLabel})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pagePath);
      await expect(page.locator(".example-version")).toContainText(`AG Grid ${versionLabel}`);
      await page.locator(".ag-cell").first().waitFor({ state: "visible" });
      await page.locator("#floating").click();
    });

    test("gets first-page grid data in exact order", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await expect(await grid.getData()).toEqual(expectedFirstPageTableData);
    });

    test("gets a subset of columns", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await expect(
        await grid.getData({ onlyColumns: ["Year", "Make", "Model"] })
      ).toEqual(
        expectedFirstPageTableData.map(({ Year, Make, Model }) => ({ Year, Make, Model }))
      );
    });

    test("keeps logical column order after pinning a column", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.pinColumn("Price", "left");
      await expect(await grid.getData()).toEqual(expectedFirstPageTableData);
    });

    test("filters by floating text", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Model", sort.ascending);
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "Ford",
        },
        hasApplyButton: true,
      });

      await expect(await grid.getData()).toEqual([
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "excellent", Price: "32000" },
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "good", Price: "25000" },
        { Year: "2020", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "19000" },
        { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
      ]);
    });

    test("filters by menu text", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Model", sort.ascending);
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Price",
          filterValue: "32000",
          operator: filterOperator.equals,
        },
        hasApplyButton: true,
      });

      await expect(await grid.getData()).toEqual([
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
        { Year: "2020", Make: "Honda", Model: "Accord", Condition: "poor", Price: "32000" },
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "excellent", Price: "32000" },
      ]);
    });

    test("filters by checkbox menu across multiple values", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await page.locator("#nonFloating").click();
      await grid.filterCheckboxMenu({
        searchCriteria: [
          { columnName: "Model", filterValue: "2002" },
          { columnName: "Model", filterValue: "3-series" },
        ],
        hasApplyButton: true,
      });

      await expect(await grid.getData()).toEqual([
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Price: "88001" },
      ]);
    });
  });
}
