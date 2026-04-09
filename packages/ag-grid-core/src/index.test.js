import test from "node:test";
import assert from "node:assert/strict";

import {
  extractAgGridData,
  extractAgGridElements,
  waitForAgGridAnimation,
} from "./index.js";

function createAttributes(attributes = {}) {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => [
      key,
      { nodeValue: String(value), value: String(value) },
    ])
  );
}

class FakeElement {
  constructor({
    textContent = "",
    attributes = {},
    selectorMap = {},
    rect = { top: 0, left: 0, bottom: 10, right: 10 },
    classList = [],
    nodeType = 1,
  } = {}) {
    this.textContent = textContent;
    this.attributes = createAttributes(attributes);
    this.selectorMap = selectorMap;
    this._rect = rect;
    this.classList = classList;
    this.nodeType = nodeType;
    this.parentElement = null;
  }

  querySelectorAll(selector) {
    return this.selectorMap[selector] ?? [];
  }

  getBoundingClientRect() {
    return this._rect;
  }

  setSelectorMap(selectorMap) {
    this.selectorMap = selectorMap;
    return this;
  }
}

function connect(parent, children) {
  children.forEach((child) => {
    child.parentElement = parent;
  });
}

function createCell(colIndex, text) {
  return new FakeElement({
    textContent: text,
    attributes: { "aria-colindex": colIndex },
  });
}

function createRow(rowIndex, cells, rect = { top: 0, left: 0, bottom: 10, right: 10 }) {
  const row = new FakeElement({
    attributes: { "row-index": rowIndex },
    rect,
  });

  connect(row, cells);
  row.setSelectorMap({
    ".ag-cell[aria-colindex]": cells,
    ".ag-cell": cells,
  });

  const viewport = new FakeElement({
    rect: { top: 0, left: 0, bottom: 100, right: 100 },
  });
  row.parentElement = viewport;

  return row;
}

function createHeader(colIndex, text) {
  const textElement = new FakeElement({ textContent: text });
  const header = new FakeElement({
    attributes: { "aria-colindex": colIndex },
  });

  connect(header, [textElement]);
  header.setSelectorMap({
    ".ag-header-cell-text": [textElement],
  });

  return header;
}

function createGridFixture() {
  const headerYear = createHeader(1, "Year");
  const headerMake = createHeader(2, "Make");
  const headerModel = createHeader(3, "Model");

  const pinnedLeftRow0 = createRow(0, [createCell(1, "2020")]);
  const centerRow0 = createRow(0, [createCell(2, "Toyota"), createCell(3, "Celica")]);
  const centerRow1 = createRow(1, [createCell(1, "2021"), createCell(2, "Ford"), createCell(3, "Mondeo")]);
  const destroyedRow = createRow(
    2,
    [createCell(1, "9999"), createCell(2, "Ghost"), createCell(3, "Row")],
    { top: 200, left: 0, bottom: 210, right: 10 }
  );

  const agRoot = new FakeElement();
  agRoot.setSelectorMap({
    ".ag-header-row-column [aria-colindex]": [headerModel, headerYear, headerMake],
    ".ag-pinned-left-cols-container:not(.ag-hidden) .ag-row:not(.ag-opacity-zero)": [pinnedLeftRow0],
    ".ag-center-cols-clipper:not(.ag-hidden) .ag-row:not(.ag-opacity-zero)": [centerRow0, centerRow1, destroyedRow],
    ".ag-center-cols-viewport:not(.ag-hidden) .ag-row:not(.ag-opacity-zero)": [],
    ".ag-pinned-right-cols-container:not(.ag-hidden) .ag-row:not(.ag-opacity-zero)": [],
  });

  const gridRoot = new FakeElement();
  gridRoot.setSelectorMap({
    ".ag-root": [agRoot],
  });

  return { gridRoot, pinnedLeftRow0, centerRow0 };
}

test("extractAgGridData returns structured row data and filters destroyed rows", async () => {
  const { gridRoot } = createGridFixture();
  gridRoot.getAnimations = () => [];

  const rows = await extractAgGridData(gridRoot);

  assert.deepEqual(rows, [
    { Year: "2020", Make: "Toyota", Model: "Celica" },
    { Year: "2021", Make: "Ford", Model: "Mondeo" },
  ]);
});

test("extractAgGridData supports onlyColumns and valuesArray", async () => {
  const { gridRoot } = createGridFixture();
  gridRoot.getAnimations = () => [];

  const subset = await extractAgGridData(gridRoot, { onlyColumns: ["Make"] });
  const arrays = await extractAgGridData(gridRoot, { valuesArray: true });

  assert.deepEqual(subset, [{ Make: "Toyota" }, { Make: "Ford" }]);
  assert.deepEqual(arrays.headers, ["Year", "Make", "Model"]);
  assert.deepEqual(arrays.rows, [
    ["2020", "Toyota", "Celica"],
    ["2021", "Ford", "Mondeo"],
  ]);
});

test("extractAgGridElements returns cell elements instead of text", async () => {
  const { gridRoot, pinnedLeftRow0, centerRow0 } = createGridFixture();
  gridRoot.getAnimations = () => [];

  const rows = await extractAgGridElements(gridRoot);

  assert.equal(rows[0].Year, pinnedLeftRow0.querySelectorAll(".ag-cell")[0]);
  assert.equal(rows[0].Make, centerRow0.querySelectorAll(".ag-cell")[0]);
});

test("waitForAgGridAnimation waits for AG Grid animations and ignores aborts", async () => {
  let resolved = false;

  const target = new FakeElement({ classList: ["ag-root"] });
  const root = new FakeElement();
  root.getAnimations = () => [
    {
      effect: {
        target,
        getTiming: () => ({ iterations: 1 }),
      },
      finished: new Promise((resolve) => {
        setTimeout(() => {
          resolved = true;
          resolve();
        }, 10);
      }),
    },
    {
      effect: {
        target,
        getTiming: () => ({ iterations: 1 }),
      },
      finished: Promise.reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
    },
    {
      effect: {
        target: new FakeElement({ classList: ["spinner"] }),
        getTiming: () => ({ iterations: 1 }),
      },
      finished: Promise.resolve(),
    },
  ];

  await waitForAgGridAnimation(root, { timeoutMs: 50 });

  assert.equal(resolved, true);
});
