const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const http = require("http");

let sidecarProcess = null;
const BACKEND_PORT = process.env.BEE_API_PORT || 8000;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;

function resolvePythonBinary(repoRoot) {
  const customBin = process.env.BEE_PYTHON_BIN;
  if (customBin && fs.existsSync(customBin)) {
    return customBin;
  }

  const venvPythonLinux = path.join(repoRoot, ".venv", "bin", "python");
  const venvPythonWin = path.join(repoRoot, ".venv", "Scripts", "python.exe");

  if (fs.existsSync(venvPythonLinux)) return venvPythonLinux;
  if (fs.existsSync(venvPythonWin)) return venvPythonWin;

  return process.platform === "win32" ? "python" : "python3";
}

async function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/api/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startSidecar(repoRoot) {
  const isHealthy = await checkHealth();
  if (isHealthy) {
    console.log(`[Electron Sidecar] Backend is already running on ${BACKEND_URL}`);
    return;
  }

  const pythonBin = resolvePythonBinary(repoRoot);
  const apiCwd = path.join(repoRoot, "apps", "api");

  console.log(`[Electron Sidecar] Spawning backend with ${pythonBin} in ${apiCwd}`);

  try {
    sidecarProcess = spawn(
      pythonBin,
      ["-m", "uvicorn", "bee_api.main:app", "--host", "127.0.0.1", "--port", String(BACKEND_PORT)],
      {
        cwd: apiCwd,
        env: {
          ...process.env,
          PYTHONUNBUFFERED: "1",
        },
        stdio: "pipe",
      }
    );

    sidecarProcess.stdout.on("data", (data) => {
      console.log(`[Backend API] ${data.toString().trim()}`);
    });

    sidecarProcess.stderr.on("data", (data) => {
      console.error(`[Backend API] ${data.toString().trim()}`);
    });

    sidecarProcess.on("exit", (code, signal) => {
      console.log(`[Electron Sidecar] Backend process exited with code ${code} signal ${signal}`);
      sidecarProcess = null;
    });

    // Poll health until ready
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 600));
      if (await checkHealth()) {
        console.log(`[Electron Sidecar] Backend verified healthy on ${BACKEND_URL}`);
        return;
      }
    }
    console.warn(`[Electron Sidecar] Backend spawn timed out waiting for /api/health`);
  } catch (err) {
    console.error(`[Electron Sidecar] Failed to spawn backend process:`, err);
  }
}

function stopSidecar() {
  if (sidecarProcess) {
    console.log(`[Electron Sidecar] Stopping backend process...`);
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", sidecarProcess.pid, "/f", "/t"]);
      } else {
        sidecarProcess.kill("SIGTERM");
      }
    } catch {
      // ignore
    }
    sidecarProcess = null;
  }
}

module.exports = {
  startSidecar,
  stopSidecar,
  getBackendUrl: () => BACKEND_URL,
};
