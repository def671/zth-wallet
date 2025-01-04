// Modules to control application life and create native browser window
const {
  app,
  Menu,
  ipcMain,
  BrowserWindow
} = require("electron");
const singleInstance = require("single-instance");
const path = require("path");
const fs = require("fs");

// Import initGeth and Geth class
const { initGeth } = require('./modules/initGeth');
require('./modules/geth');

(async () => {
  try {
    await initGeth();
    console.log('[Main] Geth initialization completed successfully.');

    // Start Geth normally after initialization
    ZthGeth.startGeth();
    console.log('[Main] Geth started and syncing initiated');
  } catch (error) {
    console.error('[Main] Geth initialization failed:', error);
    process.exit(1); // Exit the app on failure
  }
})();

var locker = new singleInstance("ZetherWallet");

locker.lock().then(function() {
  // Keep a global reference of the window object, if you don't, the window will
  // be closed automatically when the JavaScript object is garbage collected.
  let mainWindow = null;

  function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1100,
      minHeight: 700,
      backgroundColor: "#000000",
      icon: "assets/images/icon.png"
    });

    // Load the index.html of the app.
    mainWindow.loadFile("index.html");

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    // Emitted when the window is closed.
    mainWindow.on("closed", function() {
      mainWindow = null;
    });

    require("./modules/menu.js");
  }

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  app.on("ready", createWindow);

  // Quit when all windows are closed.
  app.on("window-all-closed", function() {
    if (process.platform !== "darwin") {
      ZthGeth.stopGeth();
      app.quit();
    }
  });

  app.on("activate", function() {
    if (mainWindow === null) {
      createWindow();
    }
  });

  // Listen for request to get template
  ipcMain.on("getTemplateContent", (event, arg) => {
    event.returnValue = fs.readFileSync(path.join(app.getAppPath(), "assets/templates/") + arg, "utf8");
  });

  // Quit the app on command
  ipcMain.on("appQuit", (event, arg) => {
    app.quit();
  });
}).catch(function(err) {
  console.error('[Main] Error locking single instance:', err);
  app.quit();
});

require("./modules/accounts.js");
require("./modules/database.js");
