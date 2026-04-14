import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import net from "node:net";
import { remote } from "webdriverio";
import * as chromedriver from "chromedriver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverScriptPath = path.resolve(__dirname, "../server.mjs");
const chromedriverPath = chromedriver.path ?? chromedriver.default?.path;

function waitForPort(port, host = "127.0.0.1", timeoutMs = 15000) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port });

      socket.once("connect", () => {
        socket.end();
        resolve();
      });

      socket.once("error", () => {
        socket.destroy();

        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }

        setTimeout(attempt, 100);
      });
    };

    attempt();
  });
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => {
        if (typeof address === "object" && address?.port) {
          resolve(address.port);
          return;
        }

        reject(new Error("Unable to allocate a free port."));
      });
    });
    server.on("error", reject);
  });
}

async function startProcess(command, args, port) {
  const child = spawn(command, args, { stdio: "inherit" });
  await waitForPort(port);
  return child;
}

export async function createWdioTestContext(options = {}) {
  const serverPort = options.serverPort ?? await getFreePort();
  const chromedriverPort = options.chromedriverPort ?? await getFreePort();

  const serverProcess = await startProcess(
    process.execPath,
    [serverScriptPath, `--port=${serverPort}`],
    serverPort
  );
  const driverProcess = await startProcess(
    chromedriverPath,
    [`--port=${chromedriverPort}`],
    chromedriverPort
  );

  const browser = await remote({
    logLevel: "error",
    hostname: "127.0.0.1",
    port: chromedriverPort,
    path: "/",
    capabilities: {
      browserName: "chrome",
      "goog:chromeOptions": {
        args: [
          "--headless=new",
          "--disable-gpu",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--window-size=1440,1200",
        ],
      },
    },
  });

  return {
    browser,
    baseUrl: `http://127.0.0.1:${serverPort}`,
    async close() {
      if (browser.sessionId) {
        await browser.deleteSession();
      }
      driverProcess.kill("SIGTERM");
      serverProcess.kill("SIGTERM");
    },
  };
}
