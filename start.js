#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Affiliate Boss Development Environment...\n');

// Start API server
console.log('📡 Starting API server...');
const api = spawn('node', ['server/api.js'], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
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
    const vite = spawn('npx', ['vite', '--port', '3000', '--host', '0.0.0.0'], {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    vite.stdout.on('data', (data) => {
        console.log(`[VITE] ${data.toString().trim()}`);
    });

    vite.stderr.on('data', (data) => {
        const output = data.toString().trim();
        if (!output.includes('deprecated')) { // Filter out deprecation warnings
            console.log(`[VITE] ${output}`);
        }
    });

    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n👋 Shutting down servers...');
        api.kill();
        vite.kill();
        process.exit(0);
    });

}, 2000);

console.log('\n✅ Servers starting...');
console.log('📊 Frontend: http://localhost:3000');
console.log('🔗 API: http://localhost:3001');
console.log('💡 Press Ctrl+C to stop\n');