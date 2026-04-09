const AG_GRID_COLUMN_SELECTORS = [
  ".ag-pinned-left-cols-container",
  ".ag-center-cols-clipper",
  ".ag-center-cols-viewport",
  ".ag-pinned-right-cols-container",
];

const DEFAULT_ANIMATION_TIMEOUT_MS = 5000;

export const filterOperator = {
  contains: "Contains",
  notContains: "Does not contain",
  equals: "Equals",
  notEquals: "Does not equal",
  startsWith: "Begins with",
  endsWith: "Ends with",
  lessThan: "Less than",
  lessThanOrEquals: "Less than or equal to",
  greaterThan: "Greater than",
  greaterThanOrEquals: "Greater than or equal to",
  inRange: "Between",
  blank: "Blank",
  notBlank: "Not blank",
};

export const sort = {
  ascending: "asc",
  descending: "desc",
  none: "none",
};

export const filterTab = {
  columns: "columns",
  filter: "filter",
  search: "search",
  general: "menu",
};

function isElementNode(value) {
  return Boolean(value && value.nodeType === 1);
}

function getAttributeValue(element, attribute) {
  const attributeNode = element?.attributes?.[attribute];

  if (!attributeNode) {
    return undefined;
  }

  if (typeof attributeNode.value === "string") {
    return attributeNode.value;
  }

  if (typeof attributeNode.nodeValue === "string") {
    return attributeNode.nodeValue;
  }

  return undefined;
}

function sortElementsByAttributeValue(attribute) {
  return (a, b) => {
    const contentA = parseInt(getAttributeValue(a, attribute), 10).valueOf();
    const contentB = parseInt(getAttributeValue(b, attribute), 10).valueOf();
    return contentA < contentB ? -1 : contentA > contentB ? 1 : 0;
  };
}

function getTrimmedTextContent(element) {
  return element?.textContent?.trim?.() ?? "";
}

export function isRowNotDestroyed(rowElement) {
  const rect = rowElement.getBoundingClientRect();
  const viewPortRect = rowElement.parentElement.getBoundingClientRect();

  return (
    rect.top >= viewPortRect.top &&
    rect.left >= viewPortRect.left &&
    rect.bottom <= viewPortRect.bottom &&
    rect.right <= viewPortRect.right
  );
}

export async function waitForAgGridAnimation(
  agGridRootElement,
  options = {}
) {
  if (!isElementNode(agGridRootElement)) {
    throw new Error(`Couldn't find a valid AG Grid root element.`);
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_ANIMATION_TIMEOUT_MS;
  const animations = agGridRootElement.getAnimations?.({ subtree: true }) ?? [];

  const agGridAnimations = animations.filter((animation) => {
    const animationTarget = animation.effect?.target;

    if (
      !isElementNode(animationTarget) ||
      !animationTarget.classList
    ) {
      return false;
    }

    const hasAgGridClass = [...animationTarget.classList].some((className) =>
      className.startsWith("ag-")
    );

    return animationTarget === agGridRootElement || hasAgGridClass;
  });

  const finiteAnimations = agGridAnimations.filter((animation) => {
    const iterations = animation.effect?.getTiming?.()?.iterations;
    return iterations !== Infinity;
  });

  await Promise.race([
    Promise.all(
      finiteAnimations.map(async (animation) => {
        try {
          await animation.finished;
        } catch (error) {
          if (error?.name === "AbortError") {
            return;
          }

          throw error;
        }
      })
    ),
    new Promise((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
}

export function getAgGridHeaders(tableElement) {
  return [
    ...tableElement.querySelectorAll(".ag-header-row-column [aria-colindex]"),
  ]
    .sort(sortElementsByAttributeValue("aria-colindex"))
    .map((headerElement) => {
      const headerCells = [
        ...headerElement.querySelectorAll(".ag-header-cell-text"),
      ];

      if (headerCells.length === 0) {
        return [getTrimmedTextContent(headerElement)];
      }

      return headerCells.map((element) => getTrimmedTextContent(element));
    })
    .flat();
}

function getRowCells(rowElement) {
  const rowCells = [...rowElement.querySelectorAll(".ag-cell[aria-colindex]")];

  if (rowCells.length > 0) {
    return rowCells;
  }

  return [...rowElement.querySelectorAll(".ag-cell")];
}

function getStructuredRows(allRows, returnElements) {
  if (!allRows.length) {
    return [];
  }

  return allRows
    .filter((rowCells) => rowCells.length)
    .map((rowCells) =>
      rowCells
        .sort(sortElementsByAttributeValue("aria-colindex"))
        .map((element) =>
          returnElements ? element : getTrimmedTextContent(element)
        )
    );
}

function mapRowsToObjects(headers, rows, options = {}) {
  return rows.map((row) =>
    row.reduce((acc, curr, idx) => {
      if (
        (options.onlyColumns && !options.onlyColumns.includes(headers[idx])) ||
        headers[idx] === undefined
      ) {
        return acc;
      }

      return { ...acc, [headers[idx]]: curr };
    }, {})
  );
}

export function extractAgGrid(tableRootElement, options = {}) {
  if (!isElementNode(tableRootElement)) {
    throw new Error(`Couldn't find a valid AG Grid element.`);
  }

  const returnElements = options.returnElements ?? false;
  const tableElement = tableRootElement.querySelectorAll(".ag-root")[0];

  if (!tableElement) {
    throw new Error("The provided element does not contain an .ag-root node.");
  }

  const headers = getAgGridHeaders(tableElement);
  let allRows = [];

  AG_GRID_COLUMN_SELECTORS.forEach((selector) => {
    [
      ...tableElement.querySelectorAll(
        `${selector}:not(.ag-hidden) .ag-row:not(.ag-opacity-zero)`
      ),
    ]
      .filter(isRowNotDestroyed)
      .sort(sortElementsByAttributeValue("row-index"))
      .forEach((rowElement) => {
        const rowCells = getRowCells(rowElement);
        const rowIndex = parseInt(getAttributeValue(rowElement, "row-index"), 10);

        if (allRows[rowIndex]) {
          allRows[rowIndex] = [...allRows[rowIndex], ...rowCells];
        } else {
          allRows[rowIndex] = rowCells;
        }
      });
  });

  allRows = allRows
    .filter((row) => row.length)
    .map((row) => row.filter((cell, index) => row.indexOf(cell) === index));

  const rows = getStructuredRows(allRows, returnElements);

  if (options.valuesArray) {
    return { headers, rows };
  }

  return mapRowsToObjects(headers, rows, options);
}

export async function extractAgGridData(agGridRootElement, options = {}) {
  await waitForAgGridAnimation(agGridRootElement, options);
  return extractAgGrid(agGridRootElement, options);
}

export async function extractAgGridElements(agGridRootElement, options = {}) {
  await waitForAgGridAnimation(agGridRootElement, options);
  return extractAgGrid(agGridRootElement, { ...options, returnElements: true });
}

// Self-contained exports that can be serialized into a browser context by Playwright.
export async function browserWaitForAgGridAnimation(
  agGridRootElement,
  options = {}
) {
  function isElementNode(value) {
    return Boolean(value && value.nodeType === 1);
  }

  if (!isElementNode(agGridRootElement)) {
    throw new Error(`Couldn't find a valid AG Grid root element.`);
  }

  const timeoutMs = options.timeoutMs ?? 5000;
  const animations = agGridRootElement.getAnimations?.({ subtree: true }) ?? [];

  const agGridAnimations = animations.filter((animation) => {
    const animationTarget = animation.effect?.target;

    if (!isElementNode(animationTarget) || !animationTarget.classList) {
      return false;
    }

    const hasAgGridClass = [...animationTarget.classList].some((className) =>
      className.startsWith("ag-")
    );

    return animationTarget === agGridRootElement || hasAgGridClass;
  });

  const finiteAnimations = agGridAnimations.filter((animation) => {
    const iterations = animation.effect?.getTiming?.()?.iterations;
    return iterations !== Infinity;
  });

  await Promise.race([
    Promise.all(
      finiteAnimations.map(async (animation) => {
        try {
          await animation.finished;
        } catch (error) {
          if (error?.name === "AbortError") {
            return;
          }

          throw error;
        }
      })
    ),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

export function browserExtractAgGrid(agGridRootElement, options = {}) {
  const agGridColumnSelectors = [
    ".ag-pinned-left-cols-container",
    ".ag-center-cols-clipper",
    ".ag-center-cols-viewport",
    ".ag-pinned-right-cols-container",
  ];

  function isElementNode(value) {
    return Boolean(value && value.nodeType === 1);
  }

  function getAttributeValue(element, attribute) {
    const attributeNode = element?.attributes?.[attribute];

    if (!attributeNode) {
      return undefined;
    }

    if (typeof attributeNode.value === "string") {
      return attributeNode.value;
    }

    if (typeof attributeNode.nodeValue === "string") {
      return attributeNode.nodeValue;
    }

    return undefined;
  }

  function sortElementsByAttributeValue(attribute) {
    return (a, b) => {
      const contentA = parseInt(getAttributeValue(a, attribute), 10).valueOf();
      const contentB = parseInt(getAttributeValue(b, attribute), 10).valueOf();
      return contentA < contentB ? -1 : contentA > contentB ? 1 : 0;
    };
  }

  function getTrimmedTextContent(element) {
    return element?.textContent?.trim?.() ?? "";
  }

  function isRowNotDestroyedLocal(rowElement) {
    const rect = rowElement.getBoundingClientRect();
    const viewPortRect = rowElement.parentElement.getBoundingClientRect();

    return (
      rect.top >= viewPortRect.top &&
      rect.left >= viewPortRect.left &&
      rect.bottom <= viewPortRect.bottom &&
      rect.right <= viewPortRect.right
    );
  }

  function getRowCells(rowElement) {
    const rowCells = [...rowElement.querySelectorAll(".ag-cell[aria-colindex]")];
    if (rowCells.length > 0) {
      return rowCells;
    }

    return [...rowElement.querySelectorAll(".ag-cell")];
  }

  if (!isElementNode(agGridRootElement)) {
    throw new Error(`Couldn't find a valid AG Grid element.`);
  }

  const returnElements = options.returnElements ?? false;
  const tableElement = agGridRootElement.querySelectorAll(".ag-root")[0];

  if (!tableElement) {
    throw new Error("The provided element does not contain an .ag-root node.");
  }

  const headers = [
    ...tableElement.querySelectorAll(".ag-header-row-column [aria-colindex]"),
  ]
    .sort(sortElementsByAttributeValue("aria-colindex"))
    .map((headerElement) => {
      const headerCells = [
        ...headerElement.querySelectorAll(".ag-header-cell-text"),
      ];

      if (headerCells.length === 0) {
        return [getTrimmedTextContent(headerElement)];
      }

      return headerCells.map((element) => getTrimmedTextContent(element));
    })
    .flat();

  let allRows = [];

  agGridColumnSelectors.forEach((selector) => {
    [
      ...tableElement.querySelectorAll(
        `${selector}:not(.ag-hidden) .ag-row:not(.ag-opacity-zero)`
      ),
    ]
      .filter(isRowNotDestroyedLocal)
      .sort(sortElementsByAttributeValue("row-index"))
      .forEach((rowElement) => {
        const rowCells = getRowCells(rowElement);
        const rowIndex = parseInt(getAttributeValue(rowElement, "row-index"), 10);

        if (allRows[rowIndex]) {
          allRows[rowIndex] = [...allRows[rowIndex], ...rowCells];
        } else {
          allRows[rowIndex] = rowCells;
        }
      });
  });

  allRows = allRows
    .filter((row) => row.length)
    .map((row) => row.filter((cell, index) => row.indexOf(cell) === index));

  const rows = allRows
    .filter((rowCells) => rowCells.length)
    .map((rowCells) =>
      rowCells
        .sort(sortElementsByAttributeValue("aria-colindex"))
        .map((element) =>
          returnElements ? getAttributeValue(element, "col-id") ?? getTrimmedTextContent(element) : getTrimmedTextContent(element)
        )
    );

  if (options.valuesArray) {
    return { headers, rows };
  }

  return rows.map((row) =>
    row.reduce((acc, curr, idx) => {
      if (
        (options.onlyColumns && !options.onlyColumns.includes(headers[idx])) ||
        headers[idx] === undefined
      ) {
        return acc;
      }

      return { ...acc, [headers[idx]]: curr };
    }, {})
  );
}
