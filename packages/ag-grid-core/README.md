# @kpmck/ag-grid-core

Framework-agnostic AG Grid helpers shared by the adapter packages in this monorepo.

Planned responsibilities:

- DOM traversal and extraction
- AG Grid animation waiting helpers
- Shared types and selectors

Framework-specific command registration and assertions stay in adapter packages such as `cypress-ag-grid` and `playwright-ag-grid`.
