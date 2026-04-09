/// <reference types="cypress" />

import { sort } from "../../../src/agGrid/sort.enum";
import {
  deleteKey,
  sortedCollectionByProperty,
} from "../../../src/helpers/arrayHelpers";
import { filterOperator } from "../../../src/agGrid/filterOperator.enum";

const pageSize = 5;
const agGridSelector = "#myGrid";
const expectedPaginatedTableData = [
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

export function runAgGridDataSuite({ pagePath, versionLabel }) {
  describe(`ag-grid get data scenarios (${versionLabel})`, () => {
    beforeEach(() => {
      cy.visit(pagePath);
      cy.contains(".example-version", `AG Grid ${versionLabel}`).should("be.visible");
      cy.get(".ag-cell", { timeout: 10000 }).should("be.visible");
      cy.get("#floating").click();
    });

    it("verify paginated table data - any order - include all columns", () => {
      cy.get(agGridSelector).agGridValidatePaginatedTable(
        expectedPaginatedTableData
      );
    });

    it("verify paginated table data - exact order - include all columns", () => {
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedPaginatedTableData[0]);
        });
    });

    it("verify exact order table data when columns are not in order - include all columns", () => {
      cy.get(agGridSelector).agGridPinColumn("Price", "left");

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedPaginatedTableData[0]);
        });
    });

    it("verify paginated table data - excluding columns", () => {
      const expectedSubset = [
        [
          { Year: "2020", Make: "Toyota", Model: "Celica" },
          { Year: "2020", Make: "Ford", Model: "Mondeo" },
          { Year: "2020", Make: "Porsche", Model: "Boxter" },
          { Year: "2020", Make: "BMW", Model: "3-series" },
          { Year: "2020", Make: "Mercedes", Model: "GLC300" },
        ],
        [
          { Year: "2020", Make: "Honda", Model: "Civic" },
          { Year: "2020", Make: "Honda", Model: "Accord" },
          { Year: "2020", Make: "Ford", Model: "Taurus" },
          { Year: "2020", Make: "Hyundai", Model: "Elantra" },
          { Year: "2020", Make: "Toyota", Model: "Celica" },
        ],
        [
          { Year: "2020", Make: "Ford", Model: "Mondeo" },
          { Year: "2020", Make: "Porsche", Model: "Boxter" },
          { Year: "2020", Make: "BMW", Model: "3-series" },
          { Year: "2020", Make: "Mercedes", Model: "GLC300" },
          { Year: "2011", Make: "Honda", Model: "Civic" },
        ],
        [
          { Year: "2020", Make: "Honda", Model: "Accord" },
          { Year: "1990", Make: "Ford", Model: "Taurus" },
          { Year: "2020", Make: "Hyundai", Model: "Elantra" },
          { Year: "2020", Make: "BMW", Model: "2002" },
          { Year: "2023", Make: "Hyundai", Model: "Santa Fe" },
        ],
      ];

      cy.get(agGridSelector).agGridValidatePaginatedTable(expectedSubset, {
        onlyColumns: ["Year", "Make", "Model"],
      });
    });

    it("able to filter by checkbox", () => {
      const expectedTableData = [
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Price: "88001" },
      ];
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Model",
          filterValue: "2002",
        },
        selectAllLocaleText: "(Select All)",
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData);
        });
    });

    it("able to filter by checkbox - multiple columns", () => {
      cy.get("#nonFloating").click();
      const expectedTableData = [
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Price: "88001" },
      ];

      cy.get(agGridSelector).agGridColumnFilterCheckboxMenu({
        searchCriteria: [
          {
            columnName: "Model",
            filterValue: "2002",
          },
          {
            columnName: "Model",
            filterValue: "3-series",
          },
        ],
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData, true);
        });
    });

    it("able to filter by text - menu", () => {
      const expectedTableData = [
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
        { Year: "2020", Make: "Honda", Model: "Accord", Condition: "poor", Price: "32000" },
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "excellent", Price: "32000" },
      ];
      cy.get(agGridSelector).agGridSortColumn("Model", sort.ascending);
      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Price",
          filterValue: "32000",
          operator: filterOperator.equals,
        },
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData);
        });
    });

    it("able to filter by text - menu - multiple columns", () => {
      cy.get("#nonFloating").click();
      const expectedTableData = [
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
      ];
      cy.get(agGridSelector).agGridSortColumn("Model", sort.ascending);
      cy.get(agGridSelector).agGridColumnFilterTextMenu({
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
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData);
        });
    });

    it("able to filter by text - menu - contains operator", () => {
      const expectedTableData = [
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "excellent", Price: "32000" },
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "good", Price: "25000" },
        { Year: "2020", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "19000" },
        { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
      ];

      cy.get(agGridSelector).agGridSortColumn("Model", sort.ascending);
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "ord",
          operator: filterOperator.contains,
          floatingFilter: true,
        },
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData);
        });
    });

    it("able to filter by text - menu - does not contain operator", () => {
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "ord",
          operator: filterOperator.notContains,
        },
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(actualTableData.length).to.be.greaterThan(0);
          actualTableData.forEach((row) => {
            expect(row.Make).to.not.contain("ord");
          });
        });
    });

    it("able to filter by text - menu - does not equal operator", () => {
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "Ford",
          operator: filterOperator.notEquals,
        },
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(actualTableData.length).to.be.greaterThan(0);
          actualTableData.forEach((row) => {
            expect(row.Make).to.not.equal("Ford");
          });
        });
    });

    it("able to filter by text - menu - less than operator", () => {
      enableMileageNumberFilter();

      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "5000",
          operator: filterOperator.lessThan,
        },
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(getSortedMileage(actualTableData)).to.deep.equal(["250", "1000", "3500", "4500"]);
        });
    });

    it("able to filter by text - menu - less than or equal operator", () => {
      enableMileageNumberFilter();

      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "5000",
          operator: filterOperator.lessThanOrEquals,
        },
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(getSortedMileage(actualTableData)).to.deep.equal(["250", "1000", "3500", "4500", "5000"]);
        });
    });

    it("able to filter by text - menu - greater than operator", () => {
      enableMileageNumberFilter();

      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "50000",
          operator: filterOperator.greaterThan,
        },
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(getSortedMileage(actualTableData)).to.deep.equal(["52000", "60000", "70000", "90000"]);
        });
    });

    it("able to filter by text - menu - greater than or equal operator", () => {
      enableMileageNumberFilter();

      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Mileage",
          filterValue: "50000",
          operator: filterOperator.greaterThanOrEquals,
        },
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(getSortedMileage(actualTableData)).to.deep.equal(["52000", "60000", "70000", "90000"]);
        });
    });

    it("able to filter by text - floating filter", () => {
      const expectedTableData = [
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "excellent", Price: "32000" },
        { Year: "2020", Make: "Ford", Model: "Mondeo", Condition: "good", Price: "25000" },
        { Year: "2020", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "19000" },
        { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
      ];

      cy.get(agGridSelector).agGridSortColumn("Model", sort.ascending);
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "Ford",
        },
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData);
        });
    });

    it("able to filter by text - floating filter - multiple conditions", () => {
      const expectedTableData = [
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Price: "88001" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "poor", Price: "32000" },
      ];

      cy.get(agGridSelector).agGridSortColumn("Model", sort.ascending);
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "B",
          searchInputIndex: 0,
        },
        hasApplyButton: true,
      });
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "MW",
          searchInputIndex: 1,
        },
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsExactOrder(actualTableData, expectedTableData);
        });
    });

    it("able to filter by text - floating filter - multiple columns", () => {
      const expectedTableData = [
        { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
      ];
      cy.get(agGridSelector).agGridSortColumn("Model", sort.ascending);
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: [
          {
            columnName: "Make",
            filterValue: "Ford",
          },
          {
            columnName: "Year",
            filterValue: "1990",
          },
        ],
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.get(agGridSelector).agGridValidateRowsExactOrder(
            actualTableData,
            expectedTableData
          );
        });
    });

    it("able to filter by text - floating filter - between operator", () => {
      const expectedTableData = [
        { Year: "2023", Make: "Hyundai", Model: "Santa Fe", Condition: "excellent", Mileage: "250", Price: "" },
        { Year: "2020", Make: "Porsche", Model: "Boxter", Condition: "good", Mileage: "1000", Price: "99000" },
        { Year: "2020", Make: "Hyundai", Model: "Elantra", Condition: "fair", Mileage: "3500", Price: "3000" },
        { Year: "2020", Make: "BMW", Model: "2002", Condition: "excellent", Mileage: "4500", Price: "88001" },
      ];

      cy.window().then((win) => {
        win.setColumnFilter("mileage", "agNumberColumnFilter", true, false);
      });
      cy.get(".ag-cell").should("be.visible");

      cy.get(agGridSelector).agGridColumnFilterTextFloating({
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

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          const sortedActualTableData = [...actualTableData].sort(
            (a, b) => Number(a.Mileage) - Number(b.Mileage)
          );
          const sortedExpectedTableData = [...expectedTableData].sort(
            (a, b) => Number(a.Mileage) - Number(b.Mileage)
          );

          cy.agGridValidateRowsExactOrder(
            sortedActualTableData,
            sortedExpectedTableData
          );
        });
    });

    it("able to filter by text - floating filter - between operator with explicit indexes", () => {
      enableMileageNumberFilter(true);

      if (versionLabel === "v33") {
        cy.get(agGridSelector).agGridColumnFilterTextFloating({
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
        cy.get(agGridSelector).agGridColumnFilterTextFloating({
          searchCriteria: {
            columnName: "Mileage",
            filterValue: "0",
            operator: filterOperator.inRange,
            searchInputIndex: 0,
            operatorIndex: 0,
          },
          hasApplyButton: true,
        });

        cy.get(agGridSelector).agGridColumnFilterTextFloating({
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

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(getSortedMileage(actualTableData)).to.deep.equal(["250", "1000", "3500", "4500"]);
        });
    });

    it("able to filter by text - floating filter - between operator with mixed criteria", () => {
      enableMileageNumberFilter(true);
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
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

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateEmptyTable(actualTableData);
        });
    });

    it("able to filter by text - floating filter - between operator without apply button", () => {
      enableMileageNumberFilter(true);

      cy.get(agGridSelector).agGridColumnFilterTextFloating({
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

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(getSortedMileage(actualTableData)).to.deep.equal(["250", "1000", "3500", "4500"]);
        });
    });

    it("able to filter by text - floating filter - multi filter", () => {
      const expectedTableData = [
        { Year: "2020", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "19000" },
        { Year: "1990", Make: "Ford", Model: "Taurus", Condition: "excellent", Price: "900" },
      ];
      cy.get(agGridSelector).agGridSortColumn("Model", sort.ascending);
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: [
          {
            columnName: "Model",
            filterValue: "Taurus",
            isMultiFilter: true,
          },
        ],
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.get(agGridSelector).agGridValidateRowsExactOrder(
            actualTableData,
            expectedTableData
          );
        });
    });

    it("able to validate empty table", () => {
      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Price",
          filterValue: "0",
          operator: filterOperator.equals,
        },
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateEmptyTable(actualTableData);
        });
    });

    it("able to sort by ascending order", () => {
      cy.get(agGridSelector).agGridSortColumn("Make", sort.ascending);
      cy.fixture("cardata").then((carData) => {
        removePropertyFromCollection(carData, ["Mileage"]);
        const expectedDataSortedByAscending = sortedCollectionByProperty(
          carData,
          "Make",
          sort.ascending,
          pageSize
        );
        cy.get(agGridSelector)
          .getAgGridData()
          .then((actualTableData) => {
            cy.agGridValidateRowsExactOrder(
              actualTableData,
              expectedDataSortedByAscending
            );
          });
      });
    });

    it("able to sort by descending order", () => {
      cy.get(agGridSelector).agGridSortColumn("Make", sort.descending);
      cy.fixture("cardata").then((carData) => {
        removePropertyFromCollection(carData, ["Mileage"]);
        const expectedDataSortedByDescending = sortedCollectionByProperty(
          carData,
          "Make",
          sort.descending,
          pageSize
        );
        cy.get(agGridSelector)
          .getAgGridData()
          .then((actualTableData) => {
            cy.agGridValidateRowsExactOrder(
              actualTableData,
              expectedDataSortedByDescending
            );
          });
      });
    });

    it("remove column from grid and verify select column data", () => {
      cy.get(agGridSelector).agGridToggleColumnsSideBar("Year", true);
      cy.fixture("cardata").then((expectedTableData) => {
        removePropertyFromCollection(expectedTableData, ["Mileage"]);
        const expectedDataYearColumnRemoved = removePropertyFromCollection(
          expectedTableData,
          ["Year"]
        );
        cy.get(agGridSelector)
          .getAgGridData()
          .then((actualTableData) => {
            cy.agGridValidateRowsExactOrder(
              actualTableData,
              expectedDataYearColumnRemoved.slice(0, pageSize)
            );
          });
      });
    });

    it("remove single pinned column from grid and verify select column data", () => {
      cy.get(agGridSelector).agGridToggleColumnsSideBar("Price", true);
      cy.fixture("cardata").then((expectedTableData) => {
        removePropertyFromCollection(expectedTableData, ["Mileage"]);
        const expectedDataPriceColumnRemoved = removePropertyFromCollection(
          expectedTableData,
          ["Price"]
        );

        cy.get(agGridSelector)
          .getAgGridData()
          .then((actualTableData) => {
            cy.agGridValidateRowsExactOrder(
              actualTableData,
              expectedDataPriceColumnRemoved.slice(0, pageSize)
            );
          });
      });
    });

    it("remove multiple columns from grid and verify select column data", () => {
      cy.get(agGridSelector).agGridToggleColumnsSideBar("Price", true);
      cy.get(agGridSelector).agGridToggleColumnsSideBar("Make", true);
      cy.fixture("cardata").then((expectedTableData) => {
        removePropertyFromCollection(expectedTableData, ["Mileage"]);
        const expectedDataMultipleColumnsRemoved = removePropertyFromCollection(
          expectedTableData,
          ["Price", "Make"]
        );
        cy.get(agGridSelector)
          .getAgGridData()
          .then((actualTableData) => {
            cy.agGridValidateRowsExactOrder(
              actualTableData,
              expectedDataMultipleColumnsRemoved.slice(0, pageSize)
            );
          });
      });
    });

    it("only validate select column data", () => {
      const expectedTableData = [
        { Year: "2020", Make: "Toyota", Model: "Celica" },
        { Year: "2020", Make: "Ford", Model: "Mondeo" },
        { Year: "2020", Make: "Porsche", Model: "Boxter" },
        { Year: "2020", Make: "BMW", Model: "3-series" },
        { Year: "2020", Make: "Mercedes", Model: "GLC300" },
      ];
      cy.get(agGridSelector)
        .getAgGridData({ onlyColumns: ["Year", "Make", "Model"] })
        .then((actualTableData) => {
          cy.agGridValidateRowsSubset(actualTableData, expectedTableData);
        });
    });

    it("able to filter by 'Blank'", () => {
      const expectedTableData = [
        { Year: "2023", Make: "Hyundai", Model: "Santa Fe", Condition: "excellent", Price: "" },
      ];

      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Price",
          operator: filterOperator.blank,
        },
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsSubset(actualTableData, expectedTableData);
        });
    });

    it("able to filter by 'Not blank'", () => {
      cy.get(agGridSelector).agGridColumnFilterTextMenu({
        searchCriteria: {
          columnName: "Price",
          operator: filterOperator.notBlank,
        },
        hasApplyButton: true,
      });
      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          expect(actualTableData.length).to.be.greaterThan(0);
          actualTableData.forEach((row) => {
            expect(row.Price).to.not.equal("");
          });
        });
    });

    it("able to filter by agTextColumnFilter with join operator", () => {
      const expectedTableData = [
        { Year: "2020", Make: "Toyota", Model: "Celica", Condition: "fair", Price: "35000" },
        { Year: "2020", Make: "BMW", Model: "3-series", Condition: "fair", Price: "45000" },
        { Year: "2020", Make: "Hyundai", Model: "Elantra", Condition: "fair", Price: "3000" },
      ];
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Condition",
          operator: filterOperator.startsWith,
          filterValue: "f",
          searchInputIndex: 0,
        },
        multiple: true,
        hasApplyButton: true,
      });

      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Condition",
          operator: filterOperator.endsWith,
          filterValue: "ir",
          searchInputIndex: 1,
        },
        multiple: true,
        hasApplyButton: true,
      });

      cy.get(agGridSelector)
        .getAgGridData()
        .then((actualTableData) => {
          cy.agGridValidateRowsSubset(actualTableData, expectedTableData);
        });
    });
  });
}

function removePropertyFromCollection(expectedTableData, columnsToExclude) {
  if (columnsToExclude) {
    columnsToExclude.forEach((excludedColumn) => {
      expectedTableData.forEach((obj) => deleteKey(obj, excludedColumn));
    });
  }
  return expectedTableData;
}

function enableMileageNumberFilter(floatingFilter = false) {
  cy.window().then((win) => {
    win.setColumnFilter("mileage", "agNumberColumnFilter", floatingFilter, false);
  });
  cy.get(".ag-cell").should("be.visible");
}

function getSortedMileage(actualTableData) {
  return actualTableData
    .map((row) => row.Mileage)
    .sort((a, b) => Number(a) - Number(b));
}
