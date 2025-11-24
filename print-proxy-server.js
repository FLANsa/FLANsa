/**
 * Simple Print Proxy Server
 * Run this server on the same network as the printer
 * Usage: node print-proxy-server.js
 */

import http from 'http';
import https from 'https';
import net from 'net';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;
const WS_PORT = 3002;
const HTTPS_PORT = 3443;
const WSS_PORT = 3444;

// Load SSL certificates (self-signed for local network)
let httpsOptions = null;
try {
  httpsOptions = {
    key: readFileSync(join(__dirname, 'certs', 'key.pem')),
    cert: readFileSync(join(__dirname, 'certs', 'cert.pem'))
  };
  console.log('✅ SSL certificates loaded');
} catch (error) {
  console.warn('⚠️ SSL certificates not found. HTTPS/WSS will not be available.');
  console.warn('💡 Generate certificates: mkdir -p certs && openssl req -x509 -newkey rsa:2048 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes -subj "/CN=localhost"');
}

// Handle uncaught errors to prevent server crash
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Log all requests for debugging
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    console.log(`✅ OPTIONS request handled`);
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL - handle query strings by splitting
  const urlPath = req.url?.split('?')[0] || '/';
  
  console.log(`📥 Parsed path: ${urlPath}, Method: ${req.method}`);

  // Handle health check endpoint
  if (req.method === 'GET' && urlPath === '/api/health') {
    console.log(`✅ Health check request received`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      success: true, 
      status: 'running',
      timestamp: new Date().toISOString(),
      ports: {
        http: PORT,
        ws: WS_PORT,
        https: HTTPS_PORT,
        wss: WSS_PORT
      }
    }));
    return;
  }

  // Only handle POST requests to /api/print
  if (req.method !== 'POST' || urlPath !== '/api/print') {
    console.log(`❌ Invalid request: ${req.method} ${urlPath} (expected: POST /api/print or GET /api/health)`);
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: `Not found: ${req.method} ${urlPath}` }));
    return;
  }

  console.log(`✅ Received POST request to /api/print`);

  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    try {
      const { printerIP, port, data } = JSON.parse(body);

      if (!printerIP || !data || !Array.isArray(data)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: printerIP, port, and data array' 
        }));
        return;
      }

      const printerPort = port || 9100;
      const binaryData = Buffer.from(data);

      console.log(`📡 Connecting to printer at ${printerIP}:${printerPort}`);
      console.log(`📦 Data size: ${binaryData.length} bytes`);

      // Send to printer
      const result = await sendToPrinter(printerIP, printerPort, binaryData);

      if (result.success) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Print job sent successfully' }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: result.error }));
      }
    } catch (error) {
      console.error('❌ Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }));
    }
  });
});

function sendToPrinter(printerIP, port, data) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let connected = false;
    let dataSent = false;

    const connectionTimeout = setTimeout(() => {
      if (!connected) {
        socket.destroy();
        resolve({
          success: false,
          error: `Connection timeout: Could not connect to printer at ${printerIP}:${port}`
        });
      }
    }, 5000);

    const sendTimeout = setTimeout(() => {
      if (!dataSent) {
        socket.destroy();
        resolve({
          success: false,
          error: 'Timeout: Data sending took too long'
        });
      }
    }, 10000);

    socket.connect(port, printerIP, () => {
      connected = true;
      clearTimeout(connectionTimeout);
      console.log(`✅ Connected to printer at ${printerIP}:${port}`);

      socket.write(data, (err) => {
        if (err) {
          clearTimeout(sendTimeout);
          socket.destroy();
          resolve({
            success: false,
            error: `Failed to send data: ${err.message}`
          });
          return;
        }

        dataSent = true;
        clearTimeout(sendTimeout);
        console.log(`✅ Data sent successfully (${data.length} bytes)`);
        socket.end();
      });
    });

    socket.on('error', (err) => {
      clearTimeout(connectionTimeout);
      clearTimeout(sendTimeout);
      socket.destroy();
      console.error(`❌ Socket error:`, err);
      resolve({
        success: false,
        error: `Connection error: ${err.message}`
      });
    });

    socket.on('close', () => {
      if (dataSent && connected) {
        console.log('✅ Connection closed successfully');
        resolve({ success: true });
      } else if (!connected) {
        clearTimeout(connectionTimeout);
        clearTimeout(sendTimeout);
        resolve({
          success: false,
          error: 'Connection closed before data could be sent'
        });
      }
    });
  });
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Print Proxy Server (HTTP) running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Ready to forward print jobs to thermal printers`);
  console.log(`💡 Make sure this server is on the same network as your printer`);
});

// HTTPS server for secure connections (bypasses Mixed Content)
if (httpsOptions) {
  const httpsServer = https.createServer(httpsOptions, (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Log all requests for debugging
    console.log(`📥 [HTTPS] [${new Date().toISOString()}] ${req.method} ${req.url}`);

    // Handle preflight
    if (req.method === 'OPTIONS') {
      console.log(`✅ [HTTPS] OPTIONS request handled`);
      res.writeHead(204);
      res.end();
      return;
    }

    // Parse URL - handle query strings by splitting
    const urlPath = req.url?.split('?')[0] || '/';
    
    console.log(`📥 [HTTPS] Parsed path: ${urlPath}, Method: ${req.method}`);

    // Handle health check endpoint
    if (req.method === 'GET' && urlPath === '/api/health') {
      console.log(`✅ [HTTPS] Health check request received`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        status: 'running',
        timestamp: new Date().toISOString(),
        ports: {
          http: PORT,
          ws: WS_PORT,
          https: HTTPS_PORT,
          wss: WSS_PORT
        }
      }));
      return;
    }

    // Only handle POST requests to /api/print
    if (req.method !== 'POST' || urlPath !== '/api/print') {
      console.log(`❌ [HTTPS] Invalid request: ${req.method} ${urlPath} (expected: POST /api/print or GET /api/health)`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: `Not found: ${req.method} ${urlPath}` }));
      return;
    }

    console.log(`✅ [HTTPS] Received POST request to /api/print`);

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const { printerIP, port, data } = JSON.parse(body);

        if (!printerIP || !data || !Array.isArray(data)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: false, 
            error: 'Missing required fields: printerIP, port, and data array' 
          }));
          return;
        }

        const printerPort = port || 9100;
        const binaryData = Buffer.from(data);

        console.log(`📡 [HTTPS] Connecting to printer at ${printerIP}:${printerPort}`);
        console.log(`📦 [HTTPS] Data size: ${binaryData.length} bytes`);

        // Send to printer
        const result = await sendToPrinter(printerIP, printerPort, binaryData);

        if (result.success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Print job sent successfully' }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: result.error }));
        }
      } catch (error) {
        console.error('❌ [HTTPS] Error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: false, 
          error: error.message || 'Internal server error' 
        }));
      }
    });
  });

  httpsServer.listen(HTTPS_PORT, '0.0.0.0', () => {
    console.log(`🔒 Print Proxy Server (HTTPS) running on https://0.0.0.0:${HTTPS_PORT}`);
    console.log(`⚠️  Note: Self-signed certificate - browser will show security warning (click "Advanced" → "Proceed")`);
  });
}

// WebSocket server (HTTP) for localhost and development
try {
  const wss = new WebSocketServer({ port: WS_PORT, host: '0.0.0.0' });
  
  wss.on('connection', (ws) => {
    console.log('🔌 [WS] WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        const { printerIP, port, data: printData } = data;
        
        if (!printerIP || !printData || !Array.isArray(printData)) {
          ws.send(JSON.stringify({ success: false, error: 'Invalid data' }));
          return;
        }
        
        const printerPort = port || 9100;
        const binaryData = Buffer.from(printData);
        
        console.log(`📡 [WS] Connecting to printer at ${printerIP}:${printerPort}`);
        
        const result = await sendToPrinter(printerIP, printerPort, binaryData);
        ws.send(JSON.stringify(result));
      } catch (error) {
        console.error('❌ [WS] Error:', error);
        ws.send(JSON.stringify({ success: false, error: error.message }));
      }
    });
    
    ws.on('close', () => {
      console.log('🔌 [WS] WebSocket client disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('❌ [WS] Error:', error);
    });
  });
  
  console.log(`🔌 WebSocket server (WS) running on ws://0.0.0.0:${WS_PORT}`);
} catch (error) {
  console.warn('⚠️ WebSocket server not available (ws package may be missing):', error.message);
  console.log('💡 Install ws package: npm install ws');
}

// WebSocket Secure server (WSS) for HTTPS clients (bypasses Mixed Content)
if (httpsOptions) {
  try {
    const httpsServerForWSS = https.createServer(httpsOptions);
    const wssSecure = new WebSocketServer({ 
      server: httpsServerForWSS
    });
    
    wssSecure.on('connection', (ws) => {
      console.log('🔒 [WSS] WebSocket Secure client connected');
      
      ws.on('message', async (message) => {
        try {
          const data = JSON.parse(message.toString());
          const { printerIP, port, data: printData } = data;
          
          if (!printerIP || !printData || !Array.isArray(printData)) {
            ws.send(JSON.stringify({ success: false, error: 'Invalid data' }));
            return;
          }
          
          const printerPort = port || 9100;
          const binaryData = Buffer.from(printData);
          
          console.log(`📡 [WSS] Connecting to printer at ${printerIP}:${printerPort}`);
          
          const result = await sendToPrinter(printerIP, printerPort, binaryData);
          ws.send(JSON.stringify(result));
        } catch (error) {
          console.error('❌ [WSS] Error:', error);
          ws.send(JSON.stringify({ success: false, error: error.message }));
        }
      });
      
      ws.on('close', () => {
        console.log('🔒 [WSS] WebSocket Secure client disconnected');
      });
      
      ws.on('error', (error) => {
        console.error('❌ [WSS] Error:', error);
      });
    });
    
    httpsServerForWSS.listen(WSS_PORT, '0.0.0.0', () => {
      console.log(`🔒 WebSocket Secure server (WSS) running on wss://0.0.0.0:${WSS_PORT}`);
    });
  } catch (error) {
    console.warn('⚠️ WebSocket Secure server not available:', error.message);
  }
}

