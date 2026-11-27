# Releasing

This repository uses npm workspaces plus Changesets for versioning and publishing.

## What Publishes

- `cypress-ag-grid`
- `playwright-ag-grid`
- `wdio-ag-grid`
- `@kpmck/ag-grid-core`

Each package publishes to npm using the `name` field in its own `package.json`.

## Creating A Release Entry

After changing one or more publishable packages:

```bash
npm run changeset
```

Choose the packages that changed and whether each change is a patch, minor, or major release. Commit the generated markdown file in `.changeset/`.

## Local Commands

```bash
npm run version-packages
npm run release
```

- `version-packages` applies pending changesets, updates package versions, and updates internal dependency ranges.
- `release` publishes the changed packages to npm.

## GitHub Actions

- `.github/workflows/ci.yml` runs the core, Cypress, Playwright, and WDIO test suites on pull requests and pushes to `main`.
- `.github/workflows/npm-publish.yml` publishes versioned packages when a GitHub release is published.

## Manual Release Flow

1. Run `npm run changeset` and commit the generated changeset file.
2. When you are ready to cut a release, run:

```bash
npm run version-packages
```

3. Commit and merge the version updates after CI passes.
4. Publish a GitHub release for the merged version commit. The release workflow publishes the changed packages to npm using the repository's `npm_token` secret.
