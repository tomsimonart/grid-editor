import {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  nativeImage,
  clipboard,
  shell,
  MessageChannelMain,
  utilityProcess,
  screen,
  protocol,
  net,
} from "electron";
import path from "path";
import log from "electron-log";
import fs from "fs";
import chokidar from "chokidar";

// might be environment variables as well.
import configuration from "../../configuration.json";
import buildVariables from "../../buildVariables.json";

configuration.EDITOR_VERSION = app.getVersion();
configuration.EDITOR_NAME = app.getName();

log.info(
  "NAME: ",
  configuration.EDITOR_NAME,
  " VERSION: ",
  configuration.EDITOR_VERSION
);

import { serial, restartSerialCheckInterval } from "./ipcmain_serialport";
import { websocket } from "./ipcmain_websocket";
import { developerWebsocket } from "./developer_websocket";
import { store } from "./main-store";
import { iconBuffer, iconSize } from "./icon";
import { firmware, firmwareDownload, findBootloaderPath } from "./src/firmware";
import { updater, restartAfterUpdate } from "./src/updater";
import {
  libraryDownload,
  uxpPhotoshopDownload,
  selectDirectory,
} from "./src/library";
import {
  loadConfigsFromDirectory,
  saveConfig,
  deleteConfig,
  migrateToProfileCloud,
} from "./src/profiles";
import { fetchUrlJSON } from "./src/fetch";
import { getLatestVideo } from "./src/youtube";
import { SerialPort } from "serialport";

log.info("App starting...");

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// To avoid context aware flag.
//app.allowRendererProcessReuse = false;

let tray = null;

let packageManagerProcess: Electron.UtilityProcess | undefined = undefined;

protocol.registerSchemesAsPrivileged([
  { scheme: "package", privileges: { bypassCSP: true, standard: true } },
]);

if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("grid-editor", process.execPath, [
      path.resolve(process.argv[1]),
    ]);
  }
} else {
  app.setAsDefaultProtocolClient("grid-editor");
}

function create_tray() {
  /* ===============================================================================
// Conde snippet to generate JSON file from PNG. Use this when creating a new icon
// ./icon.js holds de raw data in PNG encoding

  let iconLoad = fs.readFileSync(path.join(__dirname, './icon.png'),null)
  const iconLoadJson = JSON.stringify(iconLoad);
  fs.writeFileSync(path.join(__dirname, './iconpng.txt'), iconLoadJson)  
*/

  const icon = nativeImage.createFromBuffer(Buffer.from(iconBuffer.data), {
    width: iconSize,
    height: iconSize,
  });

  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show",
      click: function () {
        mainWindow.setSkipTaskbar(false);
        mainWindow.show();

        mainWindow.webContents.send("trayState", false);
      },
    },
    {
      label: "Hide",
      click: function () {
        mainWindow.hide();
        mainWindow.setSkipTaskbar(true);

        mainWindow.webContents.send("trayState", true);
      },
    },
    {
      label: "Exit",
      click: function () {
        app.isQuiting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("Grid Editor");
  tray.setContextMenu(contextMenu);
  tray.setTitle("Grid Editor");
}

const gotTheLock = app.requestSingleInstanceLock();

function handleDeeplinkReturnData(returnData: string) {
  const url = new URL(returnData);
  if (url.searchParams.get("credential") !== null) {
    const credential = url.searchParams.get("credential");
    mainWindow.webContents.send("onExternalAuthResponse", credential);
  }
  if (url.searchParams.get("config-link") !== null) {
    const configLink = url.searchParams.get("config-link");
    mainWindow.webContents.send("onExternalConfigLinkResponse", configLink);
  }
}

if (!gotTheLock) {
  app.quit();
} else {
  app.on(
    "second-instance",
    (event, commandLine, workingDirectory, additionalData) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (process.platform !== "darwin") {
          mainWindow.show();
        }

        if (mainWindow.isMinimized()) {
          mainWindow.restore();
          mainWindow.focus();
        }
        handleDeeplinkReturnData(commandLine.toString());
      }
    }
  );

  app.whenReady().then(() => {
    if (process.platform !== "darwin") {
      create_tray();
    }
    createWindow();
    protocol.handle("package", (req) => {
      let requestPath = req.url.substring("package://".length);

      // import() calls are cached client side
      // To bust through, clients may send url starting with 'vxxx/'
      if (requestPath.startsWith("v")) {
        requestPath = requestPath.split("/").slice(1).join("/");
      }

      let packageName = requestPath.split("/")[0];
      let filePath = requestPath.split("/").slice(1).join("/");
      let packageFolder = path.resolve(
        path.join(
          app.getPath("documents"),
          "grid-userdata",
          "packages",
          packageName
        )
      );

      // Override package path for local dev packages
      let localPackages = store.get("localPackages");
      if (localPackages[packageName]) {
        packageFolder = localPackages[packageName];
      }
      const fullPath = path.join(packageFolder, filePath);
      return net.fetch(`file://${fullPath}`);
    });
  });
}

// Handle the protocol deeplink url under MacOS.
app.on("open-url", (event, url) => {
  handleDeeplinkReturnData(url);
});

// We should be able to set the dock icon and menu name of the app, but it doesnt work
// app.on('ready', () => {
//   app.setName('Grid Editor')
// })

function createWindow() {
  const windowTitle = "Grid Editor - " + configuration.EDITOR_VERSION;

  // First we'll get our height and width. This will be the defaults if there wasn't anything saved
  let { width, height } = store.get("windowBounds");

  mainWindow = new BrowserWindow({
    width,
    height,
    minHeight: 500,
    minWidth: 800,
    backgroundColor: "#1e2628",
    frame: false,
    titleBarStyle: "hidden",
    trafficLightPosition: {
      x: 6,
      y: 6,
    },
    title: windowTitle,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
    icon: "./icon.png",
  });

  // We set an intercept on incoming requests to disable x-frame-options
  // headers.
  mainWindow.webContents.session.webRequest.onHeadersReceived(
    { urls: ["*://*/*"] },
    (d, c) => {
      if (d.responseHeaders["X-Frame-Options"]) {
        delete d.responseHeaders["X-Frame-Options"];
      } else if (d.responseHeaders["x-frame-options"]) {
        delete d.responseHeaders["x-frame-options"];
      }

      c({ cancel: false, responseHeaders: d.responseHeaders });
    }
  );

  serial.mainWindow = mainWindow;
  websocket.mainWindow = mainWindow;
  firmware.mainWindow = mainWindow;
  updater.mainWindow = mainWindow;
  updater.init(store.get("nightlyEditor"));

  ipcMain.on("restartAfterUpdate", () => {
    log.info('Calling "restartAfterUpdate" from main.ts');
    restartAfterUpdate();
  });

  ipcMain.on("restartPackageManager", (event) => {
    restartPackageManagerProcess();
  });

  ipcMain.on("installUpdate", (event) => {
    updater.installUpdate();
  });

  console.log("here what is buildVariables.BUILD_ENV");
  if (buildVariables.BUILD_ENV === "development") {
    log.info("Development Mode!");
    mainWindow.loadURL("http://localhost:5173/");
    mainWindow.webContents.openDevTools();
  } else {
    // this is applicable for any non development environment, like production or test
    log.info(
      "Production Mode!",
      `file://${path.join(__dirname, "../../dist/renderer/index.html")}`
    );
    mainWindow.loadURL(
      `file://${path.join(__dirname, "../../dist/renderer/index.html")}`
    );
  }

  mainWindow.on("close", (evt) => {
    // when quit is terminal under darwin
    if (app.quitting) {
      mainWindow = null;
    } else {
      evt.preventDefault();
      // only hide, keep in the background
      const keepRunning = store.get("alwaysRunInTheBackground");
      if (keepRunning === true) {
        mainWindow.hide();
      } else {
        app.quit();
      }
    }
  });

  mainWindow.on("resize", () => {
    let { width, height } = mainWindow.getBounds();
    store.set("windowBounds", { width, height });
    mainWindow.webContents.send("window_size", { width, height });
  });

  mainWindow.webContents.session.on(
    "select-serial-port",
    (event, portList, webContents, callback) => {
      event.preventDefault();
      if (portList && portList.length > 0) {
        callback(portList[0].portId);
      } else {
        callback(""); //Could not find any matching devices
      }
    }
  );

  mainWindow.webContents.session.on("serial-port-added", (event, port) => {
    log.info("serial-port-added FIRED WITH", port);
  });

  mainWindow.webContents.session.on("serial-port-removed", (event, port) => {
    log.info("serial-port-removed FIRED WITH", port);
  });

  mainWindow.webContents.session.setPermissionCheckHandler(
    (webContents, permission, requestingOrigin, details) => {
      // file is for production, localhost is for development, mind the last '/' at the end of the url
      if (
        permission === "serial" &&
        (details.securityOrigin == "file:///" ||
          details.securityOrigin == "http://localhost:5173/")
      ) {
        return true;
      }
    }
  );

  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    // file is for production, localhost is for development
    if (
      details.deviceType === "serial" &&
      (details.origin === "file://" ||
        details.origin === "http://localhost:5173")
    ) {
      return true;
    }
  });
  // Handle package configuration, action
  mainWindow.webContents.on("did-finish-load", () => {
    const { port1, port2 } = new MessageChannelMain();
    mainWindow.webContents.postMessage("package-manager-port", null, [port1]);
    packageEditorPort = port2;
    port2.on("message", (e) => {
      packageManagerProcess?.postMessage(e.data, e.ports);
    });
    port2.start();
    restartPackageManagerProcess();
  });
}

let stopPackageManagerTimeout = undefined;
let restartPackageManagerOnShutdown = true;
let packageEditorPort = undefined;
function startPackageManager(
  updatePackageOnStartName: string | undefined = undefined
) {
  const packageFolder = path.resolve(
    path.join(app.getPath("documents"), "grid-userdata", "packages")
  );
  if (!packageManagerProcess) {
    packageManagerProcess = utilityProcess.fork(
      path.resolve(path.join(__dirname, "./packageManager.js"))
    );
    packageManagerProcess.postMessage({
      type: "init",
      packageFolder: packageFolder,
      version: configuration.EDITOR_VERSION,
      githubPackages: store.get("githubPackages"),
      localPackages: store.get("localPackages"),
      updatePackageOnStartName,
    });

    packageManagerProcess.on("message", (message) => {
      if (message.type == "create-window") {
        createPackageWindow(message);
      } else if (message.type == "close-window") {
        closePackageWindow(message.windowId);
      } else if (message.type == "shutdown-complete") {
        clearTimeout(stopPackageManagerTimeout);
        packageManagerProcess?.kill();
        packageManagerProcess = undefined;
        if (restartPackageManagerOnShutdown) {
          startPackageManager();
        }
      } else if (
        message.type === "delete-package-folder" ||
        message.type === "update-package-folder"
      ) {
        packageManagerProcess?.once("exit", () => {
          fs.rm(message.path, { recursive: true }, () =>
            startPackageManager(message.packageName)
          );
        });
        packageManagerProcess!.kill();
        packageManagerProcess = undefined;
      } else {
        packageEditorPort?.postMessage(message);
      }
    });
  }
}

function stopPackageManager(stopGracefully: boolean = false) {
  if (!stopGracefully) {
    packageManagerProcess?.kill();
    packageManagerProcess = undefined;
  } else {
    packageManagerProcess.postMessage({ type: "stop-package-manager" });
    stopPackageManagerTimeout = setTimeout(() => {
      packageManagerProcess?.kill();
      packageManagerProcess = undefined;
      if (restartPackageManagerOnShutdown) {
        startPackageManager();
      }
    }, 10000);
  }
}

function handleDeveloperWebsocketMessage(data: any) {
  if (data.type === "developer-package") {
    let developerPackages = store.get("localPackages");
    if (
      developerPackages[data.id] &&
      path.resolve(developerPackages[data.id]) === path.resolve(data.rootPath)
    ) {
      if (data.event === "components-build-complete") {
        packageEditorPort?.postMessage({
          type: "reload-package-components",
          id: data.id,
        });
      } else if (data.event === "package-build-complete") {
        packageManagerProcess?.postMessage({
          type: "restart-package",
          id: data.id,
          payload: store.get("packagesDataStorage")[data.id],
        });
      }
    } else {
      packageEditorPort?.postMessage({
        type: "request-developer-package",
        id: data.id,
        rootPath: data.rootPath,
        name:
          data.name ??
          data.id
            .split("-")
            .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
            .join(" "),
      });
    }
  }
}

let openWindows: Map<String, BrowserWindow> = new Map();
function createPackageWindow(args) {
  const windowId = args.windowId;
  if (openWindows.has(windowId) && args.recreateIfExists) {
    if (args.recreateIfExists) {
      closePackageWindow(windowId);
    } else {
      console.log(`Window with id: ${windowId} already exists!`);
      return;
    }
  }

  let { width, height } = screen.getPrimaryDisplay().workAreaSize;
  if (!args.fullscreen) {
    width = args.width;
    height = args.height;
  }

  const window = new BrowserWindow({
    width: width,
    height: height,
    frame: false,
    resizable: args.resizable,
    transparent: args.transparent,
    alwaysOnTop: args.alwaysOnTop,
    x: args.x ?? 0,
    y: args.y ?? 0,
    webPreferences: {
      backgroundThrottling: false,
      preload: path.join(__dirname, "../preload/package.js"),
    },
  });

  window.loadURL(args.windowFile);
  if (args.ignoreMouse) {
    window.setIgnoreMouseEvents(true, { forward: false });
  }

  openWindows.set(windowId, window);

  let messageChannel = new MessageChannelMain();
  window.webContents.postMessage("package-port", { windowId }, [
    messageChannel.port1,
  ]);
  packageManagerProcess?.postMessage(
    {
      id: args.packageId,
      type: "create-package-message-port",
      senderId: windowId,
    },
    [messageChannel.port2]
  );
  window.show();
}
function closePackageWindow(windowId) {
  let window = openWindows.get(windowId);
  if (window) {
    window.close();
    openWindows.delete(windowId);
  }
}

async function restartPackageManagerProcess() {
  restartPackageManagerOnShutdown = true;
  if (packageManagerProcess) {
    stopPackageManager(true);
  } else {
    startPackageManager();
  }
}

if (store.get("packageDeveloper")) {
  developerWebsocket.startWebsocketServer(handleDeveloperWebsocketMessage);
}

store.onDidChange("packageDeveloper", (newValue) => {
  if (newValue) {
    developerWebsocket.startWebsocketServer(handleDeveloperWebsocketMessage);
  } else {
    developerWebsocket.stopWebsocketServer();
  }
});

store.onDidChange("nightlyEditor", (newValue) => {
  updater.setNightlyAllowed(newValue);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

let configWatcher: chokidar.FSWatcher | undefined;
function startConfigWatcher(configPath, rootDirectory) {
  configWatcher?.close();

  async function sendLocalConfigs() {
    var result = await loadConfigsFromDirectory(configPath, rootDirectory);
    mainWindow.webContents.send("sendConfigsToRenderer", result);
  }

  configWatcher = chokidar.watch(path.join(configPath, "configs"), {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true, // Ignore initial events on startup
    depth: 0, // Only watch the top-level directory
  });
  configWatcher.on("add", function (path) {
    sendLocalConfigs();
  });
  configWatcher.on("change", function (path) {
    sendLocalConfigs();
  });
  configWatcher.on("unlink", function (path) {
    sendLocalConfigs();
  });
  configWatcher.on("ready", function () {
    sendLocalConfigs();
  });
  sendLocalConfigs();
}

ipcMain.handle("clipboardWriteText", async (event, arg) => {
  console.log(arg.text);
  clipboard.writeText(arg.text);
});

ipcMain.handle("download", async (event, arg) => {
  let result: any = undefined;
  if (arg.packageToDownload == "library") {
    result = await libraryDownload(arg.targetFolder);
  }
  if (arg.packageToDownload == "uxpPhotoshop") {
    result = await uxpPhotoshopDownload(arg.targetFolder);
  }
  return result;
});

ipcMain.handle("selectDirectory", async (event, arg) => {
  return await selectDirectory();
});

ipcMain.handle("viewDirectory", async (event, arg) => {
  const normalizedPath = path.normalize(arg.targetFolder); // handle mixed '/' and '\' characters on windows
  shell.openPath(normalizedPath);
  return;
});

ipcMain.handle("resetDirectory", async (event, arg) => {
  const defaultPath = app.getPath("documents") + "/grid-userdata";
  // Create the folder if it does not exist
  if (!fs.existsSync(defaultPath)) {
    fs.mkdirSync(defaultPath);
  }
  return defaultPath;
});

ipcMain.handle("defaultDirectory", (event, arg) => {
  const defaultPath = app.getPath("documents") + "/grid-userdata";
  return defaultPath;
});

ipcMain.handle("loadConfigsFromDirectory", async (event, arg) => {
  return await loadConfigsFromDirectory(arg.configPath, arg.rootDirectory);
});

ipcMain.handle("migrateToProfileCloud", async (event, arg) => {
  return await migrateToProfileCloud(
    arg.oldRootPath,
    arg.newRootPath,
    arg.configDirectory
  );
});

ipcMain.handle("saveConfig", async (event, arg) => {
  return await saveConfig(arg.configPath, arg.rootDirectory, arg.config);
});

ipcMain.handle("startConfigsWatch", async (event, arg) => {
  return await startConfigWatcher(arg.configPath, arg.rootDirectory);
});

ipcMain.handle("stopConfigsWatch", async (event) => {
  configWatcher?.close();
  configWatcher = undefined;
});

ipcMain.handle("deleteConfig", async (event, arg) => {
  return await deleteConfig(arg.configPath, arg.rootDirectory, arg.config);
});

// this is needed for the functions to have the mainWindow for communication
ipcMain.handle("firmwareDownload", async (event, arg) => {
  return await firmwareDownload(
    arg.targetFolder,
    arg.product,
    arg.arch,
    arg.url
  );
});

ipcMain.handle("findBootloaderPath", async (event, arg) => {
  return await findBootloaderPath();
});

ipcMain.handle("restartSerialCheckInterval", (event, arg) => {
  return restartSerialCheckInterval();
});

ipcMain.handle("fetchUrlJSON", (event, arg) => {
  return fetchUrlJSON(arg);
});

// load the latest video from the grid editor playlist
ipcMain.handle("getLatestVideo", async (event, arg) => {
  return await getLatestVideo();
});

// launch browser and open url
ipcMain.handle("openInBrowser", async (event, arg) => {
  return await shell.openExternal(arg.url);
});

// persistent storage for the app
ipcMain.handle("getPersistentStore", (event, arg) => {
  let result = {};
  arg.forEach((key) => {
    let value = store.get(key);
    result[key] = value;
  });
  return result;
});

ipcMain.handle("setPersistentStore", (event, arg) => {
  Object.entries(arg).forEach((entry) => {
    let [key, value] = entry;
    if (value !== undefined) {
      store.set(arg);
      log.info("attempt to store..", arg);
    } else {
      store.delete(key);
      log.info("delete from store..", arg);
    }
  });
  return "saved";
});

// app window management
ipcMain.handle("closeWindow", async (event, args) => {
  mainWindow.close();
  return "closed";
});

ipcMain.handle("minimizeWindow", async (event, args) => {
  mainWindow.minimize();
});

ipcMain.handle("maximizeWindow", async (event, args) => {
  mainWindow.maximize();
});

ipcMain.handle("restoreWindow", async (event, args) => {
  mainWindow.restore();
});

ipcMain.handle("isMaximized", async (event, args) => {
  return mainWindow.isMaximized();
});

// configuration variables
ipcMain.on("getConfiguration", (event) => {
  event.returnValue = configuration;
});

// build variables
ipcMain.on("getBuildVariables", (event) => {
  event.returnValue = buildVariables;
});

ipcMain.on("get-app-path", (event) => {
  event.returnValue = app.getAppPath();
});

ipcMain.on("analytics_uuid", (event) => {
  event.returnValue = store.get("userId");
});

ipcMain.on("app_version", (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on("resetAppSettings", (event, arg) => {
  log.info("Clear app settings...");
  store.clear();

  if (process.env.APPIMAGE) {
    let options = {
      args: process.argv.slice(1).concat(["--relaunch"]),
      execPath: process.env.APPIMAGE,
    };
    options.args.unshift("--appimage-extract-and-run");
    log.info("ARGS: ", options);
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch(options);
    app.exit(0);
  } else {
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch({ args: process.argv.slice(1).concat(["--relaunch"]) });
    app.exit(0);
  }

  return true;
});

ipcMain.on("restartApp", (event, arg) => {
  log.info("main", "App restart requested");

  if (process.env.APPIMAGE) {
    let options;
    options.args = process.argv.slice(1).concat(["--relaunch"]);
    options.execPath = process.execPath;
    options.execPath = process.env.APPIMAGE;
    options.args.unshift("--appimage-extract-and-run");
    log.info("ARGS: ", options);
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch(options);
    app.exit(0);
  } else {
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.relaunch();
    app.exit();
  }
});

// Quit when all windows are closed.
app.on("window-all-closed", (evt) => {
  const keepRunning = store.get("alwaysRunInTheBackground");

  if (keepRunning === true) {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== "darwin") {
      restartPackageManagerOnShutdown = false;
      stopPackageManager();
      app.quit();
    }
  } else {
    restartPackageManagerOnShutdown = false;
    stopPackageManager();
    app.quit();
  }
});

app.on("activate", () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  mainWindow.show();
});

// termination of application, closing the windows, used for macOS hide flag
app.on("before-quit", (evt) => {
  log.info("before-quit evt", evt);
  app.quitting = true;
});
