# playwright-ag-grid

Playwright helpers for interacting with and validating AG Grid.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Create the Grid Helper](#create-the-grid-helper)
  - [Getting Data From the Grid](#getting-data-from-the-grid)
  - [Getting Select Row Data](#getting-select-row-data)
  - [Editing Grid Cells](#editing-grid-cells)
  - [Sorting Columns](#sorting-columns)
  - [Pinning Columns](#pinning-columns)
  - [Filter Options](#filter-options)
  - [Filter by Text - Column Menu](#filter-by-text---column-menu)
  - [Filter by Text - Floating Filter](#filter-by-text---floating-filter)
  - [Filter by Checkbox - Column Menu](#filter-by-checkbox---column-menu)
  - [Filtering - Localization and Internationalization](#filtering---localization-and-internationalization)
  - [Add or Remove Columns](#add-or-remove-columns)
  - [Validation Examples](#validation-examples)
    - [Validate Paginated Table](#validate-paginated-table)
    - [Validate Table in the Exact Order](#validate-table-in-the-exact-order)
    - [Validate Subset of Table Data](#validate-subset-of-table-data)
    - [Validate Empty Grid](#validate-empty-grid)
- [Limitations](#limitations)

## Installation

```bash
npm install playwright-ag-grid --save-dev
```

Then import the helper in your Playwright tests:

```javascript
import { createAgGrid, filterOperator, sort } from "playwright-ag-grid";
```

## Usage

### Create the Grid Helper

Create a helper instance from the top-level AG Grid locator, including headers and controls.

```javascript
import { createAgGrid } from "playwright-ag-grid";

const grid = createAgGrid(page.locator("#myGrid"));
```

### Getting Data From the Grid

Use `getData()` to read the displayed AG Grid rows as structured objects.

```javascript
const grid = createAgGrid(page.locator("#myGrid"));
const tableData = await grid.getData();
```

The returned value looks like:

```json
[
  { "Year": "2020", "Make": "Toyota", "Model": "Celica" },
  { "Year": "2020", "Make": "Ford", "Model": "Mondeo" },
  { "Year": "2020", "Make": "Porsche", "Model": "Boxter" },
  { "Year": "2020", "Make": "BMW", "Model": "3-series" },
  { "Year": "2020", "Make": "Mercedes", "Model": "GLC300" }
]
```

### Getting Select Row Data

To only return certain columns, pass `onlyColumns`:

```javascript
const grid = createAgGrid(page.locator("#myGrid"));
const tableData = await grid.getData({ onlyColumns: ["Year", "Make"] });
```

You can also request the raw header/row arrays instead of mapped objects:

```javascript
const grid = createAgGrid(page.locator("#myGrid"));
const tableData = await grid.getData({ valuesArray: true });
```

### Editing Grid Cells

Playwright does not expose AG Grid cells as Cypress-style command subjects, so the package provides `getCellLocator()` for targeted cell interaction.

```javascript
const grid = createAgGrid(page.locator("#myGrid2"));

await grid.filterTextFloating({
  searchCriteria: {
    columnName: "Make",
    filterValue: "Porsche",
    operator: filterOperator.equals,
  },
  hasApplyButton: true,
});

const priceCell = await grid.getCellLocator(
  { Make: "Porsche", Price: "72000" },
  "Price"
);

await priceCell.dblclick();
await priceCell.locator("input").fill("66000");
await priceCell.locator("input").press("Enter");
```

### Sorting Columns

Use `sortColumn(columnName, sortDirection)`:

```javascript
const grid = createAgGrid(page.locator("#myGrid"));
await grid.sortColumn("Model", "descending");
```

You can also use the exported enum values:

```javascript
await grid.sortColumn("Model", sort.ascending);
```

### Pinning Columns

Use `pinColumn(columnName, pin)` where `pin` is `"left"`, `"right"`, or `null`.

```javascript
const grid = createAgGrid(page.locator("#myGrid"));

await grid.pinColumn("Model", "left");
await grid.pinColumn("Model", "right");
await grid.pinColumn("Model", null);
```

### Filter Options

The filtering commands accept an options object shaped like:

```javascript
{
  searchCriteria: {
    columnName: string;
    filterValue: string;
    operator?: string;
    searchInputIndex?: number;
    operatorIndex?: number;
    isMultiFilter?: boolean;
  } | Array<{
    columnName: string;
    filterValue: string;
    operator?: string;
    searchInputIndex?: number;
    operatorIndex?: number;
    isMultiFilter?: boolean;
  }>;
  hasApplyButton?: boolean;
  noMenuTabs?: boolean;
  selectAllLocaleText?: string;
}
```

Option notes:

- `searchCriteria.columnName`: column to filter.
- `searchCriteria.filterValue`: value to type or select.
- `searchCriteria.operator`: optional AG Grid operator text such as `Equals`, `Contains`, or `Between`.
- `searchCriteria.searchInputIndex`: optional input index when multiple visible inputs exist.
- `searchCriteria.operatorIndex`: optional operator picker index when multiple visible operators exist.
- `searchCriteria.isMultiFilter`: optional flag for floating filters using checkbox values rather than free-form text.
- `hasApplyButton`: use `true` when the filter UI has an explicit Apply button.
- `noMenuTabs`: use `true` for grids that render a menu list instead of filter tabs.
- `selectAllLocaleText`: localized text for the checkbox filter's Select All entry.

### Filter by Text - Column Menu

Use `filterTextMenu(options)` to filter via the column menu:

```javascript
const grid = createAgGrid(page.locator("#myGrid"));

await grid.filterTextMenu({
  searchCriteria: [
    {
      columnName: "Model",
      filterValue: "GLC300",
      operator: filterOperator.equals,
    },
    {
      columnName: "Make",
      filterValue: "Mercedes",
      operator: filterOperator.equals,
    },
  ],
  hasApplyButton: true,
});
```

### Filter by Text - Floating Filter

Use `filterTextFloating(options)` to filter via a column's floating filter:

```javascript
const grid = createAgGrid(page.locator("#myGrid"));

await grid.filterTextFloating({
  searchCriteria: {
    columnName: "Make",
    filterValue: "Ford",
  },
  hasApplyButton: true,
});
```

For multiple conditions in the same floating filter:

```javascript
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
```

For `Between`, pass two entries for the same column:

```javascript
await grid.filterTextFloating({
  searchCriteria: [
    {
      columnName: "Year",
      filterValue: "1990",
      operator: filterOperator.inRange,
    },
    {
      columnName: "Year",
      filterValue: "2011",
      operator: filterOperator.inRange,
    },
  ],
  hasApplyButton: true,
});
```

### Filter by Checkbox - Column Menu

Use `filterCheckboxMenu(options)` to filter by checkbox values from the column menu:

```javascript
const grid = createAgGrid(page.locator("#myGrid"));

await grid.filterCheckboxMenu({
  searchCriteria: {
    columnName: "Model",
    filterValue: "2002",
  },
  hasApplyButton: true,
});
```

Multiple checkbox values:

```javascript
await grid.filterCheckboxMenu({
  searchCriteria: [
    { columnName: "Model", filterValue: "2002" },
    { columnName: "Model", filterValue: "3-series" },
  ],
  hasApplyButton: true,
});
```

### Filtering - Localization and Internationalization

When filtering by checkbox, the helper first deselects the Select All entry so only the requested values remain selected. For localized grids, pass the localized Select All text:

```javascript
await grid.filterCheckboxMenu({
  searchCriteria: {
    columnName: "Model",
    filterValue: "2002",
  },
  selectAllLocaleText: "Tout Sélectionner",
  hasApplyButton: true,
});
```

### Add or Remove Columns

Use `toggleColumnFromSideBar(columnName, doRemove)` to toggle columns from the sidebar:

```javascript
const grid = createAgGrid(page.locator("#myGrid"));

await grid.toggleColumnFromSideBar("Year", true);
await grid.toggleColumnFromSideBar("Year", false);
```

## Validation Examples

Unlike the Cypress package, the Playwright package does not currently register assertion helpers. The intended pattern is to use `await grid.getData()` together with Playwright's `expect`.

### Validate Paginated Table

```javascript
import { expect } from "@playwright/test";
import { createAgGrid } from "playwright-ag-grid";

const expectedPaginatedTableData = [
  [
    { Year: "2020", Make: "Toyota", Model: "Celica" },
    { Year: "2020", Make: "Ford", Model: "Mondeo" },
  ],
  [
    { Year: "2020", Make: "Honda", Model: "Civic" },
    { Year: "2020", Make: "Honda", Model: "Accord" },
  ],
];

const grid = createAgGrid(page.locator("#myGrid"));

for (const expectedPage of expectedPaginatedTableData) {
  await expect(await grid.getData({ onlyColumns: ["Year", "Make", "Model"] }))
    .toEqual(expectedPage);
  await page.locator("#myGrid .ag-icon-next").click();
}
```

### Validate Table in the Exact Order

```javascript
import { expect } from "@playwright/test";

const grid = createAgGrid(page.locator("#myGrid"));
const actualTableData = await grid.getData();

await expect(actualTableData).toEqual(expectedTableData);
```

### Validate Subset of Table Data

```javascript
import { expect } from "@playwright/test";

const grid = createAgGrid(page.locator("#myGrid"));
const actualTableData = await grid.getData({ onlyColumns: ["Year", "Make", "Model"] });

for (const expectedRow of expectedTableData) {
  expect(actualTableData).toContainEqual(expectedRow);
}
```

### Validate Empty Grid

```javascript
import { expect } from "@playwright/test";

const grid = createAgGrid(page.locator("#myGrid"));
const actualTableData = await grid.getData();

await expect(actualTableData).toEqual([]);
```

## Limitations

- Validation helpers are not yet packaged as Playwright-specific assertion methods; use Playwright `expect` with `getData()`.
- `getCellLocator()` is the supported element-interaction path; there is not currently a `getAgGridElements()`-style API returning live DOM element maps.
- Unlimited scrolling grids are not fully supported when data is outside the rendered DOM.
- Data outside the current rendered viewport is not available until AG Grid renders it into the DOM.
