import { expect, test } from "@playwright/test";

import { createAgGrid, filterOperator, sort } from "../../src/index.js";
import {
  agGridSelector,
  cardataFixture,
  clone,
  expectRowsSubset,
  expectedFirstPageTableData,
  expectedPaginatedTableData,
  getSortedMileage,
  pageSize,
  removePropertyFromCollection,
  sortedCollectionByProperty,
} from "./fixtures.js";

async function enableMileageNumberFilter(page, floatingFilter = false) {
  await page.evaluate(({ field, filter, floatingFilterValue, hide }) => {
    window.setColumnFilter(field, filter, floatingFilterValue, hide);
  }, {
    field: "mileage",
    filter: "agNumberColumnFilter",
    floatingFilterValue: floatingFilter,
    hide: false,
  });
  await page.locator(".ag-cell").first().waitFor({ state: "visible" });
}

async function validatePaginatedTable(page, grid, expectedPages, options) {
  for (let index = 0; index < expectedPages.length; index += 1) {
    await expect(await grid.getData(options)).toEqual(expectedPages[index]);
    if (index < expectedPages.length - 1) {
      await page.locator(`${agGridSelector} .ag-icon-next`).click();
    }
  }
}

function sortRowsByMileage(rows) {
  return clone(rows).sort((a, b) => Number(a.Mileage) - Number(b.Mileage));
}

export function runAgGridDataSuite({ pagePath, versionLabel }) {
  test.describe(`playwright ag-grid data scenarios (${versionLabel})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(pagePath);
      await expect(page.locator(".example-version")).toContainText(`AG Grid ${versionLabel}`);
      await page.locator(".ag-cell").first().waitFor({ state: "visible" });
      await page.locator("#floating").click();
    });

    test("verify paginated table data - any order - include all columns", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await validatePaginatedTable(page, grid, expectedPaginatedTableData);
    });

    test("verify paginated table data - exact order - include all columns", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await expect(await grid.getData()).toEqual(expectedPaginatedTableData[0]);
    });

    test("verify exact order table data when columns are not in order - include all columns", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.pinColumn("Price", "left");
      await expect(await grid.getData()).toEqual(expectedPaginatedTableData[0]);
    });

    test("verify paginated table data - excluding columns", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      const expectedSubset = expectedPaginatedTableData.map((pageRows) =>
        pageRows.map(({ Year, Make, Model }) => ({ Year, Make, Model }))
      );

      await validatePaginatedTable(page, grid, expectedSubset, {
        onlyColumns: ["Year", "Make", "Model"],
      });
    });

    test("able to filter by checkbox", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Model",
          filterValue: "2002",
        },
        selectAllLocaleText: "(Select All)",
        hasApplyButton: true,
      });
      await expect(await grid.getData()).toEqual([
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Price: "88001" },
      ]);
    });

    test("able to filter by checkbox - multiple columns", async ({ page }) => {
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

    test("able to filter by text - menu", async ({ page }) => {
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

    test("able to filter by text - menu - multiple columns", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await page.locator("#nonFloating").click();
      await grid.sortColumn("Model", sort.ascending);
      await grid.filterTextMenu({
        searchCriteria: [
          {
            columnName: "Price",
            filterValue: "32000",
            operator: filterOperator.equals,
          },
          {
            columnName: "Make",
            filterValue: "BMW",
            operator: filterOperator.equals,
          },
        ],
        hasApplyButton: true,
      });
      await expect(await grid.getData()).toEqual([
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
      ]);
    });

    test("able to filter by text - menu - contains operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Model", sort.ascending);
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "ord",
          operator: filterOperator.contains,
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

    test("able to filter by text - menu - does not contain operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "ord",
          operator: filterOperator.notContains,
        },
        hasApplyButton: true,
      });

      const actualTableData = await grid.getData();
      expect(actualTableData.length).toBeGreaterThan(0);
      for (const row of actualTableData) {
        expect(row.Make).not.toContain("ord");
      }
    });

    test("able to filter by text - menu - does not equal operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "Ford",
          operator: filterOperator.notEquals,
        },
        hasApplyButton: true,
      });

      const actualTableData = await grid.getData();
      expect(actualTableData.length).toBeGreaterThan(0);
      for (const row of actualTableData) {
        expect(row.Make).not.toBe("Ford");
      }
    });

    test("able to filter by text - menu - less than operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page);
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "5000",
          operator: filterOperator.lessThan,
        },
        hasApplyButton: true,
      });
      expect(getSortedMileage(await grid.getData())).toEqual(["250", "1000", "3500", "4500"]);
    });

    test("able to filter by text - menu - less than or equal operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page);
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "5000",
          operator: filterOperator.lessThanOrEquals,
        },
        hasApplyButton: true,
      });
      expect(getSortedMileage(await grid.getData())).toEqual(["250", "1000", "3500", "4500", "5000"]);
    });

    test("able to filter by text - menu - greater than operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page);
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "50000",
          operator: filterOperator.greaterThan,
        },
        hasApplyButton: true,
      });
      expect(getSortedMileage(await grid.getData())).toEqual(["52000", "60000", "70000", "90000"]);
    });

    test("able to filter by text - menu - greater than or equal operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page);
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "50000",
          operator: filterOperator.greaterThanOrEquals,
        },
        hasApplyButton: true,
      });
      expect(getSortedMileage(await grid.getData())).toEqual(["52000", "60000", "70000", "90000"]);
    });

    test("able to filter by text - floating filter", async ({ page }) => {
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

    test("able to filter by text - floating filter - multiple conditions", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Model", sort.ascending);
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "B",
          searchInputIndex: 0,
        },
        hasApplyButton: true,
      });
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "MW",
          searchInputIndex: 1,
        },
        hasApplyButton: true,
      });
      await expect(await grid.getData()).toEqual([
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Price: "88001" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
      ]);
    });

    test("able to filter by text - floating filter - multiple columns", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Model", sort.ascending);
      await grid.filterTextFloating({
        searchCriteria: [
          { columnName: "Make", filterValue: "Ford" },
          { columnName: "Year", filterValue: "1990" },
        ],
        hasApplyButton: true,
      });
      await expect(await grid.getData()).toEqual([
        { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
      ]);
    });

    test("able to filter by text - floating filter - between operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page, true);
      await grid.filterTextFloating({
        searchCriteria: [
          {
            columnName: "Mileage",
            filterValue: "0",
            operator: filterOperator.inRange,
          },
          {
            columnName: "Mileage",
            filterValue: "5000",
            operator: filterOperator.inRange,
          },
        ],
        hasApplyButton: true,
      });

      const expectedTableData = [
        { Year: "2023", Make: "Hyundai", Model: "Santa Fe", Condition: "excellent", Mileage: "250", Price: "" },
        { Year: "2020", Make: "Porsche", Model: "Boxter", Condition: "good", Mileage: "1000", Price: "99000" },
        { Year: "2020", Make: "Hyundai", Model: "Elantra", Condition: "fair", Mileage: "3500", Price: "3000" },
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Mileage: "4500", Price: "88001" },
      ];

      expect(sortRowsByMileage(await grid.getData())).toEqual(sortRowsByMileage(expectedTableData));
    });

    test("able to filter by text - floating filter - between operator with explicit indexes", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page, true);

      if (versionLabel === "v33") {
        await grid.filterTextFloating({
          searchCriteria: [
            {
              columnName: "Mileage",
              filterValue: "0",
              operator: filterOperator.inRange,
              searchInputIndex: 0,
              operatorIndex: 0,
            },
            {
              columnName: "Mileage",
              filterValue: "5000",
              operator: filterOperator.inRange,
              searchInputIndex: 1,
              operatorIndex: 0,
            },
          ],
          hasApplyButton: true,
        });
      } else {
        await grid.filterTextFloating({
          searchCriteria: {
            columnName: "Mileage",
            filterValue: "0",
            operator: filterOperator.inRange,
            searchInputIndex: 0,
            operatorIndex: 0,
          },
          hasApplyButton: true,
        });
        await grid.filterTextFloating({
          searchCriteria: {
            columnName: "Mileage",
            filterValue: "5000",
            operator: filterOperator.inRange,
            searchInputIndex: 1,
            operatorIndex: 0,
          },
          hasApplyButton: true,
        });
      }

      expect(getSortedMileage(await grid.getData())).toEqual(["250", "1000", "3500", "4500"]);
    });

    test("able to filter by text - floating filter - between operator with mixed criteria", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page, true);
      await grid.filterTextFloating({
        searchCriteria: [
          {
            columnName: "Mileage",
            filterValue: "0",
            operator: filterOperator.inRange,
          },
          {
            columnName: "Mileage",
            filterValue: "500",
            operator: filterOperator.inRange,
          },
          {
            columnName: "Make",
            filterValue: "Ford",
          },
        ],
        hasApplyButton: true,
      });
      await expect(await grid.getData()).toEqual([]);
    });

    test("able to filter by text - floating filter - between operator without apply button", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await enableMileageNumberFilter(page, true);
      await grid.filterTextFloating({
        searchCriteria: [
          {
            columnName: "Mileage",
            filterValue: "0",
            operator: filterOperator.inRange,
          },
          {
            columnName: "Mileage",
            filterValue: "5000",
            operator: filterOperator.inRange,
          },
        ],
        hasApplyButton: false,
        noMenuTabs: true,
      });
      expect(getSortedMileage(await grid.getData())).toEqual(["250", "1000", "3500", "4500"]);
    });

    test("able to filter by text - floating filter - multi filter", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Model", sort.ascending);
      await grid.filterTextFloating({
        searchCriteria: [
          {
            columnName: "Model",
            filterValue: "Taurus",
            isMultiFilter: true,
          },
        ],
        hasApplyButton: true,
      });
      await expect(await grid.getData()).toEqual([
        { Year: "2020", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "19000" },
        { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
      ]);
    });

    test("able to validate empty table", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Price",
          filterValue: "0",
          operator: filterOperator.equals,
        },
        hasApplyButton: true,
      });
      await expect(await grid.getData()).toEqual([]);
    });

    test("able to sort by ascending order", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Make", sort.ascending);
      const expectedDataSortedByAscending = sortedCollectionByProperty(
        removePropertyFromCollection(cardataFixture, ["Mileage"]),
        "Make",
        sort.ascending,
        pageSize
      );
      await expect(await grid.getData()).toEqual(expectedDataSortedByAscending);
    });

    test("able to sort by descending order", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.sortColumn("Make", sort.descending);
      const expectedDataSortedByDescending = sortedCollectionByProperty(
        removePropertyFromCollection(cardataFixture, ["Mileage"]),
        "Make",
        sort.descending,
        pageSize
      );
      await expect(await grid.getData()).toEqual(expectedDataSortedByDescending);
    });

    test("remove column from grid and verify select column data", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.toggleColumnFromSideBar("Year", true);
      const expectedData = removePropertyFromCollection(
        removePropertyFromCollection(cardataFixture, ["Mileage"]),
        ["Year"]
      ).slice(0, pageSize);
      await expect(await grid.getData()).toEqual(expectedData);
    });

    test("remove single pinned column from grid and verify select column data", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.toggleColumnFromSideBar("Price", true);
      const expectedData = removePropertyFromCollection(
        removePropertyFromCollection(cardataFixture, ["Mileage"]),
        ["Price"]
      ).slice(0, pageSize);
      await expect(await grid.getData()).toEqual(expectedData);
    });

    test("remove multiple columns from grid and verify select column data", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.toggleColumnFromSideBar("Price", true);
      await grid.toggleColumnFromSideBar("Make", true);
      const expectedData = removePropertyFromCollection(
        removePropertyFromCollection(cardataFixture, ["Mileage"]),
        ["Price", "Make"]
      ).slice(0, pageSize);
      await expect(await grid.getData()).toEqual(expectedData);
    });

    test("only validate select column data", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      const actualTableData = await grid.getData({ onlyColumns: ["Year", "Make", "Model"] });
      expectRowsSubset(expect, actualTableData, expectedFirstPageTableData.map(({ Year, Make, Model }) => ({ Year, Make, Model })));
    });

    test("able to filter by 'Blank'", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Price",
          operator: filterOperator.blank,
        },
        hasApplyButton: true,
      });
      expectRowsSubset(expect, await grid.getData(), [
        { Year: "2023", Make: "Hyundai", Model: "Santa Fe", Condition: "excellent", Price: "" },
      ]);
    });

    test("able to filter by 'Not blank'", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.filterTextMenu({
        searchCriteria: {
          columnName: "Price",
          operator: filterOperator.notBlank,
        },
        hasApplyButton: true,
      });
      const actualTableData = await grid.getData();
      expect(actualTableData.length).toBeGreaterThan(0);
      for (const row of actualTableData) {
        expect(row.Price).not.toBe("");
      }
    });

    test("able to filter by agTextColumnFilter with join operator", async ({ page }) => {
      const grid = createAgGrid(page.locator(agGridSelector));
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Condition",
          operator: filterOperator.startsWith,
          filterValue: "f",
          searchInputIndex: 0,
        },
        hasApplyButton: true,
      });
      await grid.filterTextFloating({
        searchCriteria: {
          columnName: "Condition",
          operator: filterOperator.endsWith,
          filterValue: "ir",
          searchInputIndex: 1,
        },
        hasApplyButton: true,
      });
      expectRowsSubset(expect, await grid.getData(), [
        { Year: "2020", Make: "Toyota", Model: "Celica", Condition: "fair", Price: "35000" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
        { Year: "2020", Make: "Hyundai", Model: "Elantra", Condition: "fair", Price: "3000" },
      ]);
    });
  });
}
