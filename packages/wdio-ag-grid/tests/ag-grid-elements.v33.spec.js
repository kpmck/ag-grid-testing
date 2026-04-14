import { after } from "node:test";

import { createWdioTestContext } from "./shared/runtime.js";
import { runAgGridElementsSuite } from "./shared/run-ag-grid-elements-suite.js";

const context = await createWdioTestContext();

after(async () => {
  await context.close();
});

runAgGridElementsSuite({
  getBaseUrl: () => context.baseUrl,
  getBrowser: () => context.browser,
  pagePath: "/v33/index.html",
  versionLabel: "v33",
});
