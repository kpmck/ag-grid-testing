import { filterOperator } from "../../../src/agGrid/filterOperator.enum";

const agGridSelector = "#myGrid2";

export function runAgGridElementsSuite({ pagePath, versionLabel }) {
  describe(`ag-grid get elements scenario (${versionLabel})`, () => {
    beforeEach(() => {
      cy.visit(pagePath);
      cy.contains(".example-version", `AG Grid ${versionLabel}`).should("be.visible");
      cy.get(".ag-cell", { timeout: 10000 }).should("be.visible");
    });

    it("able to update grid cell value", () => {
      cy.get(agGridSelector).agGridColumnFilterTextFloating({
        searchCriteria: {
          columnName: "Make",
          filterValue: "Porsche",
          operator: filterOperator.equals,
        },
        hasApplyButton: true,
      });

      const expectedTableBeforeEditing = [
        { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "72000" },
        { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "99000" },
      ];

      cy.get(agGridSelector)
        .getAgGridData()
        .then((tableData) => {
          cy.agGridValidateRowsSubset(tableData, expectedTableBeforeEditing);
        });

      cy.get(agGridSelector)
        .getAgGridElements()
        .then((tableElements) => {
          const porscheRow = tableElements.find(
            (row) => row.Price.innerText === "72000"
          );
          const priceCell = porscheRow.Price;
          cy.wrap(priceCell).dblclick().type("66000{enter}");
        });

      const expectedTableAfterEditing = [
        { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "66000" },
        { Year: "2020", Make: "Porsche", Model: "Boxter", Price: "99000" },
      ];

      cy.get(agGridSelector)
        .getAgGridData()
        .then((tableData) => {
          cy.agGridValidateRowsSubset(tableData, expectedTableAfterEditing);
        });
    });
  });
}
