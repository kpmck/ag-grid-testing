/// <reference types="cypress" />
import {
  extractAgGridData,
  extractAgGridElements,
  filterOperator,
  filterTab,
  sort,
  waitForAgGridAnimation,
} from "@kpmck/ag-grid-core";

function getSingleAgGridRootElement(agGridElement) {
  const rootElements = agGridElement.get();

  if (rootElements.length < 1) {
    throw new Error(`Couldn't find the element ${agGridElement}`);
  }

  if (rootElements.length > 1) {
    throw new Error(
      `Selector "${agGridElement.selector}" returned more than 1 element.`
    );
  }

  return rootElements[0];
}

export const agGridWaitForAnimation = async (agGridElement) => {
  await waitForAgGridAnimation(getSingleAgGridRootElement(agGridElement));
  return agGridElement;
};

/**
 * Retrieves the values from the *displayed* page in ag grid and assigns each value to its respective column name.
 * @param agGridElement The get() selector for which ag grid table you wish to retrieve.
 * @param options Provide an array of columns you wish to exclude from the table retrieval.
 */
export const getAgGridData = async (agGridElement, options = {}) => {
  return extractAgGridData(getSingleAgGridRootElement(agGridElement), options);
};

/**
 * Retrieves the values from the *displayed* page in ag grid and assigns each value to its respective column name.
 * @param agGridElement The get() selector for which ag grid table you wish to retrieve.
 * @param options Provide an array of columns you wish to exclude from the table retrieval.
 */
export const getAgGridElements = async (agGridElement, options = {}) => {
  return extractAgGridElements(
    getSingleAgGridRootElement(agGridElement),
    options
  );
};

/**
 * Retrieve the ag grid column header element based on its column name value
 * @param columnName The name of the column's header to retrieve.
 */
function getColumnHeaderElement(agGridElement, columnName) {
  return cy
    .get(agGridElement)
    .find(".ag-header-cell-text")
    .contains(new RegExp("^" + columnName + "$", "g"));
}

/**
 *  * Performs sorting operation on the specified column
 * @param {*} agGridElement The get() selector for which ag grid table you wish to retrieve.
 * @param columnName The name of the column you wish to sort
 * @param sortDirection sort enum value
 * @returns
 */
export function sortColumnBy(agGridElement, columnName, sortDirection) {
  if (sortDirection.toLowerCase() === "ascending") {
    sortDirection = "asc";
  } else if (sortDirection.toLowerCase() === "descending") {
    sortDirection = "desc";
  }

  if (sortDirection === sort.ascending || sortDirection === sort.descending) {
    return getColumnHeaderElement(agGridElement, columnName)
      .parents(".ag-header-cell .ag-cell-label-container")
      .invoke("attr", "class")
      .then((value) => {
        cy.log(`sort: ${sortDirection}`);
        if (!value.includes(`ag-header-cell-sorted-${sortDirection}`)) {
          getColumnHeaderElement(agGridElement, columnName).click();
          sortColumnBy(agGridElement, columnName, sortDirection);
        }
      });
  } else {
    throw new Error("sortDirection must be either 'asc' or 'desc'.");
  }
}

function getMenuTabElement(agGridElement, tab) {
  return cy
    .get(agGridElement)
    .find(".ag-tab")
    .find(`.ag-icon-${tab}`)
    .filter(":visible");
}

/**
 * Will select the specified filter tab if it is not already selected
 * @param tab
 */
function selectMenuTab(agGridElement, tab) {
  cy.get(agGridElement).then((agGr) => {
    if (agGr.find('.ag-menu-list').length > 0) {
      cy.log('Menu uses a list, not tabs');
    } else {
      getMenuTabElement(agGridElement, tab).then(($ele) => {
        cy.wrap($ele)
          .parent("span")
          .invoke("attr", "class")
          .then(($attr) => {
            if (!$attr.includes("selected")) {
              cy.wrap($ele).click();
            }
          });
      });
    }
  })
}

/**
 * Returns the filter button element for a specified column
 * @param columnName
 */
function getFilterColumnButtonElement(
  agGridElement,
  columnName,
  isFloatingFilter = false
) {
  if (isFloatingFilter) {
    return getColumnHeaderElement(agGridElement, columnName)
      .parents(".ag-header-cell")
      .then(($headerCell) => {
        const columnIndex = $headerCell.attr("aria-colindex");
        const visibleHeaderCells = $headerCell
          .closest(".ag-header")
          .find(".ag-header-row-column .ag-header-cell:visible");
        const headerPosition = visibleHeaderCells.index($headerCell);

        return cy.get(agGridElement).then(($gridElement) => {
          const usesV35FloatingFilterRow =
            $gridElement.find(".ag-header-row-filter").length > 0;

          let floatingFilterButton;

          if (usesV35FloatingFilterRow) {
            floatingFilterButton = $gridElement.find(
              `.ag-header-row-filter .ag-header-cell[aria-colindex="${columnIndex}"] .ag-floating-filter-button:visible`
            );

            if (!floatingFilterButton.length && headerPosition > -1) {
              floatingFilterButton = $gridElement
                .find(".ag-header-row-filter .ag-floating-filter-button:visible")
                .eq(headerPosition);
            }
          } else {
            floatingFilterButton = $gridElement.find(
              `.ag-header-row-column-filter .ag-header-cell[aria-colindex="${columnIndex}"] .ag-floating-filter-button-button:visible`
            );

            if (!floatingFilterButton.length && headerPosition > -1) {
              floatingFilterButton = $gridElement
                .find(
                  ".ag-header-row-column-filter .ag-floating-filter-button-button:visible"
                )
                .eq(headerPosition);
            }
          }

          return cy.wrap(floatingFilterButton.first());
        });
      });
  } else {
    return getColumnHeaderElement(agGridElement, columnName)
      .parent()
      .siblings(".ag-header-cell-filter-button");
  }
}

/**
 *
 * @param filterValue value to input into the filter textbox
 * @param operator (optional) use if using a search operator (i.e. Less Than, Equals, etc...use filterOperator.enum values)
 * @param noMenuTabs (optional) boolean indicating if the menu has tabs.
 */
function filterBySearchTerm(agGridElement, options) {
  const filterValue = options.searchCriteria.filterValue;
  const operator = options.searchCriteria.operator;
  const searchInputIndex = options.searchCriteria.searchInputIndex || 0;
  const operatorIndex =
    options.searchCriteria.operatorIndex ??
    (operator === filterOperator.inRange ? 0 : searchInputIndex);
  const isMultiFilter = options.searchCriteria.isMultiFilter;
  const noMenuTabs = options.noMenuTabs;

  // Navigate to the filter tab
  // if (!noMenuTabs) {
  //   selectMenuTab(agGridElement, filterTab.filter);
  // }

  if (operator) {
    const elem = cy
      .get(agGridElement)
      .find(".ag-filter")
      .find(".ag-picker-field-wrapper")
      .filter(":visible")
      .eq(operatorIndex);
    cy.get(agGridElement).agGridWaitForAnimation();
    elem.click();
    cy.get(agGridElement)
      .find(".ag-popup .ag-list")
      .find("span")
      .contains(operator)
      .click();
  }
  // Input filter term and allow grid a moment to render the results
  if (
    operator !== filterOperator.blank &&
    operator !== filterOperator.notBlank
  ) {
    cy.get(agGridElement)
      .find(".ag-popup-child")
      .find("input")
      .filter(":visible")
      .as("filterInput");
  }

  // If it's a multi filter, de-select the 'select-all' checkbox
  if (isMultiFilter) {
    const selectAllText = options.selectAllLocaleText || "(Select All)";
    toggleColumnCheckboxFilter(agGridElement, selectAllText, false, true);
  }

  // Get the saved filter input and enter the search term
  if (
    operator !== filterOperator.blank &&
    operator !== filterOperator.notBlank
  ) {
    cy.get("@filterInput").then(($ele) => {
      cy.wrap($ele).eq(searchInputIndex).clear().type(filterValue + '{enter}');
    });
  }

  // Finally, if a multi-filter, select the filter value's checkbox
  if (isMultiFilter) {
    toggleColumnCheckboxFilter(agGridElement, filterValue, true, true);
  }
}

function applyColumnFilter(agGridElement, hasApplyButton, noMenuTabs) {
  if (hasApplyButton) {
    cy.get(agGridElement)
      .find(".ag-filter-apply-panel-button")
      .contains("Apply")
      .click();
  }
  if (!noMenuTabs) {
    cy.get(agGridElement).then((agGr) => {
      if (agGr.find('.ag-tab').length === 0) {
        cy.log('Menu uses a list, not tabs');
        cy.get(agGridElement).agGridWaitForAnimation();
      } else {
        getMenuTabElement(agGridElement, filterTab.filter).click();
      }
    })
  }
}

/**
 * Either toggle
 * @param filterValue
 * @param doSelect
 * @param hasTabs
 */
function toggleColumnCheckboxFilter(
  agGridElement,
  filterValue,
  doSelect,
  noMenuTabs = false
) {
  // if (!noMenuTabs) {
  //   selectMenuTab(agGridElement, filterTab.filter);
  // }
  cy.get(agGridElement)
    .find(".ag-input-field-label")
    .contains(filterValue)
    .siblings("div")
    .find("input")
    .then(($ele) => {
      if (doSelect) cy.wrap($ele).check();
      else cy.wrap($ele).uncheck();
    });
}

function populateSearchCriteria(
  searchCriteria,
  hasApplyButton = false,
  noMenuTabs = false,
  selectAllLocaleText = "(Select All)"
) {
  const options = {};
  options.searchCriteria = { ...searchCriteria };
  options.selectAllLocaleText = selectAllLocaleText;
  options.hasApplyButton = hasApplyButton;
  options.noMenuTabs = noMenuTabs;
  return options;
}

/**
 * Will add or remove a column from ag grid.
 * @param columnName The column name to add/remove
 * @param pin 'left', 'right' or null
 */
export function pinColumn(agGridElement, columnName, pin) {
  getColumnHeaderElement(agGridElement, columnName)
    .parent()
    .siblings(".ag-header-cell-menu-button")
    .click();

  selectMenuTab(agGridElement, filterTab.general);

  cy.get(agGridElement).find(".ag-menu-option").contains("Pin Column").click();

  var selectedOption;

  switch (pin) {
    case "left":
      selectedOption = "Pin Left";
      break;
    case "right":
      selectedOption = "Pin Right";
      break;
    default:
      selectedOption = "No Pin";
      break;
  }

  cy.get(agGridElement)
    .find(".ag-menu-option")
    .contains(selectedOption)
    .click();
}

/**
 *  * Performs a filter operation on the specified column via the context menu using plain text search
 * @param agGridElement The get() selector for which ag grid table you wish to retrieve.
 * @param {{searchCriteria:[{columnName:string,filterValue:string,operator?:string}], hasApplyButton?:boolean}} options JSON with search properties
 * @param options.searchCriteria JSON with search properties
 * @param options.searchCriteria.columnName [REQUIRED] name of the column to filter
 * @param options.searchCriteria.filterValue [REQUIRED] value to input into the filter textbox
 * @param options.searchCriteria.operator [Optional] Use if using a search operator (i.e. Less Than, Equals, etc...use filterOperator.enum values).
 * @param options.hasApplyButton [Optional] True if "Apply" button is used, false if filters by text input automatically.
 * @param options.noMenuTabs [Optional] True if you use for example the community edition of ag-grid, which has no menu tabs
 */
export function filterBySearchTextColumnMenu(agGridElement, options) {
  // Check if there are multiple search criteria provided by attempting to access the columnName
  if (!options.searchCriteria.columnName) {
    options.searchCriteria.forEach((_searchCriteria) => {
      const _options = populateSearchCriteria(
        _searchCriteria,
        options.hasApplyButton,
        options.noMenuTabs,
        options.isMultiFilter
      );
      _filterBySearchTextColumnMenu(agGridElement, _options);
    });
  } else {
    _filterBySearchTextColumnMenu(agGridElement, options);
  }
}

function _filterBySearchTextColumnMenu(agGridElement, options) {
  // Get the header's menu element
  getFilterColumnButtonElement(
    agGridElement,
    options.searchCriteria.columnName
  ).click();
  filterBySearchTerm(agGridElement, options);
  applyColumnFilter(agGridElement, options.hasApplyButton, options.noMenuTabs);
}

/**
 *  * Performs a filter operation on the specified column via the column's floating filter field using plain text search
 * @param agGridElement The get() selector for which ag grid table you wish to retrieve.
 * @param {{searchCriteria:[{columnName:string,filterValue:string,operator?:string}], hasApplyButton?:boolean, noMenuTab?:boolean, selectAllLocaleText:string}} options JSON with search properties
 * @param options.searchCriteria JSON with search properties and options
 * @param options.searchCriteria.columnName name of the column to filter
 * @param options.searchCriteria.filterValue value to input into the filter textbox
 * @param options.searchCriteria.searchInputIndex [Optional] Uses 0 by default. Index of which filter box to use in event of having multiple search conditionals
 * @param options.searchCriteria.operator [Optional] Use if using a search operator (i.e. Less Than, Equals, etc...use filterOperator.enum values).
 * @param options.hasApplyButton [Optional] True if "Apply" button is used, false if filters by text input automatically.
 * @param options.noMenuTabs [Optional] True if you use, for example, the community edition of ag-grid, which has no menu tabs
 * @param options.selectAllLocaleText [Optional] Pass in the locale text value of "(Select All)" for when you are filtering by checkbox - this wil first deselect the "(Select All)" option before selecting your filter value
 */
export function filterBySearchTextColumnFloatingFilter(agGridElement, options) {
  // Check if there are multiple search criteria provided by attempting to access the columnName
  if (!options.searchCriteria.columnName) {
    groupFloatingFilterSearchCriteria(
      normalizeFloatingFilterSearchCriteria(options.searchCriteria)
    ).forEach((searchCriteriaGroup) => {
      const criteriaOptions = searchCriteriaGroup.map((_searchCriteria) =>
        populateSearchCriteria(
          _searchCriteria,
          options.hasApplyButton,
          options.noMenuTabs
        )
      );

      if (criteriaOptions.length === 1) {
        _filterBySearchTextColumnFloatingFilter(agGridElement, criteriaOptions[0]);
        return;
      }

      _filterBySearchTextColumnFloatingFilterGroup(agGridElement, criteriaOptions);
    });
  } else {
    _filterBySearchTextColumnFloatingFilter(agGridElement, options);
  }
}

function normalizeFloatingFilterSearchCriteria(searchCriteria) {
  const betweenInputIndexes = new Map();

  return searchCriteria.map((criteria) => {
    if (
      criteria.operator !== filterOperator.inRange ||
      criteria.searchInputIndex !== undefined
    ) {
      return criteria;
    }

    const criteriaKey = `${criteria.columnName}::${criteria.operator}`;
    const nextInputIndex = betweenInputIndexes.get(criteriaKey) || 0;
    betweenInputIndexes.set(criteriaKey, nextInputIndex + 1);

    return {
      ...criteria,
      searchInputIndex: nextInputIndex,
    };
  });
}

function groupFloatingFilterSearchCriteria(searchCriteria) {
  const groupedCriteria = [];

  searchCriteria.forEach((criteria) => {
    const lastGroup = groupedCriteria[groupedCriteria.length - 1];

    if (
      criteria.operator === filterOperator.inRange &&
      lastGroup &&
      lastGroup[0].columnName === criteria.columnName &&
      lastGroup[0].operator === criteria.operator
    ) {
      lastGroup.push(criteria);
      return;
    }

    groupedCriteria.push([criteria]);
  });

  return groupedCriteria;
}

function _filterBySearchTextColumnFloatingFilter(agGridElement, options) {
  cy.get(agGridElement).then((agGridElement) => {
    getFilterColumnButtonElement(
      agGridElement,
      options.searchCriteria.columnName,
      true
    ).click();
    filterBySearchTerm(agGridElement, options);
    applyColumnFilter(
      agGridElement,
      options.hasApplyButton,
      options.noMenuTabs
    );
  });
}

function _filterBySearchTextColumnFloatingFilterGroup(
  agGridElement,
  criteriaOptions
) {
  cy.get(agGridElement).then((agGridElement) => {
    getFilterColumnButtonElement(
      agGridElement,
      criteriaOptions[0].searchCriteria.columnName,
      true
    ).click();

    criteriaOptions.forEach((criteriaOption, index) => {
      const searchCriteria =
        index === 0
          ? criteriaOption.searchCriteria
          : { ...criteriaOption.searchCriteria, operator: undefined };

      filterBySearchTerm(agGridElement, {
        ...criteriaOption,
        searchCriteria,
      });
    });

    applyColumnFilter(
      agGridElement,
      criteriaOptions[0].hasApplyButton,
      criteriaOptions[0].noMenuTabs
    );
  });
}

/**
 *  * Performs a filter operation on the specified column and selects only the provided filterValue
 * @param agGridElement The get() selector for which ag grid table you wish to retrieve.
 * @param {{searchCriteria:[{columnName:string,filterValue:string], hasApplyButton?:boolean}} options JSON with search values and options
 * @param options.searchCriteria [REQUIRED] JSON with search properties
 * @param options.searchCriteria.columnName [REQUIRED] name of the column to filter
 * @param options.searchCriteria.filterValue [REQUIRED] value to input into the filter textbox
 * @param options.hasApplyButton [Optional] True if "Apply" button is used, false if filters by text input automatically.
 * @param options.noMenuTabs [Optional] True if you use for example the community edition of ag-grid, which has no menu tabs
 */
export function filterByCheckboxColumnMenu(agGridElement, options) {
  // Check if there are multiple search criteria provided by attempting to access the columnName
  if (!options.searchCriteria.columnName) {
    options.searchCriteria.forEach((_searchCriteria) => {
      const _options = populateSearchCriteria(
        _searchCriteria,
        options.hasApplyButton,
        options.noMenuTabs,
        options.selectAllLocaleText
      );
      _filterByCheckboxColumnMenu(agGridElement, _options);
    });
  } else {
    _filterByCheckboxColumnMenu(agGridElement, options);
  }
}

function _filterByCheckboxColumnMenu(agGridElement, options) {
  cy.get(agGridElement).then((agGridElement) => {
    getFilterColumnButtonElement(
      agGridElement,
      options.searchCriteria.columnName
    ).click();
    const selectAllText = options.selectAllLocaleText || "(Select All)";
    toggleColumnCheckboxFilter(
      agGridElement,
      selectAllText,
      false,
      options.noMenuTabs
    );
    toggleColumnCheckboxFilter(
      agGridElement,
      options.searchCriteria.filterValue,
      true,
      options.noMenuTabs
    );
    applyColumnFilter(
      agGridElement,
      options.hasApplyButton,
      options.noMenuTabs
    );
  });
}

/**
 * Will perform a filter for all search criteria provided, then selects all found entries in the grid
 * @param searchCriteria a "\^" delimited string of all columns and searchCriteria to search for in the grid (i.e. "Name=John Smith^Rate Plan=Standard"
 */
export function filterGridEntriesBySearchText(
  agGridElement,
  searchCriteria,
  isFloatingFilter = false
) {
  if (isFloatingFilter) {
    filterBySearchTextColumnFloatingFilter(agGridElement, searchCriteria);
  } else {
    filterBySearchTextColumnMenu(agGridElement, searchCriteria);
  }
}

/**
 * Will add or remove a column from ag grid.
 * @param columnName The column name to add/remove
 * @param doRemove true will remove the column. false will add the column.
 */

export function toggleColumnFromSideBar(agGridElement, columnName, doRemove) {
  cy.get(agGridElement)
    .find(".ag-column-select-header-filter-wrapper")
    .find("input")
    .then(($columnFilterInputField) => {
      if (!$columnFilterInputField.is(":visible")) {
        cy.get(".ag-side-buttons").find("span").contains("Columns").click();
      }
      cy.get(agGridElement).agGridWaitForAnimation();
      cy.wrap($columnFilterInputField).clear().type(columnName);
      cy.get(".ag-column-select-column-label")
        .contains(columnName)
        .parent()
        .find("input")
        .then(($columnCheckbox) => {
          if (doRemove) cy.wrap($columnCheckbox).uncheck();
          else cy.wrap($columnCheckbox).check();
        });
    });
}
