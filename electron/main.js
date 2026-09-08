import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // For local file access if needed
    },
  });

  // Load the Vite build
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC: Check for dropped update files
ipcMain.handle('check-for-update-file', async () => {
  try {
     const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
     const filesToCheck = ['icd.json', 'icd.db', 'update.dll'];
     
     for (const filename of filesToCheck) {
       const filePath = path.join(exeDir, filename);
       if (fs.existsSync(filePath)) {
          console.log("Found update file:", filePath);
          const content = fs.readFileSync(filePath, 'utf-8');
          try {
             return JSON.parse(content);
          } catch (e) {
             return null; // Not valid JSON
          }
       }
     }
     return null;
  } catch (error) {
     console.error('Failed to read update file:', error);
     return null;
  }
});

ipcMain.handle('delete-update-file', async () => {
   try {
     const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
     const filesToCheck = ['icd.json', 'icd.db', 'update.dll'];
     let deleted = false;
     for (const filename of filesToCheck) {
        const filePath = path.join(exeDir, filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deleted = true;
        }
     }
     return deleted;
   } catch(err) {
      return false;
   }
});
