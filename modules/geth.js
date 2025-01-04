const {app, dialog, ipcMain} = require("electron");
const child_process = require("child_process");
const appRoot = require("app-root-path");
const path = require("path");
const fs = require("fs");
const os = require("os");
// const datadir = process.env.GETH_DATADIR || path.resolve(process.env.HOME || '~', '.wally');
const datadir = process.env.GETH_DATADIR || path.resolve(__dirname, '.wally');


class Geth {
  constructor() {
    this.isRunning = false;
    this.gethProcess = null;
    this.logGethEvents = false;
    // create the user data dir (needed for MacOS)
    if (!fs.existsSync(app.getPath("userData"))) {
      fs.mkdirSync(app.getPath("userData"));
    }

    if (this.logGethEvents) {
      this.logStream = fs.createWriteStream(path.join(app.getPath("userData"), "gethlog.txt"), {flags: "a"});
    }

    if (appRoot.path.indexOf("app.asar") > -1) {
      this.rootPath = path.dirname(appRoot.path);
    } else {
      this.rootPath = appRoot.path;
    }

    switch (os.type()) {
      case "Linux":
        this.binaries = path.join(this.rootPath, "bin", "linux");
        break;
      case "Darwin":
        this.binaries = path.join(this.rootPath, "bin", "macos");
        break;
      case "Windows_NT":
        this.binaries = path.join(this.rootPath, "bin", "win");
        break;
      default:
        this.binaries = path.join(this.rootPath, "bin", "win");
    }
  }

  _writeLog(text) {
    if (this.logGethEvents) {
      this.logStream.write(text);
    }
  }

  startGeth() {
    // get the path of get and execute the child process
    try {
      this.isRunning = true;
      const gethPath = path.join(this.binaries, "geth");
      this.gethProcess = child_process.spawn(gethPath, [
        "--log.file",
        `${path.join(datadir, "geth.log")}`,
        "--datadir",
        `${datadir}`,
        "--allow-insecure-unlock",
        "--rpc.allow-unprotected-txs",
        "--ws",
        "--ws.origins",
        "*",
        "--ws.addr",
        "127.0.0.1",
        "--ws.port",
        "8549",
        "--port",
        "30307",
        "--ws.api",
        "admin,eth,net,miner,personal,web3",
        "--networkid",
        "715131",
        "--syncmode",
        "snap",
        "--ethstats",
        "tester:zether@zth-stats.outsidethebox.top",
        "--bootnodes",
        "enode://a96143d21ac86019f3dc375d618f2ffa7d45541bc783ccb718427750982068af372c64c947730b6ae088f24fc1100364a34e5cb19218e7abf2ffc686bf461cef@209.74.72.123:30157,enode://ebcd7217534f82a97e455a9fb8f31c9da112c33375995a767881164801c6ad2dd7bd0488da2c5881aa5a766d727d9327fe8b52ba1567047c7295b3242564770a@209.74.72.124:30157"
      ]);

      if (!this.gethProcess) {
        dialog.showErrorBox("Error starting application", "Geth failed to start!");
        app.quit();
      } else {
        this.gethProcess.on("error", function (err) {
          dialog.showErrorBox("Error starting application", "Geth failed to start!");
          app.quit();
        });
        this.gethProcess.on("close", function (err) {
          if (this.isRunning) {
            dialog.showErrorBox("Error running the node", "The node stoped working. The Wallet will close!");
            app.quit();
          }
        });
        this.gethProcess.stderr.on("data", function (data) {
          ZthGeth._writeLog(data.toString() + "\n");
        });
        this.gethProcess.stdout.on("data", function (data) {
          ZthGeth._writeLog(data.toString() + "\n");
        });
      }
    } catch (err) {
      dialog.showErrorBox("Error starting application", err.message);
      app.quit();
    }
  }

  stopGeth() {
    this.isRunning = false;

    if (os.type() == "Windows_NT") {
      const gethWrapePath = path.join(this.binaries, "WrapGeth.exe");
      child_process.spawnSync(gethWrapePath, [this.gethProcess.pid]);
    } else {
      this.gethProcess.kill("SIGTERM");
    }
  }
}

ipcMain.on("stopGeth", (event, arg) => {
  ZthGeth.stopGeth();
});

ZthGeth = new Geth();
