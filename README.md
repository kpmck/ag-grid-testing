# ag-grid-testing

Monorepo for Node-based AG Grid test helpers.

Current packages:

- `@kpmck/ag-grid-core`: framework-agnostic DOM and utility logic
- `cypress-ag-grid`: Cypress plugin package, preserving the existing npm package name
- `playwright-ag-grid`: Playwright adapter package

## Workspace Scripts

From the repository root:

```bash
npm run test
npm run test:v33
npm run test:v34
npm run test:v35
npm run test:watch
```

These forward to the `cypress-ag-grid` workspace package.

## Package Layout

```text
packages/
  ag-grid-core/
  cypress-ag-grid/
  playwright-ag-grid/
```

## Repository Naming

The local monorepo root now uses the neutral workspace name `ag-grid-testing`.
If you rename the GitHub repository to match, update the repository URLs in the package manifests at the same time.
