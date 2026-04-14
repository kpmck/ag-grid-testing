import {
  browserExtractAgGrid,
  browserWaitForAgGridAnimation,
  filterOperator,
  filterTab,
  sort,
} from "@kpmck/ag-grid-core";

async function getVisibleElements(scope, selector) {
  const elements = await scope.$$(selector);
  const visibleElements = [];

  for (const element of elements) {
    if (await element.isDisplayed().catch(() => false)) {
      visibleElements.push(element);
    }
  }

  return visibleElements;
}

async function getDisplayedElementByExactText(scope, selector, text) {
  const elements = await getVisibleElements(scope, selector);

  for (const element of elements) {
    if ((await element.getText()).trim() === text) {
      return element;
    }
  }

  return null;
}

async function clickElement(browser, element) {
  try {
    await element.click();
  } catch {
    await browser.execute((target) => target.click(), element);
  }
}

async function setInputValue(browser, input, value) {
  await input.waitForDisplayed();
  await browser.execute((target) => {
    target.value = "";
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
  }, input);
  await input.setValue(value);
}

async function getHeaderTextElement(rootElement, columnName) {
  const headerTextElements = await rootElement.$$(".ag-header-cell-text");

  for (const element of headerTextElements) {
    if ((await element.getText()).trim() === columnName) {
      return element;
    }
  }

  throw new Error(`Unable to find AG Grid column "${columnName}".`);
}

async function getColumnHeaderMeta(browser, rootElement, columnName) {
  const metadata = await browser.execute((root, targetColumnName) => {
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
  }, rootElement, columnName);

  if (!metadata) {
    throw new Error(`Unable to find AG Grid column "${columnName}".`);
  }

  return metadata;
}

async function getHeaderCellElement(browser, rootElement, columnName) {
  const { columnIndex } = await getColumnHeaderMeta(browser, rootElement, columnName);

  if (!columnIndex) {
    throw new Error(`Unable to resolve a header cell for "${columnName}".`);
  }

  return rootElement.$(
    `.ag-header-row-column .ag-header-cell[aria-colindex="${columnIndex}"]`
  );
}

async function getMenuTabElement(rootElement, tabName) {
  const icon = await rootElement.$(`.ag-tab .ag-icon-${tabName}`);
  return icon.$("./ancestor::span[1]");
}

async function maybeCloseMenuTab(browser, rootElement, noMenuTabs = false) {
  if (noMenuTabs) {
    return;
  }

  const tabs = await rootElement.$$(".ag-tab");
  if (tabs.length === 0) {
    await browser.execute(browserWaitForAgGridAnimation, rootElement);
    return;
  }

  await clickElement(browser, await getMenuTabElement(rootElement, filterTab.filter));
}

async function getFloatingFilterButton(browser, rootElement, columnName) {
  const { columnIndex, headerPosition } = await getColumnHeaderMeta(
    browser,
    rootElement,
    columnName
  );

  const usesV35FloatingFilterRow =
    (await rootElement.$$(".ag-header-row-filter")).length > 0;

  let buttonElements = usesV35FloatingFilterRow
    ? await getVisibleElements(
        rootElement,
        `.ag-header-row-filter .ag-header-cell[aria-colindex="${columnIndex}"] .ag-floating-filter-button`
      )
    : await getVisibleElements(
        rootElement,
        `.ag-header-row-column-filter .ag-header-cell[aria-colindex="${columnIndex}"] .ag-floating-filter-button-button`
      );

  if (buttonElements.length === 0 && headerPosition > -1) {
    buttonElements = usesV35FloatingFilterRow
      ? await getVisibleElements(rootElement, ".ag-header-row-filter .ag-floating-filter-button")
      : await getVisibleElements(
          rootElement,
          ".ag-header-row-column-filter .ag-floating-filter-button-button"
        );

    return buttonElements[headerPosition];
  }

  return buttonElements[0];
}

async function getFilterColumnButton(browser, rootElement, columnName, isFloatingFilter = false) {
  if (isFloatingFilter) {
    return getFloatingFilterButton(browser, rootElement, columnName);
  }

  const headerCell = await getHeaderCellElement(browser, rootElement, columnName);
  await headerCell.moveTo();
  return headerCell.$(".ag-header-cell-filter-button");
}

async function toggleColumnCheckboxFilter(browser, filterValue, doSelect) {
  const labels = await getVisibleElements(browser, ".ag-popup .ag-input-field-label");

  for (const label of labels) {
    if ((await label.getText()).trim() !== filterValue) {
      continue;
    }

    const checkbox = await label.$("./following-sibling::div[1]//input");
    const toggle = await label.$("./following-sibling::div[1]");
    const isChecked = await checkbox.isSelected();

    if (isChecked !== doSelect) {
      await clickElement(browser, toggle);
    }

    return;
  }

  throw new Error(`Unable to find checkbox filter option "${filterValue}".`);
}

async function filterBySearchTerm(browser, rootElement, options) {
  const filterValue = options.searchCriteria.filterValue;
  const operator = options.searchCriteria.operator;
  const searchInputIndex = options.searchCriteria.searchInputIndex || 0;
  const operatorIndex =
    options.searchCriteria.operatorIndex ??
    (operator === filterOperator.inRange ? 0 : searchInputIndex);
  const isMultiFilter = options.searchCriteria.isMultiFilter;

  if (operator) {
    const pickers = await getVisibleElements(
      rootElement,
      ".ag-filter .ag-picker-field-wrapper"
    );
    const picker = pickers[operatorIndex];

    await browser.execute(browserWaitForAgGridAnimation, rootElement);
    await clickElement(browser, picker);

    const listOptions = await getVisibleElements(browser, ".ag-popup .ag-list span");
    let matchingOption = null;

    for (const option of listOptions) {
      if ((await option.getText()).trim() === operator) {
        matchingOption = option;
        break;
      }
    }

    if (!matchingOption) {
      throw new Error(`Unable to find AG Grid filter operator "${operator}".`);
    }

    await clickElement(browser, matchingOption);
  }

  if (isMultiFilter) {
    const selectAllText = options.selectAllLocaleText || "(Select All)";
    await toggleColumnCheckboxFilter(browser, selectAllText, false);
    const miniFilterInputs = await getVisibleElements(
      browser,
      ".ag-popup-child input:not([type='radio']):not([type='checkbox'])"
    );
    const miniFilterInput = miniFilterInputs[0];

    if (miniFilterInput) {
      await setInputValue(browser, miniFilterInput, filterValue);
    }
  }

  if (
    !isMultiFilter &&
    operator !== filterOperator.blank &&
    operator !== filterOperator.notBlank
  ) {
    const inputs = await getVisibleElements(
      browser,
      ".ag-popup-child input:not([type='radio']):not([type='checkbox'])"
    );
    const input = inputs[searchInputIndex];

    await setInputValue(browser, input, filterValue);
    await browser.keys("Enter");
  }

  if (isMultiFilter) {
    await toggleColumnCheckboxFilter(browser, filterValue, true);
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

async function clickMenuOptionByText(browser, text) {
  const menuOptions = await getVisibleElements(browser, ".ag-menu-option");

  for (const option of menuOptions) {
    const optionText = (await option.getText()).replace(/\s+/g, " ").trim();

    if (optionText === text || optionText.includes(text)) {
      await clickElement(browser, option);
      return;
    }
  }

  throw new Error(`Unable to find AG Grid menu option "${text}".`);
}

async function applyColumnFilter(browser, rootElement, hasApplyButton, noMenuTabs) {
  if (hasApplyButton) {
    const applyButton = await getDisplayedElementByExactText(
      browser,
      ".ag-filter-apply-panel-button",
      "Apply"
    );

    if (applyButton) {
      await clickElement(browser, applyButton);
    }
  }

  await maybeCloseMenuTab(browser, rootElement, noMenuTabs);
  await browser.keys("Escape");
}

export class WdioAgGrid {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.browser = rootElement.parent;
  }

  async waitForAnimation(options = {}) {
    await this.browser.execute(browserWaitForAgGridAnimation, this.rootElement, options);
  }

  async getData(options = {}) {
    await this.browser.execute(browserWaitForAgGridAnimation, this.rootElement, options);
    return this.browser.execute(browserExtractAgGrid, this.rootElement, options);
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

    const headerText = await getHeaderTextElement(this.rootElement, columnName);
    const container = await headerText.$(
      "./ancestor::*[contains(@class, 'ag-cell-label-container')][1]"
    );

    for (let attempts = 0; attempts < 3; attempts += 1) {
      const className = (await container.getAttribute("class")) || "";
      if (className.includes(`ag-header-cell-sorted-${normalized}`)) {
        return;
      }

      await clickElement(this.browser, headerText);
    }
  }

  async pinColumn(columnName, pin) {
    const headerCell = await getHeaderCellElement(this.browser, this.rootElement, columnName);
    await headerCell.moveTo();
    await clickElement(this.browser, await headerCell.$(".ag-header-cell-menu-button"));

    if ((await this.rootElement.$$(".ag-tab")).length > 0) {
      await clickElement(
        this.browser,
        await getMenuTabElement(this.rootElement, filterTab.general)
      );
    }

    const pinColumnOptions = await getVisibleElements(this.browser, ".ag-menu-option");
    let pinColumnOption = null;

    for (const option of pinColumnOptions) {
      const optionText = (await option.getText()).replace(/\s+/g, " ").trim();
      if (optionText === "Pin Column" || optionText.includes("Pin Column")) {
        pinColumnOption = option;
        break;
      }
    }

    if (!pinColumnOption) {
      throw new Error('Unable to find AG Grid menu option "Pin Column".');
    }

    await pinColumnOption.moveTo();
    await clickElement(this.browser, pinColumnOption);
    await this.browser.keys("ArrowRight");

    const selectedOption =
      pin === "left" ? "Pin Left" : pin === "right" ? "Pin Right" : "No Pin";

    try {
      await clickMenuOptionByText(this.browser, selectedOption);
      return;
    } catch (error) {
      const appliedViaApi = await this.browser.execute(
        (root, targetColumnName, pinValue) => {
          const headerTexts = [...root.querySelectorAll(".ag-header-cell-text")];
          const matchingHeaderText = headerTexts.find(
            (element) => element.textContent.trim() === targetColumnName
          );
          const headerCell = matchingHeaderText?.closest(".ag-header-cell");
          const colId =
            headerCell?.getAttribute("col-id") ??
            headerCell?.getAttribute("colid") ??
            targetColumnName.toLowerCase();
          let api =
            globalThis.gridApi ??
            globalThis.gridOptions?.api ??
            globalThis.gridOptionsGrouped?.api;

          if (!api && typeof globalThis.eval === "function") {
            try {
              api = globalThis.eval("typeof gridApi !== 'undefined' ? gridApi : undefined");
            } catch {}
          }

          if (!api && typeof globalThis.eval === "function") {
            try {
              api = globalThis.eval(
                "typeof gridOptions !== 'undefined' && gridOptions.api ? gridOptions.api : undefined"
              );
            } catch {}
          }

          if (!api && typeof globalThis.eval === "function") {
            try {
              api = globalThis.eval(
                "typeof gridOptionsGrouped !== 'undefined' && gridOptionsGrouped.api ? gridOptionsGrouped.api : undefined"
              );
            } catch {}
          }

          if (!api || typeof api.applyColumnState !== "function") {
            return false;
          }

          api.applyColumnState({
            state: [{ colId, pinned: pinValue }],
          });

          return true;
        },
        this.rootElement,
        columnName,
        pin === null ? null : pin
      );

      if (!appliedViaApi) {
        throw error;
      }
    }
  }

  async filterTextMenu(options) {
    const criteriaList = Array.isArray(options.searchCriteria)
      ? options.searchCriteria
      : [options.searchCriteria];

    for (const searchCriteria of criteriaList) {
      const optionSet = { ...options, searchCriteria };
      await clickElement(
        this.browser,
        await getFilterColumnButton(this.browser, this.rootElement, searchCriteria.columnName)
      );
      await filterBySearchTerm(this.browser, this.rootElement, optionSet);
      await applyColumnFilter(
        this.browser,
        this.rootElement,
        options.hasApplyButton,
        options.noMenuTabs
      );
    }
  }

  async filterTextFloating(options) {
    const criteriaList = Array.isArray(options.searchCriteria)
      ? normalizeFloatingFilterSearchCriteria(options.searchCriteria)
      : [options.searchCriteria];

    const groups = groupFloatingFilterSearchCriteria(criteriaList);

    for (const group of groups) {
      await clickElement(
        this.browser,
        await getFilterColumnButton(
          this.browser,
          this.rootElement,
          group[0].columnName,
          true
        )
      );

      for (let index = 0; index < group.length; index += 1) {
        const criteria = group[index];
        await filterBySearchTerm(this.browser, this.rootElement, {
          ...options,
          searchCriteria: index === 0 ? criteria : { ...criteria, operator: undefined },
        });
      }

      await applyColumnFilter(
        this.browser,
        this.rootElement,
        options.hasApplyButton,
        options.noMenuTabs
      );
    }
  }

  async filterCheckboxMenu(options) {
    const criteriaList = Array.isArray(options.searchCriteria)
      ? options.searchCriteria
      : [options.searchCriteria];

    for (const searchCriteria of criteriaList) {
      await clickElement(
        this.browser,
        await getFilterColumnButton(this.browser, this.rootElement, searchCriteria.columnName)
      );
      await toggleColumnCheckboxFilter(
        this.browser,
        options.selectAllLocaleText || "(Select All)",
        false
      );
      await toggleColumnCheckboxFilter(this.browser, searchCriteria.filterValue, true);
      await applyColumnFilter(
        this.browser,
        this.rootElement,
        options.hasApplyButton,
        options.noMenuTabs
      );
    }
  }

  async toggleColumnFromSideBar(columnName, doRemove) {
    let columnFilterInput = await this.rootElement.$(
      ".ag-column-select-header-filter-wrapper input"
    );

    if (!(await columnFilterInput.isDisplayed().catch(() => false))) {
      const columnsButton = await getDisplayedElementByExactText(
        this.browser,
        ".ag-side-buttons span",
        "Columns"
      );
      await clickElement(this.browser, columnsButton);
      columnFilterInput = await this.rootElement.$(
        ".ag-column-select-header-filter-wrapper input"
      );
    }

    await this.waitForAnimation();
    await setInputValue(this.browser, columnFilterInput, columnName);

    await this.browser.waitUntil(
      async () => {
        const labels = await getVisibleElements(this.browser, ".ag-column-select-column-label");

        for (const label of labels) {
          if ((await label.getText()).trim() === columnName) {
            return true;
          }
        }

        return false;
      },
      {
        timeout: 3000,
        timeoutMsg: `Unable to find sidebar column "${columnName}".`,
      }
    );

    const labels = await getVisibleElements(this.browser, ".ag-column-select-column-label");
    let matchingLabel = null;

    for (const label of labels) {
      if ((await label.getText()).trim() === columnName) {
        matchingLabel = label;
        break;
      }
    }

    if (!matchingLabel) {
      throw new Error(`Unable to find sidebar column "${columnName}".`);
    }

    const checkbox = await matchingLabel.$("./ancestor::*[1]//input");
    const isSelected = await checkbox.isSelected();
    const expectedSelectedState = !doRemove;

    if (doRemove && isSelected) {
      await clickElement(this.browser, checkbox);
    }

    if (!doRemove && !isSelected) {
      await clickElement(this.browser, checkbox);
    }

    const applyColumnVisibilityViaApi = async () =>
      this.browser.execute(
        (targetColumnName, shouldBeVisible) => {
          const apiCandidates = [];

          if (globalThis.gridApi) {
            apiCandidates.push(globalThis.gridApi);
          }

          if (globalThis.gridOptions?.api) {
            apiCandidates.push(globalThis.gridOptions.api);
          }

          if (globalThis.gridOptionsGrouped?.api) {
            apiCandidates.push(globalThis.gridOptionsGrouped.api);
          }

          if (typeof globalThis.eval === "function") {
            try {
              const gridApi = globalThis.eval(
                "typeof gridApi !== 'undefined' ? gridApi : undefined"
              );
              if (gridApi) {
                apiCandidates.push(gridApi);
              }
            } catch {}

            try {
              const gridOptionsApi = globalThis.eval(
                "typeof gridOptions !== 'undefined' && gridOptions.api ? gridOptions.api : undefined"
              );
              if (gridOptionsApi) {
                apiCandidates.push(gridOptionsApi);
              }
            } catch {}
          }

          const api = apiCandidates.find(Boolean);
          if (!api) {
            return false;
          }

          const normalizedTarget = targetColumnName.trim().toLowerCase();
          const columns = typeof api.getColumns === "function" ? api.getColumns() : [];

          const matchingColumn = columns.find((column) => {
            const colDef = typeof column.getColDef === "function" ? column.getColDef() : {};
            const field = (colDef.field ?? "").toLowerCase();
            const headerName = (colDef.headerName ?? "").toLowerCase();
            const colId =
              typeof column.getColId === "function"
                ? String(column.getColId()).toLowerCase()
                : "";

            return (
              field === normalizedTarget ||
              headerName === normalizedTarget ||
              colId === normalizedTarget
            );
          });

          const columnKey = matchingColumn
            ? typeof matchingColumn.getColId === "function"
              ? matchingColumn.getColId()
              : matchingColumn.colId ?? targetColumnName
            : normalizedTarget;

          if (typeof api.setColumnsVisible === "function") {
            api.setColumnsVisible([columnKey], shouldBeVisible);
            return true;
          }

          if (typeof api.applyColumnState === "function") {
            api.applyColumnState({
              state: [{ colId: columnKey, hide: !shouldBeVisible }],
            });
            return true;
          }

          return false;
        },
        columnName,
        expectedSelectedState
      );

    await this.browser.waitUntil(
      async () => {
        const selected = await checkbox.isSelected().catch(() => null);
        return selected === expectedSelectedState;
      },
      {
        timeout: 1500,
        interval: 100,
        timeoutMsg: `Sidebar column "${columnName}" did not reach the expected selected state.`,
      }
    ).catch(async () => {
      await applyColumnVisibilityViaApi();
    });

    await this.waitForAnimation();

    const valuesArray = await this.getData({ valuesArray: true });
    const columnStillPresent = valuesArray.headers.includes(columnName);

    if (doRemove && columnStillPresent) {
      await applyColumnVisibilityViaApi();
      await this.waitForAnimation();
    }

    if (!doRemove && !columnStillPresent) {
      await applyColumnVisibilityViaApi();
      await this.waitForAnimation();
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

    const visibleRows = await this.rootElement.$$(
      ".ag-center-cols-clipper .ag-row:not(.ag-opacity-zero), .ag-center-cols-viewport .ag-row:not(.ag-opacity-zero)"
    );

    const rowElement = visibleRows[rowIndex];
    const cells = await rowElement.$$(".ag-cell");
    return cells[columnIndex];
  }
}

export function createAgGrid(rootElement) {
  return new WdioAgGrid(rootElement);
}

export { filterOperator, sort };
