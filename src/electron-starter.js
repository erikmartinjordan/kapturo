const nodeMachineId = require('node-machine-id');
const electron = require('electron');
const app = electron.app;
const Menu = electron.Menu;
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
    let base64Icon = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABYWlDQ1BrQ0dDb2xvclNwYWNlRGlzcGxheVAzAAAokWNgYFJJLCjIYWFgYMjNKykKcndSiIiMUmB/yMAOhLwMYgwKicnFBY4BAT5AJQwwGhV8u8bACKIv64LMOiU1tUm1XsDXYqbw1YuvRJsw1aMArpTU4mQg/QeIU5MLikoYGBhTgGzl8pICELsDyBYpAjoKyJ4DYqdD2BtA7CQI+whYTUiQM5B9A8hWSM5IBJrB+API1klCEk9HYkPtBQFul8zigpzESoUAYwKuJQOUpFaUgGjn/ILKosz0jBIFR2AopSp45iXr6SgYGRiaMzCAwhyi+nMgOCwZxc4gxJrvMzDY7v////9uhJjXfgaGjUCdXDsRYhoWDAyC3AwMJ3YWJBYlgoWYgZgpLY2B4dNyBgbeSAYG4QtAPdHFacZGYHlGHicGBtZ7//9/VmNgYJ/MwPB3wv//vxf9//93MVDzHQaGA3kAFSFl7jXH0fsAAAAJcEhZcwAACxMAAAsTAQCanBgAAAFZaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA1LjQuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIj4KICAgICAgICAgPHRpZmY6T3JpZW50YXRpb24+MTwvdGlmZjpPcmllbnRhdGlvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CkzCJ1kAAAGpSURBVDgRbZO9SgNBFIV3Q8CsUR/AKtj6AxbxFwu11qcQRMTOhxCb2EgMMS8iIcRKQQuJplbzAjYaArq7fmcyNybBC1/umXPvzO7OTMKASNM0G4bhj9dF8gEsQU4e0YMWVOl7lDGYIyFDgb6CdyjBDsx5dskXoFq5391fxLQm16EJUwNzTFCbgVu4GSlhVKBpJjoPk+MM1bVI/00QK9BRsxrImhxas2V5qvmeabQ+pyizhvnB5pyqgfzlmxbIR5BCGb9NXQtH6C66hM7riQ+wxUDa3mIRHYPFN2J+rGcb7y6DqaN6VZHQ04IkSE5IqultPiGLd0xWuB6y5kRqUpjpBpkgY3ugutNDnuuxHzXokhS8YRMv/Tgia+P0ADt/6yng9bTAC+yDwhXZpCf0MmiDr6XxWnyz6rbAHvpZG7cGOpIJDHeMyv8FPXaMOuo3WHV9iBrUbRLaLlKEFrpUbrJ60A2oWr/LGE3QdXZvMlL0A2q5JEk0uTGoMxj+M+lN9DlnsAGznk3yOXTiONaeuGCcdRvixN/feZ3qIegm6hQUXdBmV9jMexk25xf7Qm7wtDufVQAAAABJRU5ErkJggg==`;
    
    // Setup the menubar with an icon
    let icon = nativeImage.createFromDataURL(base64Icon);
    
    // Creating icon
    tray = new Tray(icon);
    
    // Ingroirng double clicks to make app faster
    tray.setIgnoreDoubleClickEvents(true);
    
    // Context Menu
    const contextMenu = Menu.buildFromTemplate([
        { label: 'About Kapturo',   role: 'about' },
        { label: 'Separator',       type: 'separator'},
        { label: 'Status',          
            submenu: [
                {label: 'On',  type: 'radio', checked: true,  click: () => mainWindow.webContents.send('status', 'on')  }, 
                {label: 'Off', type: 'radio', checked: false, click: () => mainWindow.webContents.send('status', 'off') }
            ]
        },
        { label: 'Type of links',
            submenu:[
                {label: 'Short', type: 'radio', checked: true, click: () => mainWindow.webContents.send('links', 'short') },
                {label: 'Long', type: 'radio', checked: false, click: () => mainWindow.webContents.send('links', 'long') }, 
            ]
        },
        { label: 'Separator',       type: 'separator'},
        { label: 'Quit Kapturo',    role: 'quit' },
    ]);
    
    // Setting tooltip
    tray.setToolTip('Kapturo');
    
    // Setting context Menu 
    tray.on('right-click', (event) => tray.popUpContextMenu(contextMenu));
    
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
        height: 600,
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
    
    // Sending computer id after loading
    mainWindow.webContents.on('did-finish-load', () => mainWindow.webContents.send('uid', uid) );
    
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
app.dock.hide();

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
            mainWindow.webContents.send('ping', image);
            
        });
    });
    
    // Capture keyboard events
    // ⌘ + ⇧ + 4 is a selective screenshot
    const combTwo = globalShortcut.register('Command+Shift+4', () => {
        
        const userDataPath = app.getPath('userData');
        const formatedPath = userDataPath.replace(" ", "' '");
                
        shell.exec("screencapture -i " + formatedPath + "/electron_pic.png", () => {
                
            let image = nativeImage.createFromPath(userDataPath + "/electron_pic.png").toPNG();
            
            // Sending image and machine id
            mainWindow.webContents.send('ping', image);
            
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