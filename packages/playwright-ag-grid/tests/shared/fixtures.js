import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cardataPath = path.resolve(
  __dirname,
  "../../../cypress-ag-grid/cypress/fixtures/cardata.json"
);

export const agGridSelector = "#myGrid";
export const agGridElementsSelector = "#myGrid2";

export const pageSize = 5;

export const cardataFixture = JSON.parse(
  fs.readFileSync(cardataPath, "utf-8")
);

export const expectedPaginatedTableData = [
  [
    { Year: "2020", Make: "Toyota", Model: "Celica", Condition: "fair", Price: "35000" },
    { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "excellent", Price: "32000" },
    { Year: "2020", Make: "Porsche", Model: "Boxter", Condition: "good", Price: "72000" },
    { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
    { Year: "2020", Make: "Mercedes", Model: "GLC300", Condition: "good", Price: "53000" },
  ],
  [
    { Year: "2020", Make: "Honda", Model: "Civic", Condition: "poor", Price: "22000" },
    { Year: "2020", Make: "Honda", Model: "Accord", Condition: "poor", Price: "32000" },
    { Year: "2020", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "19000" },
    { Year: "2020", Make: "Hyundai", Model: "Elantra", Condition: "good", Price: "22000" },
    { Year: "2020", Make: "Toyota", Model: "Celica", Condition: "poor", Price: "5000" },
  ],
  [
    { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "good", Price: "25000" },
    { Year: "2020", Make: "Porsche", Model: "Boxter", Condition: "good", Price: "99000" },
    { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
    { Year: "2020", Make: "Mercedes", Model: "GLC300", Condition: "excellent", Price: "35000" },
    { Year: "2011", Make: "Honda", Model: "Civic", Condition: "good", Price: "9000" },
  ],
  [
    { Year: "2020", Make: "Honda", Model: "Accord", Condition: "good", Price: "34000" },
    { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
    { Year: "2020", Make: "Hyundai", Model: "Elantra", Condition: "fair", Price: "3000" },
    { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Price: "88001" },
    { Year: "2023", Make: "Hyundai", Model: "Santa Fe", Condition: "excellent", Price: "" },
  ],
];

export const expectedFirstPageTableData = expectedPaginatedTableData[0];

export const expectedPorscheRowsBeforeEditing = [
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "72000" },
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "99000" },
];

export const expectedPorscheRowsAfterEditing = [
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "66000" },
  { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "99000" },
];

export function clone(value) {
  return structuredClone(value);
}

export function removePropertyFromCollection(collection, columnsToExclude) {
  const cloned = clone(collection);

  if (!columnsToExclude) {
    return cloned;
  }

  for (const excludedColumn of columnsToExclude) {
    for (const row of cloned) {
      delete row[excludedColumn];
    }
  }

  return cloned;
}

export function sortedCollectionByProperty(collection, columnName, sortedBy, pageSizeLimit = pageSize) {
  const cloned = clone(collection);
  const direction = sortedBy === "desc" ? -1 : 1;

  return cloned
    .sort((a, b) => {
      const valueA = String(a[columnName] ?? "").toUpperCase();
      const valueB = String(b[columnName] ?? "").toUpperCase();
      if (valueA < valueB) return -1 * direction;
      if (valueA > valueB) return 1 * direction;
      return 0;
    })
    .slice(0, pageSizeLimit);
}

export function getSortedMileage(actualTableData) {
  return actualTableData
    .map((row) => row.Mileage)
    .sort((a, b) => Number(a) - Number(b));
}

export function expectRowsSubset(expect, actualRows, expectedRows) {
  for (const expectedRow of expectedRows) {
    expect(actualRows).toContainEqual(expectedRow);
  }
}
