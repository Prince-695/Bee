const { app, BrowserWindow, ipcMain, Notification, dialog, Tray, Menu } = require("electron");
const path = require("path");
const { startSidecar, stopSidecar, getBackendUrl } = require("./sidecar.cjs");

let mainWindow = null;
let tray = null;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const REPO_ROOT = path.resolve(__dirname, "../../..");

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#09090b",
    title: "Bee — Autonomous AI Co-Engineer",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function setupIpcHandlers() {
  ipcMain.on("app:notify", (_event, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title: title || "Bee AI Co-Engineer", body }).show();
    }
  });

  ipcMain.handle("app:select-directory", async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory"],
      title: "Select Repository / Workspace Directory",
    });
    return result.canceled || !result.filePaths.length ? null : result.filePaths[0];
  });

  ipcMain.handle("app:get-backend-url", () => {
    return getBackendUrl();
  });

  ipcMain.on("window:minimize", () => {
    if (mainWindow) mainWindow.minimize();
  });

  ipcMain.on("window:maximize", () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) mainWindow.unmaximize();
      else mainWindow.maximize();
    }
  });

  ipcMain.on("window:close", () => {
    if (mainWindow) mainWindow.close();
  });
}

function setupTray() {
  try {
    const iconPath = path.join(__dirname, "../public/vite.svg");
    tray = new Tray(iconPath);
    const contextMenu = Menu.buildFromTemplate([
      { label: "Bee AI Co-Engineer", enabled: false },
      { type: "separator" },
      {
        label: "Open Mission Control",
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        },
      },
      { type: "separator" },
      {
        label: "Quit Bee",
        click: () => {
          app.quit();
        },
      },
    ]);
    tray.setToolTip("Bee — AI Co-Engineer");
    tray.setContextMenu(contextMenu);
  } catch {
    // Tray icon optional if missing display
  }
}

app.whenReady().then(async () => {
  setupIpcHandlers();
  setupTray();
  await startSidecar(REPO_ROOT);
  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  stopSidecar();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
