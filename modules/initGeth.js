// modules/initGethModule.js
const path = require('path');
const { exec } = require('child_process');

// Define the data directory and Geth executable path
const datadir = path.resolve(__dirname, '../.wally');
const genesisPath = path.resolve(__dirname, '../genesis.json');
const gethExecutable = process.platform === 'win32'
  ? path.resolve(__dirname, '../bin/win/geth.exe')
  : path.resolve(__dirname, '../bin/linux/geth');

function initGeth() {
  return new Promise((resolve, reject) => {
    console.log('[Init] Initializing Geth...');
    const command = `"${gethExecutable}" --datadir "${datadir}" init "${genesisPath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('[Init] Error initializing Geth:', error.message);
        return reject(error);
      }
      console.log('[Init] Geth initialization stdout:', stdout);
      console.log('[Init] Geth initialization stderr:', stderr);
      resolve();
    });
  });
}

// Export initGeth for use in other modules
module.exports = { initGeth };
