type TestResult = {
  testName: string;
  suite: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  retries: number;
  errorMessage?: string;
}

const results: TestResult[] = [
  { testName: "login valid user", suite: "auth", status: "passed", durationMs: 1200, retries: 0 },
  { testName: "login invalid password", suite: "auth", status: "failed", durationMs: 900, retries: 0, errorMessage: "401 !== 200" },
  { testName: "reset password", suite: "auth", status: "passed", durationMs: 1500, retries: 1 },
  { testName: "create order", suite: "orders", status: "passed", durationMs: 2200, retries: 0 },
  { testName: "cancel order", suite: "orders", status: "skipped", durationMs: 0, retries: 0 },
  { testName: "refund order", suite: "orders", status: "failed", durationMs: 1800, retries: 2, errorMessage: "500 !== 200" },
  { testName: "reset password", suite: "auth", status: "passed", durationMs: 1400, retries: 2 }
];

type Result = {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number; // percentage from 0 to 100, rounded to 2 decimals
  flakyTests: string[]; // unique test names where retries > 0 and final status is passed
  slowestTest?: { testName: string; durationMs: number };
  failuresBySuite: Record<string, number>;
}

function summarizeResults(results: TestResult[]): Result {
  const passed = results.filter((r)=>r.status === "passed").length;
  const total = results.length;
  const failed = results.filter((r)=>r.status === "failed").length;
  const skipped = results.filter((r)=>r.status === "skipped").length;
  const slowestTest = results.sort((a,b) => a.durationMs - b.durationMs)[0];
  const failuresBySuite: Record<string,number> = {};

  for (const result of results) {
    if(result.status === "failed"){
        if(!failuresBySuite){

        }
    }
  }
  console.log("FAILING SUITES:", failingSuites)

  return{ 
    flakyTests: results.filter((r) =>  r.retries >0 && r.status === "passed").map((r)=>r.testName),
    passed,
    total,
    failed,
    skipped,
    passRate: passed / (passed + failed) * 100,
    slowestTest: slowestTest ? { ...slowestTest} : undefined,
    failuresBySuite: undefined
  }
}

summarizeResults(results);
