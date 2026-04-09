export function validateEmptyTable(agGridElement, actualTableData){
    expect(actualTableData).to.be.empty;
}

export function validateTableExactOrder(agGridElement, actualTableData,expectedTableData, showFullError = true){
    let errorMessage = `The expected table data did not match the actual table data`

    if(showFullError){
        errorMessage = errorMessage + ` \r\nEXPECTED:\r\n${JSON.stringify(expectedTableData)}\r\nACTUAL:\r\n:${JSON.stringify(actualTableData)}`
    }

    expect(actualTableData, errorMessage).to.deep.equal(expectedTableData);
}

export function validateTableRowSubset(agGridElement, actualTableData,expectedTableData, showFullError = true){
    let errorMessage = `The expected item does not exist in the actual table data`

    if(showFullError){
        errorMessage = errorMessage + ` \r\nEXPECTED:\r\n${JSON.stringify(expectedTableData)}\r\nACTUAL:\r\n:${JSON.stringify(actualTableData)}`
    }

    expectedTableData.forEach((item)=> expect(actualTableData, errorMessage).to.deep.include(item));
}

export function validateTablePages(agGridElement,expectedPaginatedTableData, onlyColumns = {}) {
    let iterator = 0;
    expectedPaginatedTableData.forEach((expectedPage) => {
        cy.get('.ag-cell').should('be.visible');
        cy.get(agGridElement)
            .getAgGridData(onlyColumns)
            .then((table) => {
                const actualPage = JSON.parse(JSON.stringify(table));
                validateTableExactOrder(agGridElement, actualPage, expectedPage, true);
                cy.get(agGridElement).find(".ag-icon-next").click();
                iterator++;
            });
    });
}
