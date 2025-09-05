#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

console.log('🚀 Starting Affiliate Boss Development Environment...\n');

// Cross-platform command handling
const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const npxCmd = isWindows ? 'npx.cmd' : 'npx';

// Start API server with port configuration
console.log('📡 Starting API server...');
const api = spawn('node', ['server/api.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, API_PORT: '3002' }
});

api.stdout.on('data', (data) => {
    console.log(`[API] ${data.toString().trim()}`);
});

api.stderr.on('data', (data) => {
    console.error(`[API ERROR] ${data.toString().trim()}`);
});

// Wait a moment then start Vite
setTimeout(() => {
    console.log('🎨 Starting Vite frontend server...');
    
    // Try to use Vite directly, fallback to npx
    let viteCmd, viteArgs;
    
    try {
        // First try to use local Vite installation
        const vitePath = path.join(__dirname, 'node_modules', '.bin', isWindows ? 'vite.cmd' : 'vite');
        require('fs').accessSync(vitePath);
        viteCmd = vitePath;
        viteArgs = ['--port', '3000', '--host', '0.0.0.0'];
    } catch (error) {
        // Fallback to npx
        viteCmd = npxCmd;
        viteArgs = ['vite', '--port', '3000', '--host', '0.0.0.0'];
    }
    
    const vite = spawn(viteCmd, viteArgs, {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: isWindows // Use shell on Windows for better compatibility
    });

    vite.stdout.on('data', (data) => {
        console.log(`[VITE] ${data.toString().trim()}`);
    });

    vite.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (!output.includes('deprecated') && !output.includes('CJS build')) {
            console.log(`[VITE] ${output}`);
        }
    });

    vite.on('error', (error) => {
        console.error('[VITE ERROR] Failed to start Vite server:', error.message);
        console.log('\n💡 Try running manually:');
        console.log('   npm run frontend');
        console.log('   or');
        console.log('   npx vite --port 3000 --host 0.0.0.0');
    });

    // Handle shutdown
    const shutdown = () => {
        console.log('\n👋 Shutting down servers...');
        api.kill();
        vite.kill();
        process.exit(0);
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

}, 3000);

console.log('\n✅ Servers starting...');
console.log('📊 Frontend: http://localhost:3000');
console.log('🔗 API: http://localhost:3002');
console.log('💡 Press Ctrl+C to stop\n');