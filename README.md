# Big Diet Restaurant POS System

A comprehensive Point of Sale (POS) system built for restaurants in Saudi Arabia with Firebase backend, PWA capabilities, and ZATCA compliance.

## Features

### Core POS Features
- **Multi-language Support**: Arabic (RTL) and English
- **Order Management**: Dine-in, Takeaway, and Delivery modes
- **Real-time Kitchen Display**: KOT (Kitchen Order Tickets) system
- **Customer Management**: Customer database with loyalty points
- **Inventory Management**: Stock tracking with low-stock alerts
- **Payment Processing**: Multiple payment methods (Cash, Card, MADA, Apple Pay, Google Pay)
- **Receipt Printing**: Thermal printer support (58mm & 80mm)

### Saudi Arabia Compliance
- **ZATCA Integration**: Simplified invoice QR codes
- **VAT Calculation**: 15% VAT with proper rounding
- **Currency**: Saudi Riyal (SAR) support
- **Arabic Receipts**: RTL support for thermal printers

### Technical Features
- **PWA**: Offline-first Progressive Web App
- **Real-time Updates**: Firebase Firestore real-time database
- **Role-based Access**: Admin, Manager, and Cashier roles
- **PIN Security**: Terminal-specific PIN authentication
- **Cloud Functions**: Server-side invoice generation and reporting
- **Responsive Design**: Works on desktop, tablet, and mobile

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Query** for server state management
- **Zustand** for client state management
- **React Router** for navigation

### Backend
- **Firebase Authentication** (Email/Password)
- **Firestore** for real-time database
- **Cloud Functions** for server-side logic
- **Firebase Storage** for file uploads
- **Firebase Hosting** for deployment

### PWA
- **Workbox** for service worker
- **Offline Support** with IndexedDB caching
- **Installable** on mobile devices

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase CLI
- Firebase project with Authentication, Firestore, Functions, and Hosting enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd big-diet-pos
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd functions && npm install && cd ..
   ```

3. **Configure Firebase**
   ```bash
   firebase login
   firebase use --add
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your Firebase configuration
   ```

5. **Initialize Firebase project**
   ```bash
   firebase init
   # Select: Firestore, Functions, Hosting, Storage
   ```

6. **Deploy Firebase rules and functions**
   ```bash
   firebase deploy --only firestore:rules,functions
   ```

7. **Seed the database**
   ```bash
   npm run seed
   ```

8. **Start development server**
   ```bash
   npm run dev
   ```

### Development

- **Frontend**: `npm run dev` (http://localhost:3000)
- **Firebase Emulators**: `npm run emulators` (http://localhost:4000)
- **Build**: `npm run build`
- **Deploy**: `npm run deploy`

## Project Structure

```
big-diet-pos/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── stores/             # Zustand state stores
│   ├── lib/                # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── main.tsx            # App entry point
├── functions/              # Firebase Cloud Functions
│   ├── src/
│   │   ├── index.ts        # Main functions file
│   │   └── zatca.ts        # ZATCA compliance utilities
│   └── package.json
├── scripts/                # Utility scripts
│   └── seed.js             # Database seeding script
├── firebase.json           # Firebase configuration
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore indexes
└── storage.rules           # Storage security rules
```

## Configuration

### Business Settings
Configure your restaurant details in the Settings page:
- Business name (Arabic & English)
- VAT number (15 digits)
- CR number (10 digits)
- Address and contact information
- Receipt settings
- Printer configuration

### ZATCA Settings
For Saudi Arabia tax compliance:
- Seller name (Arabic & English)
- VAT number
- CR number
- Business address

### Printer Setup
- **Thermal Printers**: 58mm or 80mm paper width
- **WebUSB/Web Serial**: Direct browser-to-printer communication
- **Cloud Print**: Print via cloud services
- **HTML/CSS**: Browser print dialog

## Usage

### Cashier Workflow
1. **Login** with email/password
2. **Select Terminal** and enter PIN
3. **Add Items** to cart from menu grid
4. **Select Order Mode** (Dine-in/Takeaway/Delivery)
5. **Process Payment** with multiple tender types
6. **Print Receipt** with ZATCA QR code
7. **Send to Kitchen** for order preparation

### Manager Features
- **Inventory Management**: Add/edit items and categories
- **Customer Management**: View customer database
- **Reports**: X/Z reports, VAT reports, sales analytics
- **Settings**: Configure business and system settings

### Admin Features
- **User Management**: Create/edit user accounts
- **Branch Management**: Multi-location support
- **System Settings**: Global configuration
- **Backup/Restore**: Data management

## API Reference

### Cloud Functions

#### `generateInvoice`
Triggers when a new order is created. Generates invoice number and ZATCA QR code.

#### `updateStockOnOrderComplete`
Updates inventory when order status changes to completed.

#### `generateXReport`
Generates X report for current shift.

#### `generateZReport`
Generates Z report for end of day.

### Firestore Collections

- `users` - User accounts and roles
- `branches` - Restaurant locations
- `terminals` - POS terminals
- `categories` - Menu categories
- `items` - Menu items
- `orders` - Customer orders
- `payments` - Payment records
- `invoices` - Invoice records with ZATCA data
- `customers` - Customer database
- `stockMoves` - Inventory movements
- `reports` - Generated reports
- `settings` - System configuration

## Security

### Authentication
- Email/password authentication only
- Role-based access control (Admin, Manager, Cashier)
- Terminal-specific PIN authentication

### Firestore Rules
- Users can only access data for their assigned branch
- Cashiers can create orders and payments
- Managers can access inventory and reports
- Admins have full access

### Data Validation
- Server-side validation in Cloud Functions
- Client-side validation with TypeScript
- ZATCA compliance validation

## Deployment

### Production Deployment
1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Firebase**
   ```bash
   firebase deploy
   ```

3. **Configure custom domain** (optional)
   ```bash
   firebase hosting:channel:deploy production
   ```

### Environment Variables
Set the following environment variables in Firebase Functions:
- `VAT_RATE=15`
- `CURRENCY=SAR`
- `TIMEZONE=Asia/Riyadh`

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### PWA Testing
- Use Lighthouse to test PWA compliance
- Test offline functionality
- Verify installability

## Troubleshooting

### Common Issues

1. **Firebase Emulators Not Starting**
   - Ensure ports 4000, 5000, 5001, 8080, 9099, 9199 are available
   - Check Firebase CLI version: `firebase --version`

2. **ZATCA QR Code Not Generating**
   - Verify ZATCA settings are configured
   - Check VAT number format (15 digits)
   - Ensure CR number format (10 digits)

3. **Printer Not Working**
   - Check WebUSB/Web Serial permissions
   - Verify printer is connected and powered on
   - Test with browser print dialog first

4. **Offline Mode Issues**
   - Clear browser cache and service worker
   - Check IndexedDB storage quota
   - Verify Firestore persistence is enabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact: support@bigdiet.com
- Documentation: [Link to docs]

## Roadmap

### Version 1.1
- [ ] Multi-branch support
- [ ] Advanced reporting
- [ ] Customer loyalty program
- [ ] Mobile app (React Native)

### Version 1.2
- [ ] Integration with delivery platforms
- [ ] Advanced inventory management
- [ ] Staff scheduling
- [ ] Analytics dashboard

### Version 2.0
- [ ] AI-powered menu recommendations
- [ ] Predictive inventory management
- [ ] Advanced customer analytics
- [ ] Multi-currency support
