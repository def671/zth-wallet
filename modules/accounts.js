const { app, dialog, ipcMain, BrowserWindow } = require("electron");
const admZip = require("adm-zip");
const path = require("path");
const fs = require("fs-extra");
const os = require("os");

class Accounts {
  constructor() {}

  getKeyStoreLocation() {
    return path.join(app.getAppPath(), ".wally", "keystore"); // Correct path inside .wally directory
  }

  async exportAccounts(mainWindow) {
    try {
      console.log("[Main] Starting exportAccounts...");

      // Get the save path directly (older Electron versions return a string)
      const savePath = await dialog.showSaveDialog(mainWindow, {
        defaultPath: path.join(app.getPath("documents"), "accounts.zip"),
        title: "Export Accounts",
        buttonLabel: "Save",
        filters: [{ name: "ZIP Files", extensions: ["zip"] }],
        properties: ["createDirectory"]
      });

      if (!savePath) {
        console.log("[Main] Save dialog was canceled. No file selected.");
        return; // Exit early if no file was selected
      }

      console.log("[Main] Save path selected:", savePath);

      const accPath = this.getKeyStoreLocation();

      if (!fs.existsSync(accPath)) {
        console.error("[Main] Keystore directory does not exist:", accPath);
        dialog.showErrorBox(
          "Export Error",
          "Keystore directory does not exist. Please create it or run the wallet initialization first."
        );
        return;
      }

      const files = fs.readdirSync(accPath);
      console.log("[Main] Keystore directory contents:", files);

      if (files.length === 0) {
        console.error("[Main] Keystore directory is empty:", accPath);
        dialog.showErrorBox(
          "Export Error",
          "Keystore directory is empty. Please ensure there are accounts to export."
        );
        return;
      }

      const zip = new admZip();

      for (let filePath of files) {
        const fullPath = path.join(accPath, filePath);
        console.log("[Main] Adding file to zip:", fullPath);
        zip.addFile(filePath, fs.readFileSync(fullPath));
      }

      console.log("[Main] Writing zip file to:", savePath);
      zip.writeZip(savePath, (writeErr) => {
        if (writeErr) {
          console.error("[Main] Failed to write zip file:", writeErr);
          dialog.showErrorBox("Export Error", "Failed to save the zip file. Please try again.");
        } else {
          console.log("[Main] Accounts exported successfully to", savePath);
	mainWindow.webContents.send("showNotification", {
	  type: "success",
	  message: `Accounts exported successfully to: ${savePath}`
          });
        }
      });
    } catch (err) {
      console.error("[Main] An unexpected error occurred during export:", err);
      dialog.showErrorBox("Export Error", "An unexpected error occurred. Please try again.");
    }
  }
}

ipcMain.on("exportAccounts", async (event, arg) => {
  console.log("[Main] Received exportAccounts IPC event");
  const mainWindow = BrowserWindow.getFocusedWindow(); // Get the currently focused window
  ZthAccounts.exportAccounts(mainWindow)
    .catch((err) => {
      console.error("[Main] Failed to export accounts:", err);
      dialog.showErrorBox("Export Error", "An error occurred while exporting accounts. Please try again.");
    });
});

ZthAccounts = new Accounts();
