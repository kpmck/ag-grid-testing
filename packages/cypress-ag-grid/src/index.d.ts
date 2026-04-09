/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Retrieves the values from the *displayed* page in ag grid and assigns each value to its respective column name.
     * @param options Provide an array of columns you wish to exclude from the table retrieval.
     */
    getAgGridData(options?: getAgGridElementsOptions): Chainable<Array<Record<string, string>>>;

    /**
     * Retrieves the values from the *displayed* page in ag grid and assigns each value to its respective column name.
     * @param options Provide an array of columns you wish to exclude from the table retrieval.
     */
    getAgGridElements<E extends Node = HTMLElement>(options?: getAgGridElementsOptions): Chainable<JQuery<E>>;

    /**
     * * Performs sorting operation on the specified column
     * @param {*} subject The get() selector for which ag grid table you wish to retrieve.
     * @param columnName The name of the column you wish to sort
     * @param sortDirection sort enum value
     */
    agGridSortColumn<E extends Node = HTMLElement>(columnName: string, sortDirection: string): Chainable<JQuery<E>>;

    /**
     * * Performs a filter operation on the specified column and selects only the provided filterValue
     * @param subject The get() selector for which ag grid table you wish to retrieve.
     * @param options Column filter options to filter on
     */
    agGridColumnFilterCheckboxMenu<E extends Node = HTMLElement>(options: agGridColumnFilterOptions<agGridColumnFilterSearchCriteriaOptions>): Chainable<JQuery<E>>;

    /**
     * * Performs a filter operation on the specified column via the context menu using plain text search
     * @param subject The get() selector for which ag grid table you wish to retrieve.
     * @param options Column filter options to filter on
     */
    agGridColumnFilterTextMenu<E extends Node = HTMLElement>(options: agGridColumnFilterOptions<agGridColumnFilterSearchCriteriaOptionsWithOperator>): Chainable<JQuery<E>>;

    /**
     *  * Performs a filter operation on the specified column via the column's floating filter field using plain text search
     * @param subject The get() selector for which ag grid table you wish to retrieve.
     * @param options Column filter options to filter on
     */
    agGridColumnFilterTextFloating<E extends Node = HTMLElement>(options: agGridColumnFilterOptions<agGridColumnFilterSearchCriteriaOptionsWithMultiFilter>): Chainable<JQuery<E>>;

    /**
     * * Validates the grid data across its pages. Performs a validation that the data exists on each page, not accounting for order.
     * @param {*} expectedPaginatedTableData Your paginated array to match the grid data.
     * @param {*} onlyColumns If specified, ONLY these columns will be validated. If left blank, all columns are validated.
     */
    agGridValidatePaginatedTable<E extends Node = HTMLElement>(
      expectedPaginatedTableData: any,
      onlyColumns?: string[]
    ): Chainable<JQuery<E>>;

    /**
     * * Performs an exact validation to verify the data exists within the displayed grid page.
     * @param {*} actualTableData The actual page data returned from the getAgGridData() command.
     * @param {*} expectedTableData The expected data to exist within the current grid page. Requires all columns and values exactly as shown in the grid, in the same order as shown in the grid.
     */
    agGridValidateRowsExactOrder<E extends Node = HTMLElement>(
      actualTableData: {},
      expectedTableData: {}
    ): Chainable<JQuery<E>>;

    /**
     * * Performs a deep include validation to verify the data exists within the displayed grid page
     * @param {*} actualTableData The actual page data returned from the getAgGridData() command.
     * @param {*} expectedTableData The expected data to exist within the current grid page. Does not need to be in any specific order.
     */
    agGridValidateRowsSubset<E extends Node = HTMLElement>(
      actualTableData: {},
      expectedTableData: {}
    ): Chainable<JQuery<E>>;

    /**
     * * Validates the Ag Grid table data is empty.
     * @param {*} actualTableData The actual page data returned from the getAgGridData() command.
     */
    agGridValidateEmptyTable<E extends Node = HTMLElement>(actualTableData: {}): Chainable<JQuery<E>>;

    /**
     * * Will add or remove a column from ag grid.
     * @param columnName The column name to add/remove
     * @param doRemove true will remove the column. false will add the column.
     */
    agGridToggleColumnsSideBar<E extends Node = HTMLElement>(
      columnName: string,
      doRemove: boolean
    ): Chainable<JQuery<E>>;
  }
}

interface agGridColumnFilterOptions<TSearchCriteria> {
  searchCriteria: TSearchCriteria,
  /** True if "Apply" button is used, false if filters by text input automatically. */
  hasApplyButton?: boolean,
  selectAllLocaleText?: string,
  noMenuTabs?: boolean,
}


interface getAgGridElementsOptions {
  /** Define columns to select from */
  onlyColumns?: string[],
  /** If true, return headers & rows values as arrays instead of mapping as objects */
  valuesArray?: boolean
}

interface agGridColumnFilterSearchCriteriaOptions {
  /** Name of the column to filter */
  columnName: string,
  /** Value to input into the filter textbox */
  filterValue: string
}

interface agGridColumnFilterSearchCriteriaOptionsWithOperator extends agGridColumnFilterSearchCriteriaOptions {
  /** Use if using a search operator (i.e. Less Than, Equals, etc...use filterOperator.enum values) */
  operator?: string
}

interface agGridColumnFilterSearchCriteriaOptionsWithMultiFilter extends agGridColumnFilterSearchCriteriaOptionsWithOperator {
  /** Index of which visible filter input to use when the floating filter renders multiple inputs */
  searchInputIndex?: number
  /** Index of which visible operator dropdown to use when the floating filter renders multiple conditions */
  operatorIndex?: number
  /** Use if floating filter is multiselect checkboxes vs free form input */
  isMultiFilter?: boolean
}
