/**
 * Thermal Printer Utilities
 * Functions for converting receipt data to ESC/POS commands and sending to thermal printer via IP address
 */

// ESC/POS Command Constants
const ESC = '\x1B';
const GS = '\x1D';

// ESC/POS Commands
const ESC_POS_COMMANDS = {
  INIT: ESC + '@',                    // Initialize printer
  CENTER: ESC + 'a' + '\x01',         // Center alignment
  LEFT: ESC + 'a' + '\x00',           // Left alignment
  RIGHT: ESC + 'a' + '\x02',          // Right alignment
  BOLD_ON: ESC + 'E' + '\x01',        // Bold on
  BOLD_OFF: ESC + 'E' + '\x00',       // Bold off
  FEED_LINE: '\n',                    // Feed one line
  FEED: (n: number) => ESC + 'd' + String.fromCharCode(n), // Feed n lines
  CUT: GS + 'V' + '\x41' + '\x00',    // Cut paper
  RESET: ESC + '@',                   // Reset printer
};

/**
 * Convert receipt data to ESC/POS commands
 */
export function convertReceiptToESCPOS(receiptData: {
  logoUrl?: string;
  restaurantNameAr?: string;
  restaurantName?: string;
  addressAr?: string;
  address?: string;
  phone?: string;
  crNumber?: string;
  invoiceNumber?: string;
  date?: string;
  time?: string;
  mode?: string;
  uuid?: string;
  items?: Array<{
    nameAr?: string;
    nameEn?: string;
    quantity: number;
    price: number;
  }>;
  subtotal?: number;
  discount?: number;
  discountType?: string;
  serviceCharge?: number;
  vat?: number;
  total?: number;
}): string {
  let commands = '';

  // Initialize printer
  commands += ESC_POS_COMMANDS.INIT;
  
  // Center alignment for header
  commands += ESC_POS_COMMANDS.CENTER;
  commands += ESC_POS_COMMANDS.BOLD_ON;
  
  // Restaurant name (Arabic)
  if (receiptData.restaurantNameAr) {
    commands += receiptData.restaurantNameAr + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // Restaurant name (English)
  if (receiptData.restaurantName) {
    commands += receiptData.restaurantName + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  commands += ESC_POS_COMMANDS.BOLD_OFF;
  commands += ESC_POS_COMMANDS.FEED(1);
  
  // Address (Arabic)
  if (receiptData.addressAr) {
    commands += receiptData.addressAr + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // Address (English)
  if (receiptData.address) {
    commands += receiptData.address + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // Phone
  if (receiptData.phone) {
    commands += receiptData.phone + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // CR Number
  if (receiptData.crNumber) {
    commands += 'السجل التجاري: ' + receiptData.crNumber + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  commands += ESC_POS_COMMANDS.FEED(1);
  
  // Separator line
  commands += '--------------------------------' + ESC_POS_COMMANDS.FEED_LINE;
  commands += ESC_POS_COMMANDS.FEED(1);
  
  // Left alignment for invoice details
  commands += ESC_POS_COMMANDS.LEFT;
  
  // Invoice number
  if (receiptData.invoiceNumber) {
    commands += 'رقم الفاتورة: ' + receiptData.invoiceNumber + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // Date
  if (receiptData.date) {
    commands += 'التاريخ: ' + receiptData.date + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // Time
  if (receiptData.time) {
    commands += 'الوقت: ' + receiptData.time + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // Mode
  if (receiptData.mode) {
    commands += 'النوع: ' + receiptData.mode + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  // UUID
  if (receiptData.uuid) {
    commands += 'معرف الفاتورة: ' + receiptData.uuid + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  commands += ESC_POS_COMMANDS.FEED(1);
  commands += '--------------------------------' + ESC_POS_COMMANDS.FEED_LINE;
  commands += ESC_POS_COMMANDS.FEED(1);
  
  // Items header
  commands += ESC_POS_COMMANDS.BOLD_ON;
  commands += 'الصنف'.padEnd(20) + 'الكمية'.padStart(8) + 'السعر'.padStart(12) + ESC_POS_COMMANDS.FEED_LINE;
  commands += ESC_POS_COMMANDS.BOLD_OFF;
  commands += '--------------------------------' + ESC_POS_COMMANDS.FEED_LINE;
  
  // Items
  if (receiptData.items && receiptData.items.length > 0) {
    receiptData.items.forEach((item) => {
      const nameAr = (item.nameAr || item.nameEn || '').substring(0, 18);
      const quantity = item.quantity.toString();
      const price = (item.price * item.quantity).toFixed(2);
      
      commands += nameAr.padEnd(20) + quantity.padStart(8) + price.padStart(12) + ESC_POS_COMMANDS.FEED_LINE;
      
      // English name if different
      if (item.nameEn && item.nameEn !== item.nameAr) {
        commands += ('  ' + item.nameEn).substring(0, 20).padEnd(20) + ESC_POS_COMMANDS.FEED_LINE;
      }
    });
  }
  
  commands += ESC_POS_COMMANDS.FEED(1);
  commands += '--------------------------------' + ESC_POS_COMMANDS.FEED_LINE;
  commands += ESC_POS_COMMANDS.FEED(1);
  
  // Totals
  if (receiptData.discount && receiptData.discount > 0) {
    const discountText = receiptData.discountType === 'percentage' 
      ? `خصم (${receiptData.discount}%):`
      : 'خصم:';
    const discountValue = '-' + receiptData.discount.toFixed(2);
    commands += discountText.padEnd(20) + discountValue.padStart(20) + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  if (receiptData.serviceCharge && receiptData.serviceCharge > 0) {
    commands += 'رسوم الخدمة:'.padEnd(20) + receiptData.serviceCharge.toFixed(2).padStart(20) + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  if (receiptData.vat && receiptData.vat > 0) {
    commands += 'الضريبة:'.padEnd(20) + receiptData.vat.toFixed(2).padStart(20) + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  commands += ESC_POS_COMMANDS.FEED(1);
  commands += ESC_POS_COMMANDS.BOLD_ON;
  if (receiptData.total !== undefined) {
    commands += 'المجموع الكلي:'.padEnd(20) + receiptData.total.toFixed(2).padStart(20) + ' SAR' + ESC_POS_COMMANDS.FEED_LINE;
  }
  commands += ESC_POS_COMMANDS.BOLD_OFF;
  
  commands += ESC_POS_COMMANDS.FEED(2);
  
  // Footer
  commands += ESC_POS_COMMANDS.CENTER;
  commands += 'شكراً لزيارتكم' + ESC_POS_COMMANDS.FEED_LINE;
  commands += 'Thank you for your visit' + ESC_POS_COMMANDS.FEED_LINE;
  
  if (receiptData.crNumber) {
    commands += 'CR: ' + receiptData.crNumber + ESC_POS_COMMANDS.FEED_LINE;
  }
  
  commands += ESC_POS_COMMANDS.FEED(3);
  
  // Cut paper
  commands += ESC_POS_COMMANDS.CUT;
  
  return commands;
}

/**
 * Send ESC/POS commands to thermal printer via IP address
 * Note: Due to browser security restrictions, we need to use a proxy server or WebSocket
 * For direct TCP connection, a server-side proxy is required
 */
export async function sendToThermalPrinter(
  escposData: string,
  printerIP: string,
  port: number = 9100
): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert string to Uint8Array (binary data)
    const encoder = new TextEncoder();
    const binaryData = encoder.encode(escposData);
    
    // For direct TCP connection from browser, we need to use a proxy server
    // or WebSocket connection. Since browsers don't support raw TCP sockets,
    // we'll use a fetch request to a proxy server
    
    // Try to send via proxy server first (if available)
    try {
      const proxyUrl = `http://${printerIP}:${port}/print`;
      await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: binaryData,
        mode: 'no-cors', // Bypass CORS for local network
      });
      
      return { success: true };
    } catch (proxyError) {
      // If proxy fails, try direct WebSocket connection
      console.warn('Proxy method failed, trying alternative method:', proxyError);
      
      // Alternative: Use WebSocket if printer supports it
      // This is a fallback - most thermal printers use raw TCP on port 9100
      return await sendViaWebSocket(binaryData, printerIP, port);
    }
  } catch (error: any) {
    console.error('Error sending to thermal printer:', error);
    return {
      success: false,
      error: error.message || 'فشل في إرسال أمر الطباعة إلى الطابعة'
    };
  }
}

/**
 * Send via WebSocket to proxy server (bypasses Mixed Content)
 */
async function sendViaWebSocket(
  data: Uint8Array,
  printerIP: string,
  port: number,
  wsUrl: string
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      // Create WebSocket connection to proxy server
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        resolve({
          success: false,
          error: 'WebSocket connection timeout'
        });
      }, 10000);
      
      ws.onopen = () => {
        console.log(`✅ WebSocket connected to ${wsUrl}`);
        // Send print job data
        ws.send(JSON.stringify({
          printerIP,
          port,
          data: Array.from(data)
        }));
      };
      
      ws.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const result = JSON.parse(event.data.toString());
          ws.close();
          resolve(result);
        } catch (e) {
          ws.close();
          resolve({
            success: false,
            error: 'Invalid response from WebSocket server'
          });
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        console.error('❌ WebSocket error:', error);
        // Check if it's a Mixed Content error
        const errorMsg = error instanceof Error ? error.message : 'WebSocket connection error';
        if (errorMsg.includes('Mixed Content') || errorMsg.includes('insecure')) {
          resolve({
            success: false,
            error: 'Mixed Content: WebSocket غير آمن (ws://) محظور من HTTPS. استخدم HTTP proxy بدلاً من ذلك.'
          });
        } else {
          resolve({
            success: false,
            error: `WebSocket connection error: ${errorMsg}`
          });
        }
      };
      
      ws.onclose = () => {
        clearTimeout(timeout);
      };
    } catch (error: any) {
      resolve({
        success: false,
        error: error.message || 'خطأ في الاتصال بالطابعة'
      });
    }
  });
}

/**
 * Send directly to printer using raw TCP (requires server-side proxy)
 * This function will be called from the client, but the actual TCP connection
 * must be made from a server-side proxy
 * 
 * For direct printing from iPad to thermal printer, we need a proxy server
 * that can handle TCP connections. The proxy should be running on the same network.
 */
export async function sendDirectToPrinter(
  escposData: string,
  printerIP: string,
  port: number = 9100,
  proxyServerIP?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const encoder = new TextEncoder();
    const binaryData = encoder.encode(escposData);
    
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'يجب تشغيل هذا الكود من المتصفح'
      };
    }

    // Try local proxy server first (for both localhost and production)
    // The proxy server should be running on the same network
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isHTTPS = window.location.protocol === 'https:';
    
    // For HTTPS (production), we need to try common local network IPs
    // For localhost, try localhost first
    const localProxyPorts = [3001, 8080, 5000];
    
    // Try localhost first (for development)
    if (isLocalhost) {
      for (const proxyPort of localProxyPorts) {
        try {
          const proxyUrl = `http://localhost:${proxyPort}/api/print`;
          console.log(`📡 Trying local proxy: ${proxyUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const localResponse = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              printerIP,
              port,
              data: Array.from(binaryData),
            }),
            signal: controller.signal,
            mode: 'cors',
          });
          
          clearTimeout(timeoutId);
          
          if (localResponse.ok) {
            const result = await localResponse.json();
            if (result.success) {
              return { success: true };
            }
          }
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.warn(`Failed to connect to port ${proxyPort}:`, e.message);
          }
          continue;
        }
      }
    }
    
    // For HTTPS (production), try secure connections first (WSS/HTTPS), then insecure (WS/HTTP)
    if (isHTTPS && !isLocalhost) {
      // Use provided proxy server IP or try common IPs
      // Priority: 1) provided proxyServerIP, 2) localStorage, 3) common IPs
      let finalProxyServerIP = proxyServerIP;
      if (!finalProxyServerIP && typeof window !== 'undefined') {
        try {
          // Try to get from localStorage (faster)
          const savedProxyIP = localStorage.getItem('proxyServerIP');
          if (savedProxyIP && savedProxyIP.trim() !== '') {
            finalProxyServerIP = savedProxyIP;
            console.log(`📡 Using Print Proxy Server IP from localStorage: ${finalProxyServerIP}`);
          }
        } catch (e) {
          console.warn('Could not read proxyServerIP from localStorage:', e);
        }
      }
      
      const commonIPs = finalProxyServerIP 
        ? [finalProxyServerIP]
        : [
            '192.168.8.5',  // From earlier detection
            '192.168.1.100',
            '192.168.0.100',
            '10.0.0.100',
          ];
      
      // Try WebSocket Secure (WSS) first - works with HTTPS, bypasses Mixed Content
      console.log(`🔒 [HTTPS Mode] Trying secure connections first (WSS/HTTPS)...`);
      for (const proxyIP of commonIPs) {
        try {
          const wssUrl = `wss://${proxyIP}:3444`;
          console.log(`📡 [1/4] Trying WebSocket Secure (WSS): ${wssUrl}`);
          
          const wssResult = await sendViaWebSocket(binaryData, printerIP, port, wssUrl);
          if (wssResult.success) {
            console.log(`✅ [SUCCESS] WebSocket Secure print successful via ${wssUrl}`);
            return wssResult;
          } else {
            console.warn(`⚠️ [FAILED] WebSocket Secure failed: ${wssResult.error}`);
          }
        } catch (e: any) {
          console.warn(`⚠️ [ERROR] WebSocket Secure exception:`, e.message);
          // Continue to try HTTPS
        }
      }
      
      // Try HTTPS proxy second
      console.log(`🔒 [HTTPS Mode] WSS failed, trying HTTPS...`);
      for (const proxyIP of commonIPs) {
        try {
          const httpsUrl = `https://${proxyIP}:3443/api/print`;
          console.log(`📡 [2/4] Trying HTTPS proxy: ${httpsUrl}`);
          
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          try {
            const httpsResponse = await fetch(httpsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                  printerIP,
                  port,
                  data: Array.from(binaryData),
                }),
              signal: controller.signal,
              mode: 'cors',
            });
            
            clearTimeout(timeoutId);
            
            if (httpsResponse.ok) {
              const result = await httpsResponse.json();
              if (result.success) {
                console.log(`✅ [SUCCESS] HTTPS print successful via ${httpsUrl}`);
                return { success: true };
              }
            } else {
              console.warn(`⚠️ [FAILED] HTTPS response not OK: ${httpsResponse.status}`);
            }
          } catch (fetchError: any) {
            clearTimeout(timeoutId);
            // If it's a certificate error, continue to try other methods
            if (fetchError.message?.includes('certificate') || fetchError.message?.includes('SSL')) {
              console.warn(`⚠️ HTTPS certificate error (self-signed), trying other methods...`);
              continue;
            }
            console.warn(`⚠️ HTTPS connection failed: ${fetchError.message}`);
            continue;
          }
        } catch (e: any) {
          console.warn(`⚠️ HTTPS exception:`, e.message);
          continue;
        }
      }
      
      // Try insecure WebSocket (ws://) - may be blocked by browser
      console.log(`⚠️ [HTTPS Mode] Secure connections failed, trying insecure (may be blocked)...`);
      for (const proxyIP of commonIPs) {
        try {
          const wsUrl = `ws://${proxyIP}:3002`;
          console.log(`📡 [3/4] Trying WebSocket (WS): ${wsUrl} - WARNING: May be blocked by Mixed Content`);
          
          const wsResult = await sendViaWebSocket(binaryData, printerIP, port, wsUrl);
          if (wsResult.success) {
            console.log(`✅ WebSocket print successful via ${wsUrl}`);
            return wsResult;
          } else {
            console.warn(`⚠️ WebSocket failed: ${wsResult.error}`);
          }
        } catch (e: any) {
          console.warn(`⚠️ WebSocket exception:`, e.message);
          // Continue to try HTTP
        }
      }
      
      console.log(`⚠️ [HTTPS Mode] All secure connections failed, trying HTTP with no-cors (may be blocked)...`);
      
      // If WebSocket failed, try HTTP with no-cors (may be blocked by browser)
      // Note: no-cors mode doesn't allow reading response, so we'll use a different approach
      for (const proxyIP of commonIPs) {
        for (const proxyPort of localProxyPorts) {
          try {
            const proxyUrl = `http://${proxyIP}:${proxyPort}/api/print`;
            console.log(`📡 [4/4] Trying HTTP proxy: ${proxyUrl} - WARNING: May be blocked by Mixed Content`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            // Try with no-cors first (silent send, no response reading)
            try {
              const localResponse = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  printerIP,
                  port,
                  data: Array.from(binaryData),
                }),
                signal: controller.signal,
                mode: 'no-cors', // Use no-cors to bypass Mixed Content for HTTPS->HTTP
              });
              
              clearTimeout(timeoutId);
              
              // With no-cors, we can't read the response, but if no error was thrown, assume success
              // Wait a bit to ensure data was sent
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // If we got here without error, assume success
              console.log(`✅ Print job sent via ${proxyUrl} (no-cors mode - assuming success)`);
              return { success: true };
            } catch (fetchError: any) {
              clearTimeout(timeoutId);
              
              // If it's a network error, try next IP/port
              if (fetchError.name === 'AbortError' || fetchError.message?.includes('Failed to fetch')) {
                console.warn(`⚠️ Connection failed to ${proxyUrl}, trying next...`);
                continue;
              }
              
              // For other errors, also try next
              continue;
            }
          } catch (e: any) {
            if (e.name !== 'AbortError') {
              console.warn(`⚠️ Error connecting to ${proxyIP}:${proxyPort}:`, e.message);
            }
            continue;
          }
        }
      }
    }
    
    // If all attempts failed
    const usedProxyIP = proxyServerIP || (typeof window !== 'undefined' ? localStorage.getItem('proxyServerIP') : null) || 'auto-detect';
    const isLocalhostCheck = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    // Check if this is likely a Firewall issue (works locally but not from other devices)
    const firewallWarning = !isLocalhostCheck 
      ? `\n\n⚠️ **مشكلة Firewall محتملة**:\n` +
        `إذا كانت الطباعة تعمل من جهاز الكمبيوتر لكن لا تعمل من هذا الجهاز،\n` +
        `السبب على الأرجح هو Firewall على Mac يمنع الاتصالات الواردة.\n\n` +
        `🔧 **الحل**:\n` +
        `1. افتح System Settings → Network → Firewall\n` +
        `2. أضف Node.js إلى Firewall exceptions\n` +
        `3. أو أوقف Firewall مؤقتاً للاختبار\n` +
        `4. راجع PRINT_PROXY_SETUP.md للتفاصيل الكاملة\n`
      : '';
    
    return {
      success: false,
      error: `❌ لا يمكن الاتصال بخادم الطباعة.\n\n` +
             `📋 تفاصيل المحاولة:\n` +
             `- Print Proxy Server IP المستخدم: ${usedProxyIP}\n` +
             `- Printer IP: ${printerIP}:${port}\n` +
             firewallWarning +
             `✅ تأكد من:\n` +
             `1. ✅ تشغيل Print Proxy Server على الكمبيوتر:\n` +
             `   npm run print-proxy\n\n` +
             `2. ✅ معرفة IP address الكمبيوتر:\n` +
             `   - Mac: ifconfig | grep "inet " | grep -v 127.0.0.1\n` +
             `   - Windows: ipconfig\n\n` +
             `3. ✅ إدخال IP address في الإعدادات:\n` +
             `   - اذهب إلى Settings → "IP address خادم Print Proxy المركزي"\n` +
             `   - أو أدخله في صفحة الطباعة\n\n` +
             `4. ✅ أن iPad والكمبيوتر والطابعة على نفس الشبكة WiFi\n\n` +
             `5. ✅ **أن Firewall يسمح بالاتصال على Ports** ⚠️:\n` +
             `   - HTTP: 3001\n` +
             `   - WS: 3002\n` +
             `   - HTTPS: 3443\n` +
             `   - WSS: 3444\n` +
             `   - **افتح Firewall وأضف Node.js إلى exceptions**\n\n` +
             `6. ✅ إذا كنت على HTTPS:\n` +
             `   - استخدم HTTPS/WSS (Ports 3443/3444)\n` +
             `   - قد تظهر تحذير شهادة SSL (قبلها)\n` +
             `   - أو استخدم HTTP/WS (Ports 3001/3002) - قد لا يعمل بسبب Mixed Content`
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'خطأ في إرسال أمر الطباعة'
    };
  }
}

