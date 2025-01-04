const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

// Define the datadir relative to the project root
const datadir = path.resolve(__dirname, '.wally');

// Determine the platform and set the Geth binary path
const isWindows = os.platform() === 'win32';
const gethBinary = isWindows 
  ? path.resolve(__dirname, 'bin', 'win', 'geth.exe') 
  : path.resolve(__dirname, 'bin', 'linux', 'geth');

// Path to the genesis.json file
const genesisPath = path.resolve(__dirname, 'genesis.json');

// Command to initialize Geth
const initCommand = `"${gethBinary}" --datadir "${datadir}" init "${genesisPath}"`;

try {
  console.log('[Init] Initializing Geth...');
  execSync(initCommand, { stdio: 'inherit' }); // Run the command and inherit stdio for real-time output
  console.log('[Init] Geth successfully initialized.');
} catch (error) {
  console.error('[Init] Error initializing Geth:', error.message);
  process.exit(1); // Exit with error code 1 if initialization fails
}
