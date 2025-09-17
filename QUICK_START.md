# Quick Start Guide - Big Diet POS

Get your Big Diet Restaurant POS system up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- Firebase account
- Modern web browser

## 1. Setup Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project named "big-diet-pos"
3. Enable the following services:
   - Authentication (Email/Password)
   - Firestore Database
   - Cloud Functions
   - Hosting
   - Storage

## 2. Install Dependencies

```bash
# Clone and install
git clone <your-repo-url>
cd big-diet-pos
npm install
cd functions && npm install && cd ..
```

## 3. Configure Environment

```bash
# Copy environment template
cp env.example .env

# Edit .env with your Firebase config
# Get these values from Firebase Console > Project Settings > General
```

## 4. Deploy Firebase Rules

```bash
# Login to Firebase
firebase login

# Initialize project
firebase use --add

# Deploy security rules
firebase deploy --only firestore:rules,storage
```

## 5. Seed Database

```bash
# Download service account key from Firebase Console
# Project Settings > Service Accounts > Generate New Private Key
# Save as serviceAccountKey.json in project root

# Run seed script
npm run seed
```

## 6. Start Development

```bash
# Start development server
npm run dev

# In another terminal, start Firebase emulators
npm run emulators
```

## 7. Access the Application

- **Frontend**: http://localhost:3000
- **Firebase Emulator UI**: http://localhost:4000
- **Login**: admin@bigdiet.com / password123

## 8. Test the System

1. **Login** with admin credentials
2. **Select Terminal** (PIN: 1234)
3. **Add Items** to cart from menu
4. **Process Payment** and print receipt
5. **Check Kitchen** display for orders

## Production Deployment

```bash
# Build and deploy
npm run build
firebase deploy
```

## Key Features to Test

### POS Operations
- ✅ Add items to cart
- ✅ Change order modes (Dine-in/Takeaway/Delivery)
- ✅ Process payments
- ✅ Print receipts with ZATCA QR codes

### Management Features
- ✅ View orders and reports
- ✅ Manage inventory
- ✅ Configure settings
- ✅ Kitchen display

### Saudi Compliance
- ✅ Arabic RTL support
- ✅ SAR currency formatting
- ✅ 15% VAT calculation
- ✅ ZATCA QR code generation

## Troubleshooting

### Common Issues

1. **Firebase connection failed**
   - Check your .env file
   - Verify Firebase project settings
   - Ensure services are enabled

2. **Login not working**
   - Check if user exists in Firebase Auth
   - Verify email/password combination
   - Check browser console for errors

3. **Printer not working**
   - Use browser print dialog first
   - Check WebUSB permissions
   - Verify printer connection

4. **Arabic text issues**
   - Ensure UTF-8 encoding
   - Check font support
   - Test with different browsers

## Next Steps

1. **Customize Business Settings**
   - Update restaurant name and details
   - Configure VAT and CR numbers
   - Set up printer preferences

2. **Add Menu Items**
   - Create categories
   - Add items with prices
   - Upload images

3. **Train Staff**
   - Show login process
   - Demonstrate POS operations
   - Explain reporting features

4. **Go Live**
   - Deploy to production
   - Configure custom domain
   - Set up monitoring

## Support

- 📖 **Documentation**: See README.md, DEPLOYMENT.md, PRINTING.md, ZATCA.md
- 🐛 **Issues**: Create GitHub issue
- 💬 **Questions**: Contact support@bigdiet.com

## Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run emulators        # Start Firebase emulators
npm run build           # Build for production

# Testing
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests

# Deployment
npm run deploy          # Deploy to Firebase
npm run seed            # Seed database

# Utilities
npm run lint            # Check code quality
npm run type-check      # TypeScript validation
```

---

**Ready to serve! 🍽️**

Your Big Diet POS system is now ready to handle orders, process payments, and generate compliant receipts for your restaurant in Saudi Arabia.
