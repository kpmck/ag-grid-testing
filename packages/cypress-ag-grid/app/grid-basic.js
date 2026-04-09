function getRowDataUrl() {
  return window.AG_GRID_DATA_PATH || "./data.json";
}

// specify the columns
function getColumnDefs(floatingFilter) {
  return [
    { field: "year", pinned: "left", floatingFilter },
    { field: "make", rowGroup: false, pinned: "left", floatingFilter },
    { field: "model", filter: true, floatingFilter },
    { field: "condition", filter: "agTextColumnFilter", floatingFilter, filterParams: { numAlwaysVisibleConditions: 2, defaultJoinOperator: 'OR', } },
    {
      field: "mileage",
      filter: "agNumberColumnFilter",
      floatingFilter: false,
      hide: true,
    },
    {
      field: "price",
      pinned: "right",
      floatingFilter: false,
      sortable: false,
      editable: true,
      cellEditor: "agTextCellEditor",
    },
  ];
}

function isAgGridVersion35OrLater() {
  const majorVersion = Number((window.AG_GRID_LIBRARY_VERSION || "0").split(".")[0]);
  return majorVersion >= 35;
}

function applyColumnDefs(columnDefs) {
  if (!gridOptions.api) {
    return;
  }

  if (!isAgGridVersion35OrLater() && typeof gridOptions.api.setColumnDefs === "function") {
    gridOptions.api.setColumnDefs(columnDefs);
  } else {
    gridOptions.api.setGridOption("columnDefs", columnDefs);
  }

  if (window.Cypress) {
    gridOptions.api.sizeColumnsToFit();
  }
}

const autoGroupColumnDef = {
  headerName: "Model",
  field: "model",
  cellRenderer: "agGroupCellRenderer",
  cellRendererParams: {
    checkbox: true,
  },
};

// let the grid know which columns to use
const gridOptions = {
  defaultColDef: {
    sortable: true,
    filter: "agTextColumnFilter",
    floatingFilter: true,
    filterParams: {
      buttons: ["reset", "apply"],
      debounceMs: 200,
    },
    animateRows: true,
    resizable: true,
  },
  autoGroupColumnDef: autoGroupColumnDef,
  groupSelectsChildren: true,
  columnDefs: getColumnDefs(true),
  rowSelection: "multiple",
  domLayout: "normal",
  pagination: true,
  paginationPageSize: 5,
  sideBar: true,
};

if (isAgGridVersion35OrLater()) {
  gridOptions.paginationPageSizeSelector = [5, 10, 20];
}

// lookup the container we want the Grid to use
const eGridDiv = document.querySelector("#myGrid");

function MakeFloating(floating) {
  applyColumnDefs(getColumnDefs(floating));
}

function setColumnFilter(field, filter, floatingFilter = true, hide) {
  const columnDefs = gridOptions.api.getColumnDefs().map((columnDef) => {
    if (columnDef.field !== field) {
      return columnDef;
    }

    const updatedColumnDef = {
      ...columnDef,
      filter,
      floatingFilter,
    };

    if (hide !== undefined) {
      updatedColumnDef.hide = hide;
    }

    return updatedColumnDef;
  });

  applyColumnDefs(columnDefs);
}

// create the grid passing in the div to use together with the columns &amp; data we want to use
const gridApi = agGrid.createGrid(eGridDiv, gridOptions);
// keep backward compatibility with code that references gridOptions.api
gridOptions.api = gridApi;

// Grab the grid data from the supplied API endpoint
fetch(getRowDataUrl())
  .then(res => res.json())
  .then((data) => {
    gridOptions.api.setGridOption('rowData', data);
  });

function autoSizeAllColumns() {
  var allColumnIds = [];
  gridOptions.api.getColumns().forEach(function (column) {
    allColumnIds.push(column.colId);
  });
  gridOptions.api.autoSizeColumns(allColumnIds);
}

// If the Cypress test is running, ensure all columns fit within the window
if (window.Cypress) {
  gridOptions.api.sizeColumnsToFit();
} else {
  // Otherwise auto-size columns the way we wish to view the grid in production.
  autoSizeAllColumns();
}
