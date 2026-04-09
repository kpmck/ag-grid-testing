import {
  browserExtractAgGrid,
  browserWaitForAgGridAnimation,
  filterOperator,
  filterTab,
  sort,
} from "@kpmck/ag-grid-core";

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function getHeaderTextLocator(rootLocator, columnName) {
  return rootLocator
    .locator(".ag-header-cell-text")
    .filter({ hasText: new RegExp(`^${escapeRegExp(columnName)}$`) })
    .first();
}

async function getColumnHeaderMeta(rootLocator, columnName) {
  const metadata = await rootLocator.evaluate((root, targetColumnName) => {
    const headerTexts = [...root.querySelectorAll(".ag-header-cell-text")];
    const matchingHeaderText = headerTexts.find(
      (element) => element.textContent.trim() === targetColumnName
    );

    if (!matchingHeaderText) {
      return null;
    }

    const headerCell = matchingHeaderText.closest(".ag-header-cell");
    const visibleHeaderCells = [...root.querySelectorAll(".ag-header-row-column .ag-header-cell")]
      .filter((element) => element.offsetParent !== null);
    const headerPosition = headerCell
      ? visibleHeaderCells.indexOf(headerCell)
      : -1;

    return {
      columnIndex: headerCell?.getAttribute("aria-colindex") ?? null,
      headerPosition,
    };
  }, columnName);

  if (!metadata) {
    throw new Error(`Unable to find AG Grid column "${columnName}".`);
  }

  return metadata;
}

async function getHeaderCellLocator(rootLocator, columnName) {
  const { columnIndex } = await getColumnHeaderMeta(rootLocator, columnName);
  if (!columnIndex) {
    throw new Error(`Unable to resolve a header cell for "${columnName}".`);
  }

  return rootLocator.locator(`.ag-header-row-column .ag-header-cell[aria-colindex="${columnIndex}"]`).first();
}

async function getMenuTabLocator(rootLocator, tabName) {
  return rootLocator.locator(".ag-tab").locator(`.ag-icon-${tabName}`).locator("xpath=ancestor::span[1]").first();
}

async function maybeCloseMenuTab(rootLocator, noMenuTabs = false) {
  if (noMenuTabs) {
    return;
  }

  const tabs = rootLocator.locator(".ag-tab");
  if ((await tabs.count()) === 0) {
    await rootLocator.evaluate(browserWaitForAgGridAnimation);
    return;
  }

  await (await getMenuTabLocator(rootLocator, filterTab.filter)).click();
}

async function getFloatingFilterButton(rootLocator, columnName) {
  const { columnIndex, headerPosition } = await getColumnHeaderMeta(rootLocator, columnName);

  const usesV35FloatingFilterRow =
    (await rootLocator.locator(".ag-header-row-filter").count()) > 0;

  let buttonLocator = usesV35FloatingFilterRow
    ? rootLocator.locator(
        `.ag-header-row-filter .ag-header-cell[aria-colindex="${columnIndex}"] .ag-floating-filter-button:visible`
      )
    : rootLocator.locator(
        `.ag-header-row-column-filter .ag-header-cell[aria-colindex="${columnIndex}"] .ag-floating-filter-button-button:visible`
      );

  if ((await buttonLocator.count()) === 0 && headerPosition > -1) {
    buttonLocator = usesV35FloatingFilterRow
      ? rootLocator.locator(".ag-header-row-filter .ag-floating-filter-button:visible").nth(headerPosition)
      : rootLocator
          .locator(".ag-header-row-column-filter .ag-floating-filter-button-button:visible")
          .nth(headerPosition);
  } else {
    buttonLocator = buttonLocator.first();
  }

  return buttonLocator;
}

async function getFilterColumnButton(rootLocator, columnName, isFloatingFilter = false) {
  if (isFloatingFilter) {
    return getFloatingFilterButton(rootLocator, columnName);
  }

  const headerCell = await getHeaderCellLocator(rootLocator, columnName);
  await headerCell.hover();
  return headerCell.locator(".ag-header-cell-filter-button").first();
}

async function toggleColumnCheckboxFilter(rootLocator, filterValue, doSelect) {
  const label = rootLocator.locator(".ag-input-field-label").filter({
    hasText: new RegExp(`^${escapeRegExp(filterValue)}$`),
  }).first();
  const checkbox = label.locator("xpath=following-sibling::div[1]//input").first();

  if (doSelect) {
    await checkbox.check({ force: true });
  } else {
    await checkbox.uncheck({ force: true });
  }
}

async function filterBySearchTerm(rootLocator, options) {
  const filterValue = options.searchCriteria.filterValue;
  const operator = options.searchCriteria.operator;
  const searchInputIndex = options.searchCriteria.searchInputIndex || 0;
  const operatorIndex =
    options.searchCriteria.operatorIndex ??
    (operator === filterOperator.inRange ? 0 : searchInputIndex);
  const isMultiFilter = options.searchCriteria.isMultiFilter;

  if (operator) {
    const picker = rootLocator
      .locator(".ag-filter .ag-picker-field-wrapper:visible")
      .nth(operatorIndex);
    await rootLocator.evaluate(browserWaitForAgGridAnimation);
    await picker.click();
    await rootLocator.locator(".ag-popup .ag-list span").filter({
      hasText: new RegExp(`^${escapeRegExp(operator)}$`),
    }).first().click();
  }

  if (isMultiFilter) {
    const selectAllText = options.selectAllLocaleText || "(Select All)";
    await toggleColumnCheckboxFilter(rootLocator, selectAllText, false);
  }

  if (operator !== filterOperator.blank && operator !== filterOperator.notBlank) {
    const input = rootLocator.locator(".ag-popup-child input:visible").nth(searchInputIndex);
    await input.fill("");
    await input.type(`${filterValue}`);
    await input.press("Enter");
  }

  if (isMultiFilter) {
    await toggleColumnCheckboxFilter(rootLocator, filterValue, true);
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

    return { ...criteria, searchInputIndex: nextInputIndex };
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

async function applyColumnFilter(rootLocator, hasApplyButton, noMenuTabs) {
  if (hasApplyButton) {
    await rootLocator.locator(".ag-filter-apply-panel-button").getByText("Apply", { exact: true }).click();
  }

  await maybeCloseMenuTab(rootLocator, noMenuTabs);
  await rootLocator.page().keyboard.press("Escape");
}

export class PlaywrightAgGrid {
  constructor(rootLocator) {
    this.rootLocator = rootLocator;
  }

  async waitForAnimation(options = {}) {
    await this.rootLocator.evaluate(browserWaitForAgGridAnimation, options);
  }

  async getData(options = {}) {
    await this.rootLocator.evaluate(browserWaitForAgGridAnimation, options);
    return this.rootLocator.evaluate(browserExtractAgGrid, options);
  }

  async sortColumn(columnName, sortDirection) {
    let normalized = sortDirection;

    if (normalized.toLowerCase() === "ascending") {
      normalized = "asc";
    } else if (normalized.toLowerCase() === "descending") {
      normalized = "desc";
    }

    if (normalized !== sort.ascending && normalized !== sort.descending) {
      throw new Error("sortDirection must be either 'asc' or 'desc'.");
    }

    const headerText = await getHeaderTextLocator(this.rootLocator, columnName);
    const container = headerText.locator(
      "xpath=ancestor::*[contains(@class, 'ag-cell-label-container')][1]"
    );

    for (let attempts = 0; attempts < 3; attempts += 1) {
      const className = (await container.getAttribute("class")) || "";
      if (className.includes(`ag-header-cell-sorted-${normalized}`)) {
        return;
      }
      await headerText.click();
    }
  }

  async pinColumn(columnName, pin) {
    const headerCell = await getHeaderCellLocator(this.rootLocator, columnName);
    await headerCell.hover();
    await headerCell.locator(".ag-header-cell-menu-button").click();
    if ((await this.rootLocator.locator(".ag-tab").count()) > 0) {
      await (await getMenuTabLocator(this.rootLocator, filterTab.general)).click();
    }
    await this.rootLocator.locator(".ag-menu-option").getByText("Pin Column", { exact: true }).click();

    const selectedOption =
      pin === "left" ? "Pin Left" : pin === "right" ? "Pin Right" : "No Pin";

    await this.rootLocator.locator(".ag-menu-option").getByText(selectedOption, { exact: true }).click();
  }

  async filterTextMenu(options) {
    const criteriaList = Array.isArray(options.searchCriteria)
      ? options.searchCriteria
      : [options.searchCriteria];

    for (const searchCriteria of criteriaList) {
      const optionSet = { ...options, searchCriteria };
      await (await getFilterColumnButton(this.rootLocator, searchCriteria.columnName)).click();
      await filterBySearchTerm(this.rootLocator, optionSet);
      await applyColumnFilter(this.rootLocator, options.hasApplyButton, options.noMenuTabs);
    }
  }

  async filterTextFloating(options) {
    const criteriaList = Array.isArray(options.searchCriteria)
      ? normalizeFloatingFilterSearchCriteria(options.searchCriteria)
      : [options.searchCriteria];

    const groups = groupFloatingFilterSearchCriteria(criteriaList);

    for (const group of groups) {
      await (await getFilterColumnButton(this.rootLocator, group[0].columnName, true)).click();

      for (let index = 0; index < group.length; index += 1) {
        const criteria = group[index];
        await filterBySearchTerm(this.rootLocator, {
          ...options,
          searchCriteria: index === 0 ? criteria : { ...criteria, operator: undefined },
        });
      }

      await applyColumnFilter(this.rootLocator, options.hasApplyButton, options.noMenuTabs);
    }
  }

  async filterCheckboxMenu(options) {
    const criteriaList = Array.isArray(options.searchCriteria)
      ? options.searchCriteria
      : [options.searchCriteria];

    for (const searchCriteria of criteriaList) {
      await (await getFilterColumnButton(this.rootLocator, searchCriteria.columnName)).click();
      await toggleColumnCheckboxFilter(
        this.rootLocator,
        options.selectAllLocaleText || "(Select All)",
        false
      );
      await toggleColumnCheckboxFilter(this.rootLocator, searchCriteria.filterValue, true);
      await applyColumnFilter(this.rootLocator, options.hasApplyButton, options.noMenuTabs);
    }
  }

  async toggleColumnFromSideBar(columnName, doRemove) {
    const columnFilterInput = this.rootLocator.locator(
      ".ag-column-select-header-filter-wrapper input"
    ).first();

    if (!(await columnFilterInput.isVisible())) {
      await this.rootLocator.page().locator(".ag-side-buttons span").getByText("Columns", { exact: true }).click();
    }

    await this.waitForAnimation();
    await columnFilterInput.fill(columnName);
    const checkbox = this.rootLocator.page()
      .locator(".ag-column-select-column-label")
      .filter({ hasText: new RegExp(`^${escapeRegExp(columnName)}$`) })
      .first()
      .locator("xpath=ancestor::*[1]//input")
      .first();

    if (doRemove) {
      await checkbox.uncheck({ force: true });
    } else {
      await checkbox.check({ force: true });
    }
  }

  async getCellLocator(rowMatcher, columnName) {
    const rows = await this.getData();
    const rowIndex = rows.findIndex((row) =>
      Object.entries(rowMatcher).every(([key, value]) => row[key] === value)
    );

    if (rowIndex === -1) {
      throw new Error(`Unable to find row matching ${JSON.stringify(rowMatcher)}.`);
    }

    const valuesArray = await this.getData({ valuesArray: true });
    const columnIndex = valuesArray.headers.indexOf(columnName);

    if (columnIndex === -1) {
      throw new Error(`Unable to find column "${columnName}".`);
    }

    const visibleRows = this.rootLocator.locator(".ag-center-cols-clipper .ag-row:not(.ag-opacity-zero), .ag-center-cols-viewport .ag-row:not(.ag-opacity-zero)");
    return visibleRows.nth(rowIndex).locator(".ag-cell").nth(columnIndex);
  }
}

export function createAgGrid(rootLocator) {
  return new PlaywrightAgGrid(rootLocator);
}

export { filterOperator, sort };
