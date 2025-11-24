import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp, getApps } from 'firebase-admin/app';
import * as net from 'net';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  initializeApp();
}

/**
 * Firebase Function to print to thermal printer via TCP
 * This function acts as a proxy server to connect to the thermal printer
 */
export const printToThermalPrinter = onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { printerIP, port, data } = req.body;

    // Validate input
    if (!printerIP || !data || !Array.isArray(data)) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: printerIP, port, and data array' 
      });
      return;
    }

    const printerPort = port || 9100;
    const binaryData = Buffer.from(data);

    console.log(`📡 Connecting to printer at ${printerIP}:${printerPort}`);
    console.log(`📦 Data size: ${binaryData.length} bytes`);

    // Connect to printer via TCP socket
    const result = await sendToPrinter(printerIP, printerPort, binaryData);

    if (result.success) {
      res.status(200).json({ success: true, message: 'Print job sent successfully' });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error: any) {
    console.error('❌ Error in printToThermalPrinter:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    });
  }
});

/**
 * Send data to thermal printer via TCP socket
 */
function sendToPrinter(
  printerIP: string,
  port: number,
  data: Buffer
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let connected = false;
    let dataSent = false;

    // Set timeout for connection (5 seconds)
    const connectionTimeout = setTimeout(() => {
      if (!connected) {
        socket.destroy();
        resolve({
          success: false,
          error: `Connection timeout: Could not connect to printer at ${printerIP}:${port}`
        });
      }
    }, 5000);

    // Set timeout for sending data (10 seconds)
    const sendTimeout = setTimeout(() => {
      if (!dataSent) {
        socket.destroy();
        resolve({
          success: false,
          error: 'Timeout: Data sending took too long'
        });
      }
    }, 10000);

    // Handle connection
    socket.connect(port, printerIP, () => {
      connected = true;
      clearTimeout(connectionTimeout);
      console.log(`✅ Connected to printer at ${printerIP}:${port}`);

      // Send data
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

        // Close connection after sending
        socket.end();
      });
    });

    // Handle errors
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

    // Handle connection close
    socket.on('close', () => {
      if (dataSent && connected) {
        console.log('✅ Connection closed successfully');
        resolve({ success: true });
      } else if (!connected) {
        // Connection was closed before data was sent
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

