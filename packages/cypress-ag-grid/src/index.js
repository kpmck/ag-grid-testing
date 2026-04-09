/// <reference types="cypress" />

import {agGridWaitForAnimation, getAgGridData, getAgGridElements, sortColumnBy} from "./agGrid/agGridInteractions"
import {validateTablePages, validateTableExactOrder, validateEmptyTable, validateTableRowSubset} from "./agGrid/agGridValidations"
import {filterByCheckboxColumnMenu, filterBySearchTextColumnFloatingFilter, filterBySearchTextColumnMenu, toggleColumnFromSideBar, pinColumn} from "./agGrid/agGridInteractions";

Cypress.Commands.add('getAgGridData', { prevSubject: true }, getAgGridData);
Cypress.Commands.add('getAgGridElements', {prevSubject: true}, getAgGridElements);
Cypress.Commands.add('agGridSortColumn', {prevSubject: true}, sortColumnBy);
Cypress.Commands.add('agGridColumnFilterCheckboxMenu', {prevSubject: true}, filterByCheckboxColumnMenu)
Cypress.Commands.add('agGridColumnFilterTextMenu', {prevSubject: true}, filterBySearchTextColumnMenu)
Cypress.Commands.add('agGridColumnFilterTextFloating', {prevSubject: true}, filterBySearchTextColumnFloatingFilter)

Cypress.Commands.add('agGridValidatePaginatedTable', {prevSubject: 'optional'}, validateTablePages)
Cypress.Commands.add('agGridValidateRowsExactOrder', {prevSubject: 'optional'}, validateTableExactOrder)
Cypress.Commands.add('agGridValidateRowsSubset', {prevSubject: 'optional'}, validateTableRowSubset)
Cypress.Commands.add('agGridValidateEmptyTable', {prevSubject: 'optional'}, validateEmptyTable)

Cypress.Commands.add('agGridToggleColumnsSideBar', {prevSubject: true}, toggleColumnFromSideBar)
Cypress.Commands.add('agGridPinColumn', {prevSubject: true}, pinColumn)

Cypress.Commands.add('agGridWaitForAnimation', { prevSubject: 'element' }, agGridWaitForAnimation);