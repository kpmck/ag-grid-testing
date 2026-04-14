import { after } from "node:test";

import { createWdioTestContext } from "./shared/runtime.js";
import { runAgGridDataSuite } from "./shared/run-ag-grid-data-suite.js";

const context = await createWdioTestContext();

after(async () => {
  await context.close();
});

runAgGridDataSuite({
  getBaseUrl: () => context.baseUrl,
  getBrowser: () => context.browser,
  pagePath: "/v33/index.html",
  versionLabel: "v33",
});
