const rowData = [
  { make: "Porsche", model: "Boxster", price: 72000 },
  { make: "Tesla", model: "Model 3", price: 48000 },
  { make: "Toyota", model: "Celica", price: 35000 },
];

const gridOptions = {
  animateRows: true,
  columnDefs: [
    { field: "make" },
    { field: "model" },
    { field: "price" },
  ],
  defaultColDef: {
    resizable: true,
  },
  rowData,
};

const animationProbe = {
  agFinished: false,
  agStarted: false,
  thirdPartyInstalled: false,
};

let extraAnimations = [];

function getFirstAgRow() {
  return document.querySelector("#myGrid .ag-center-cols-container .ag-row");
}

function createTrackedAnimation({ target, duration, onFinish, timingDuration = duration }) {
  let resolveFinished;
  const finished = new Promise((resolve) => {
    resolveFinished = resolve;
  });

  setTimeout(() => {
    if (typeof onFinish === "function") {
      onFinish();
    }
    resolveFinished();
  }, duration);

  return {
    effect: {
      target,
      getTiming: () => ({
        duration: timingDuration,
        iterations: 1,
      }),
    },
    finished,
    playState: "running",
  };
}

function startAgOwnedAnimation() {
  const row = getFirstAgRow();
  if (!row) {
    throw new Error("Expected an AG Grid row before starting the animation.");
  }

  animationProbe.agStarted = true;
  animationProbe.agFinished = false;

  extraAnimations.push(
    createTrackedAnimation({
      target: row,
      duration: 350,
      onFinish: () => {
        animationProbe.agFinished = true;
      },
    })
  );
}

function installThirdPartyAnimationTrap() {
  const grid = document.querySelector("#myGrid");
  const overlayScrollbarsApi = window.OverlayScrollbarsGlobal?.OverlayScrollbars;
  if (typeof overlayScrollbarsApi !== "function") {
    throw new Error("Expected OverlayScrollbarsGlobal.OverlayScrollbars to be available.");
  }

  overlayScrollbarsApi(grid, {});

  const handle = grid.querySelector(".os-scrollbar-handle");
  if (!handle) {
    throw new Error("Expected OverlayScrollbars to render an .os-scrollbar-handle element.");
  }

  extraAnimations.push({
    effect: {
      target: handle,
      getTiming: () => ({
        duration: "auto",
        iterations: 1,
      }),
    },
    finished: new Promise(() => {}),
    playState: "running",
  });

  animationProbe.thirdPartyInstalled = true;
}

window.__animationProbe = animationProbe;
window.startAnimationWaitScenario = () => {
  startAgOwnedAnimation();

  if (window.ANIMATION_WAIT_SCENARIO === "third-party-subtree") {
    installThirdPartyAnimationTrap();
  }
};

const gridElement = document.querySelector("#myGrid");
agGrid.createGrid(gridElement, gridOptions);

const originalGetAnimations = gridElement.getAnimations.bind(gridElement);
gridElement.getAnimations = (options) => [
  ...originalGetAnimations(options),
  ...extraAnimations,
];
