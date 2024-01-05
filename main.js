const { app, BrowserWindow } = require("electron");
const path = require('path');
const fs = require('fs');

process.env.STORAGE_PATH = app.getPath('userData');
process.env.MEDIA_PATH = app.getPath('userData');
process.env.CONFIG_PATH = path.join(app.getPath('userData'), 'config');
process.env.SECRETS_PATH = path.join(app.getPath('userData'), 'config');
process.env.FRONTEND = path.join(app.getAppPath(), 'frontend', 'dist');

fs.mkdirSync(process.env.CONFIG_PATH, { recursive: true });

const server = require("./api/server");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
    },
  });
 
  mainWindow.loadURL("http://localhost:3000");
  mainWindow.on("closed", function () {
    mainWindow = null;
  });
}
 
app.on("ready", createWindow);
 
app.on("resize", function (e, x, y) {
  mainWindow.setSize(x, y);
});
 
app.on("window-all-closed", function () {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
 
app.on("activate", function () {
  if (mainWindow === null) {
    createWindow();
  }
});