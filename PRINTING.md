# Printing Guide - Big Diet POS

This guide covers receipt printing setup and configuration for the Big Diet Restaurant POS system.

## Overview

The POS system supports multiple printing methods:
- **HTML/CSS Printing** (Browser-based)
- **WebUSB/Web Serial** (Direct printer communication)
- **Cloud Print** (Google Cloud Print)
- **ESC/POS Commands** (Thermal printer protocol)

## Supported Printers

### Thermal Printers
- **58mm Paper Width**: Standard receipt size
- **80mm Paper Width**: Wide receipt format
- **ESC/POS Compatible**: Most thermal printers

### Popular Models
- Epson TM-T20, TM-T82, TM-T88
- Star TSP100, TSP650
- Citizen CT-S310, CT-S4000
- Bixolon SRP-350, SRP-275

## HTML/CSS Printing (Default)

### Setup
1. Navigate to `/print/:orderId` in the browser
2. Use browser's print dialog (Ctrl+P / Cmd+P)
3. Select thermal printer or save as PDF

### CSS Configuration
```css
@media print {
  @page {
    size: 58mm auto; /* or 80mm auto */
    margin: 0;
  }
  
  .receipt-58mm {
    width: 58mm;
    max-width: 58mm;
  }
  
  .receipt-80mm {
    width: 80mm;
    max-width: 80mm;
  }
}
```

### Receipt Template
```html
<div class="receipt receipt-58mm">
  <!-- Business Header -->
  <div class="text-center mb-4">
    <h1 class="text-lg font-bold arabic">مطعم Big Diet</h1>
    <p class="text-sm english">Big Diet Restaurant</p>
  </div>
  
  <!-- Order Details -->
  <div class="mb-4 text-xs">
    <div class="flex justify-between">
      <span class="arabic">الطلب:</span>
      <span>#A10293</span>
    </div>
  </div>
  
  <!-- Items -->
  <div class="mb-4">
    <div class="text-xs font-bold mb-2">
      <div class="flex justify-between">
        <span>الكمية</span>
        <span>الصنف</span>
        <span>السعر</span>
      </div>
    </div>
    <!-- Item rows -->
  </div>
  
  <!-- Totals -->
  <div class="text-xs mb-4">
    <div class="flex justify-between">
      <span class="arabic">المجموع الكلي:</span>
      <span>31.05 SAR</span>
    </div>
  </div>
  
  <!-- ZATCA QR Code -->
  <div class="text-center">
    <img src="data:image/png;base64,..." alt="ZATCA QR" class="w-20 h-20 mx-auto">
  </div>
</div>
```

## WebUSB/Web Serial Printing

### Setup
1. Connect thermal printer via USB
2. Navigate to Settings > Printer Setup
3. Click "Connect Printer"
4. Select your printer from the list
5. Test print to verify connection

### Browser Permissions
```javascript
// Request WebUSB permission
const device = await navigator.usb.requestDevice({
  filters: [{ classCode: 7 }] // Printer class
});

// Request Web Serial permission
const port = await navigator.serial.requestPort();
await port.open({ baudRate: 9600 });
```

### ESC/POS Commands
```javascript
import { EscPosEncoder } from 'escpos-encoder';

const encoder = new EscPosEncoder()
  .initialize()
  .text('Big Diet Restaurant')
  .newline()
  .text('Order #A10293')
  .newline()
  .cut();

// Send to printer
const writer = port.writable.getWriter();
await writer.write(encoder.encode());
writer.releaseLock();
```

### Arabic Text Support
```javascript
// For printers that don't support Arabic natively
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
ctx.font = '12px Arial';
ctx.fillText('شاورما دجاج', 0, 12);

// Convert to bitmap and send to printer
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
const bitmap = convertToBitmap(imageData);
```

## Cloud Print Integration

### Google Cloud Print Setup
1. Enable Google Cloud Print API
2. Register printer with Google Cloud Print
3. Configure OAuth2 authentication
4. Send print jobs via API

### Print Job Format
```javascript
const printJob = {
  title: 'Receipt #A10293',
  ticket: {
    version: '1.0',
    print: {
      vendor_ticket_item: [{
        id: 'receipt',
        data: receiptHtml,
        mime_type: 'text/html'
      }]
    }
  }
};

// Submit to Google Cloud Print
const response = await fetch(`https://www.google.com/cloudprint/submit`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(printJob)
});
```

## Printer Configuration

### Settings Page
Navigate to Settings > Printer Settings to configure:

1. **Default Printer**: Select primary printer
2. **Paper Size**: 58mm or 80mm
3. **Auto Print**: Automatically print after payment
4. **Print KOT**: Print kitchen order tickets
5. **Test Print**: Verify printer setup

### Printer Profiles
```javascript
const printerProfiles = {
  'thermal-58': {
    name: 'Thermal 58mm',
    width: 58,
    encoding: 'utf8',
    commands: {
      init: [0x1B, 0x40],
      cut: [0x1D, 0x56, 0x00],
      feed: [0x0A]
    }
  },
  'thermal-80': {
    name: 'Thermal 80mm',
    width: 80,
    encoding: 'utf8',
    commands: {
      init: [0x1B, 0x40],
      cut: [0x1D, 0x56, 0x00],
      feed: [0x0A]
    }
  }
};
```

## Receipt Templates

### Standard Receipt (58mm)
```
┌─────────────────────────────┐
│        مطعم Big Diet        │
│     Big Diet Restaurant     │
│   الرياض، المملكة العربية   │
│      +966 11 123 4567       │
│                             │
│ VAT: 123456789012345        │
│ CR: 1010101010              │
│                             │
│ Terminal: T-01              │
│ Cashier: أحمد محمد          │
│ Order: #A10293              │
│ Mode: DINE-IN               │
│ Date: 2025-01-17 20:15      │
│                             │
│ Qty  Item            Price  │
│ 1    شاورما دجاج      22.00 │
│ 1    7UP (330ml)       5.00 │
│      + ثلج إضافي        0.00 │
│ ─────────────────────────── │
│ Subtotal             27.00  │
│ VAT 15%               4.05  │
│ Grand Total         31.05   │
│                             │
│ Paid: Card          31.05   │
│ Change: 0.00                │
│                             │
│        شكراً لزيارتكم        │
│     Thank you for your      │
│           visit             │
│                             │
│    [ZATCA QR Code]          │
└─────────────────────────────┘
```

### Wide Receipt (80mm)
```
┌─────────────────────────────────────────────────────────┐
│                    مطعم Big Diet                        │
│                 Big Diet Restaurant                     │
│              الرياض، المملكة العربية السعودية          │
│                   +966 11 123 4567                      │
│                                                         │
│ VAT: 123456789012345    CR: 1010101010                 │
│                                                         │
│ Terminal: T-01    Cashier: أحمد محمد    Order: #A10293 │
│ Mode: DINE-IN     Date: 2025-01-17 20:15 Asia/Riyadh   │
│                                                         │
│ Qty  Item                        Price                  │
│ 1    شاورما دجاج كبير            22.00                  │
│ 1    7UP (330ml)                  5.00                  │
│      + ثلج إضافي                  0.00                  │
│ ─────────────────────────────────────────────────────── │
│ Subtotal                        27.00                   │
│ VAT 15%                          4.05                   │
│ Grand Total                    31.05 SAR                │
│                                                         │
│ Paid: Card                      31.05                   │
│ Change: 0.00                                            │
│                                                         │
│                        شكراً لزيارتكم                    │
│                    Thank you for your visit             │
│                                                         │
│                    [ZATCA QR Code]                      │
└─────────────────────────────────────────────────────────┘
```

## Kitchen Order Tickets (KOT)

### KOT Template
```
┌─────────────────────────────┐
│        KITCHEN ORDER        │
│                             │
│ Order: #A10293              │
│ Table: 5                    │
│ Time: 20:15                 │
│                             │
│ HOT KITCHEN:                │
│ 1x شاورما دجاج كبير         │
│ 1x مشاوي مشكلة             │
│                             │
│ COLD KITCHEN:               │
│ 1x سلطة خضراء               │
│                             │
│ BEVERAGES:                  │
│ 1x عصير برتقال طازج         │
│ 1x قهوة عربية               │
│                             │
│ Notes: بدون بصل             │
│                             │
│ ─────────────────────────── │
│ Order Time: 20:15           │
│ Estimated: 15 min           │
└─────────────────────────────┘
```

## Troubleshooting

### Common Issues

1. **Printer Not Detected**
   - Check USB connection
   - Verify printer is powered on
   - Try different USB port
   - Check browser permissions

2. **Arabic Text Not Displaying**
   - Use bitmap rendering for Arabic
   - Check printer font support
   - Verify encoding settings
   - Test with English text first

3. **Print Quality Issues**
   - Clean printer head
   - Check paper alignment
   - Adjust print density
   - Replace thermal paper

4. **WebUSB/Web Serial Not Working**
   - Use HTTPS (required for WebUSB/Serial)
   - Check browser compatibility
   - Grant necessary permissions
   - Try different browser

### Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WebUSB | ✅ | ❌ | ❌ | ✅ |
| Web Serial | ✅ | ❌ | ❌ | ✅ |
| HTML Print | ✅ | ✅ | ✅ | ✅ |
| Cloud Print | ✅ | ✅ | ❌ | ✅ |

### Printer Commands Reference

#### ESC/POS Commands
```javascript
const commands = {
  // Initialize printer
  init: [0x1B, 0x40],
  
  // Text formatting
  boldOn: [0x1B, 0x45, 0x01],
  boldOff: [0x1B, 0x45, 0x00],
  doubleHeight: [0x1B, 0x21, 0x10],
  doubleWidth: [0x1B, 0x21, 0x20],
  
  // Alignment
  alignLeft: [0x1B, 0x61, 0x00],
  alignCenter: [0x1B, 0x61, 0x01],
  alignRight: [0x1B, 0x61, 0x02],
  
  // Line feed and cut
  lineFeed: [0x0A],
  cut: [0x1D, 0x56, 0x00],
  
  // Barcode
  barcode: [0x1D, 0x6B, 0x04, 0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x00]
};
```

## Best Practices

### 1. Receipt Design
- Keep receipts concise and readable
- Use consistent formatting
- Include all required information
- Test with actual printer

### 2. Performance
- Cache printer connections
- Batch print jobs when possible
- Use efficient image formats
- Minimize data transfer

### 3. Error Handling
- Implement retry logic
- Provide user feedback
- Log print failures
- Fallback to browser print

### 4. Security
- Validate print data
- Sanitize user input
- Use secure connections
- Implement access controls

## Testing

### Test Print Function
```javascript
async function testPrint() {
  const testReceipt = {
    businessName: 'Big Diet Restaurant',
    businessNameAr: 'مطعم Big Diet',
    orderNumber: 'TEST-001',
    items: [
      { name: 'Test Item', nameAr: 'صنف تجريبي', price: 10.00, quantity: 1 }
    ],
    total: 10.00,
    vat: 1.50,
    grandTotal: 11.50
  };
  
  await printReceipt(testReceipt);
}
```

### Print Quality Checklist
- [ ] Text is clear and readable
- [ ] Arabic text displays correctly
- [ ] QR code is scannable
- [ ] Receipt fits paper width
- [ ] Cut position is correct
- [ ] All information is included

## Maintenance

### Regular Tasks
1. **Clean printer heads** weekly
2. **Replace thermal paper** as needed
3. **Test print quality** daily
4. **Update printer drivers** monthly
5. **Backup printer settings** regularly

### Monitoring
- Track print success rates
- Monitor printer status
- Log print errors
- Analyze print volume

### Updates
- Keep browser updated
- Update printer firmware
- Test new features
- Document changes
