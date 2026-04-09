# ag-grid-testing

![AG Grid](./docs/images/ag-grid-logo.png)

AG Grid test helpers for interacting with and validating against AG Grid.

This monorepo contains packages for different test runners, backed by a shared core package for the framework-agnostic AG Grid logic. The goal is to keep the AG Grid DOM traversal and interaction behavior in one place so it can be reused across tools.

## A Few Highlights

- Read AG Grid row data without hand-rolling DOM parsing
- Filter by text, checkbox values, floating filters, and multi-filters
- Sort, pin, toggle columns, and edit cells in tests
- Reuse the same core AG Grid behavior across Cypress and Playwright

## What This Repo Contains

These packages are intended to make common AG Grid testing tasks easier, such as:

- getting row data from the grid
- selecting only certain columns
- filtering by text or checkbox values
- sorting and pinning columns
- toggling columns from the sidebar
- editing cells in tests
- validating grid contents

## Pick Your Runner 🚦

### `cypress-ag-grid`

Chainable Cypress helpers for interacting with and validating AG Grid. ✅

Docs: [`packages/cypress-ag-grid/README.md`](./packages/cypress-ag-grid/README.md)  
npm: `cypress-ag-grid`

```bash
npm install cypress-ag-grid --save-dev
```

### `playwright-ag-grid`

Playwright helpers for interacting with and validating AG Grid using Playwright syntax. 🎭

Docs: [`packages/playwright-ag-grid/README.md`](./packages/playwright-ag-grid/README.md)  
npm: `playwright-ag-grid`

```bash
npm install playwright-ag-grid --save-dev
```

### `@kpmck/ag-grid-core`

The shared core package used by the Cypress and Playwright adapters. ⚙️

Docs: [`packages/ag-grid-core/README.md`](./packages/ag-grid-core/README.md)  
npm: `@kpmck/ag-grid-core`

Most consumers should start with `cypress-ag-grid` or `playwright-ag-grid`.

## Start Here 👇

If you're using Cypress, go straight to [`packages/cypress-ag-grid/README.md`](./packages/cypress-ag-grid/README.md).

If you're using Playwright, go straight to [`packages/playwright-ag-grid/README.md`](./packages/playwright-ag-grid/README.md).

If you're working on shared internals or contributing, start with [`packages/ag-grid-core/README.md`](./packages/ag-grid-core/README.md).

## How It Is Structured 🧩

```text
cypress-ag-grid / playwright-ag-grid
      |
      v
      ag-grid-core
      |
      v
AG Grid DOM traversal and shared helper logic
```

## Workspace Commands 🧪

Run everything from the repository root:

```bash
npm run test:core

npm run test:cypress:all
npm run test:cypress:v33
npm run test:cypress:v34
npm run test:cypress:v35
npm run test:cypress:watch

npm run test:playwright:all
npm run test:playwright:v33
npm run test:playwright:v34
npm run test:playwright:v35
npm run test:playwright:watch
```

## Monorepo Layout 📦

```text
packages/
  ag-grid-core/
  cypress-ag-grid/
  playwright-ag-grid/
```

## Why This Exists 💡

AG Grid is powerful, but it can also be tedious to automate directly because of its DOM structure and filtering behavior. This repo exists to keep that logic in one place and make it easier to use from multiple node-based test runners.
