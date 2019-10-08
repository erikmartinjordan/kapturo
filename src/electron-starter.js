const nodeMachineId = require('node-machine-id');
const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const nativeImage = electron.nativeImage;
const Tray = electron.Tray;
const globalShortcut = electron.globalShortcut;
const machineIdSync = nodeMachineId.machineIdSync;

const path = require('path');
const url = require('url');
var shell = require('shelljs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Getting machine id
let uid = machineIdSync();

const createTray = () => {
        
    // Base 64 icon
    let base64Icon = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAABFElEQVQ4jY3SPU4DQQyGYW+AIuEMEQU3AMRPzoAQ1JRwIJCgj3IBBBegDwG04gZQU0SCioiHAq80QiGbqcYev5/tsSNaDo7wginu0G9jSngXMwxxhhrP6CwrcIlJYW/6PceNSJvSSkR8F/ZrRHxGxE1EPLW2g9PMuF/4VrOSGreL4C284x7dOe/nmC4D99LXxSDvFUaoG2AvP+w6y/4L99KGBzziC4fNnGeYYJxB8+D3FL/CBXaa7C8YFuUPmp7/wFv/9TvF+Rx/txXOwLscySbWCv9BtnP6L5yB/VxP+MBq8TbG1SK+U1XVW0RsR8RJRKxHxEbCVfxu4mxhBUW2TlZS55KMclQ7SwkU7dzmx9Y4bGN+AM3eiKGzw3acAAAAAElFTkSuQmCC`;
    
    // Setup the menubar with an icon
    let icon = nativeImage.createFromDataURL(base64Icon);
    
    // Creating icon
    tray = new Tray(icon);
    
    // Ingroirng double clicks to make app faster
    tray.setIgnoreDoubleClickEvents(true);
    
    // Add a click handler so that when the user clicks on the menubar icon, it shows
    // our popup window
    tray.on('click', (event) => { mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show() });  
    
}

const createWindow = () => {
    
    // StartURL
    const startUrl = process.env.ELECTRON_START_URL || url.format({
        pathname: path.join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    
    // Create the browser window.
    mainWindow = new BrowserWindow({
        alwaysOnTop: true,
        frame: false,
        fullscreenable: false,
        transparent: true,
        titleBarStyle: 'customButtonsOnHover',
        show: false,
        width: 300, 
        height: 300,
        webPreferences: {
            webSecurity: false,
            nodeIntegration: true,
            preload: __dirname + '/preload.js'
        }
    });
    
    // and load the index.html of the app.
    mainWindow.loadURL(startUrl);
    
    // Highlight icon
    mainWindow.on('show', () => { tray.setHighlightMode('always') });
    
    // Non highlight icon
    mainWindow.on('hide', () => { tray.setHighlightMode('never') });
    
    // Set Position of the window
    setPosition();
    
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    
    // Blur window when close o loses focus
    mainWindow.on('blur', () => mainWindow.hide() );
    
    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })
    
}

const setPosition = () => {
    
    const trayPos = tray.getBounds();
    const windowPos = mainWindow.getBounds();
    
    let x, y = 0;
    
    if (process.platform == 'darwin') {
        x = Math.round(trayPos.x - (trayPos.width / 2) - (windowPos.width / 2));
        y = Math.round(trayPos.y + trayPos.height);
    } else {
        x = Math.round(trayPos.x - (windowPos.width / 2));
        y = Math.round(trayPos.y + trayPos.height * 10);
    }
        
    mainWindow.setPosition(x, y, false);
    
}

// Don't show app in the dock
// app.dock.hide();

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => { 
    
    // Initialising tray and window
    createTray(); 
    createWindow(); 
    
    // Capture keyboard events
    // ⌘ + ⇧ + 3 is a normal screenshot
    const combOne = globalShortcut.register('Command+Shift+3', () => {
        
        const userDataPath = app.getPath('userData');
        const formatedPath = userDataPath.replace(" ", "' '");
                
        shell.exec("screencapture " + formatedPath + "/electron_pic.png", () => {
                        
            let image = nativeImage.createFromPath(userDataPath + "/electron_pic.png").toPNG();
            
            // Sending image and machine id
            mainWindow.webContents.send('ping', [image, uid]);
            
        });
    });
    
    // Capture keyboard events
    // ⌘ + ⇧ + 4 is a selective screenshot
    const combTwo = globalShortcut.register('Command+Shift+4', () => {
        
        const userDataPath = app.getPath('userData');
        const formatedPath = userDataPath.replace(" ", "' '");
                
        shell.exec("screencapture -i" + formatedPath + "/electron_pic.png", () => {
                        
            let image = nativeImage.createFromPath(userDataPath + "/electron_pic.png").toPNG();
            
            // Sending image and machine id
            mainWindow.webContents.send('ping', [image, uid]);
            
        });
    }); 
    
});

// Quit when all windows are closed.
app.on('window-all-closed',  () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});