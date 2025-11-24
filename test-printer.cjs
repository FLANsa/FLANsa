#!/usr/bin/env node

/**
 * Test script to send a test print job directly to the thermal printer
 * Usage: node test-printer.js
 */

const net = require('net');

const PRINTER_IP = '192.168.8.190';
const PRINTER_PORT = 9100;

// ESC/POS commands for test print
function createTestPrint() {
  let commands = '';
  
  // Initialize printer
  commands += '\x1B\x40'; // ESC @ (Initialize)
  
  // Center alignment
  commands += '\x1B\x61\x01'; // ESC a 1 (Center)
  
  // Bold on
  commands += '\x1B\x45\x01'; // ESC E 1 (Bold on)
  
  // Test header
  commands += 'TEST PRINT\n';
  commands += '==========\n';
  
  // Bold off
  commands += '\x1B\x45\x00'; // ESC E 0 (Bold off)
  
  // Line feed
  commands += '\n';
  
  // Left alignment
  commands += '\x1B\x61\x00'; // ESC a 0 (Left)
  
  // Test content
  commands += 'Printer IP: ' + PRINTER_IP + '\n';
  commands += 'Printer Port: ' + PRINTER_PORT + '\n';
  commands += 'Date: ' + new Date().toLocaleString('ar-SA') + '\n';
  commands += '\n';
  commands += 'This is a test print.\n';
  commands += 'If you can read this,\n';
  commands += 'the printer is working!\n';
  commands += '\n';
  commands += '--------------------------------\n';
  commands += '\n';
  
  // Center alignment for footer
  commands += '\x1B\x61\x01'; // ESC a 1 (Center)
  commands += 'Test Successful!\n';
  commands += '\n';
  commands += '\n';
  commands += '\n';
  
  // Cut paper
  commands += '\x1D\x56\x00'; // GS V 0 (Full cut)
  
  return commands;
}

console.log(`\n🧪 Testing thermal printer connection...`);
console.log(`📍 Printer: ${PRINTER_IP}:${PRINTER_PORT}\n`);

const testData = createTestPrint();
const buffer = Buffer.from(testData, 'binary');

const socket = new net.Socket();
let connected = false;

socket.setTimeout(5000);

socket.on('connect', () => {
  connected = true;
  console.log(`✅ Connected to printer at ${PRINTER_IP}:${PRINTER_PORT}`);
  console.log(`📤 Sending test print data...`);
  socket.write(buffer);
  socket.end();
});

socket.on('close', () => {
  console.log(`✅ Connection closed`);
  if (connected) {
    console.log(`\n✅ Test print sent successfully!`);
    console.log(`   Check your printer for the test receipt.\n`);
    process.exit(0);
  } else {
    console.log(`\n❌ Connection closed before sending data\n`);
    process.exit(1);
  }
});

socket.on('error', (error) => {
  console.error(`❌ Printer connection error: ${error.message}`);
  console.log(`\n💡 Troubleshooting:`);
  console.log(`   1. Check if printer is powered on`);
  console.log(`   2. Verify printer IP: ${PRINTER_IP}`);
  console.log(`   3. Check network connection`);
  console.log(`   4. Try: ping ${PRINTER_IP}\n`);
  process.exit(1);
});

socket.on('timeout', () => {
  console.error(`❌ Connection timeout`);
  socket.destroy();
  console.log(`\n💡 Troubleshooting:`);
  console.log(`   1. Check if printer is on the network`);
  console.log(`   2. Verify printer IP: ${PRINTER_IP}`);
  console.log(`   3. Check firewall settings\n`);
  process.exit(1);
});

// Connect to printer
console.log(`🔌 Connecting to printer...`);
socket.connect(PRINTER_PORT, PRINTER_IP);

