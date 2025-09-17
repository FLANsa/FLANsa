# Deployment Guide - Big Diet POS

This guide covers deploying the Big Diet Restaurant POS system to production.

## Prerequisites

- Firebase CLI installed and authenticated
- Firebase project created with required services enabled
- Domain name (optional, for custom domain)
- SSL certificate (handled by Firebase Hosting)

## Firebase Project Setup

### 1. Create Firebase Project
```bash
firebase login
firebase projects:create big-diet-pos
firebase use big-diet-pos
```

### 2. Enable Required Services
```bash
# Enable Authentication
firebase auth:enable

# Enable Firestore
firebase firestore:create

# Enable Functions
firebase functions:create

# Enable Hosting
firebase hosting:create

# Enable Storage
firebase storage:create
```

### 3. Configure Authentication
1. Go to Firebase Console > Authentication > Sign-in method
2. Enable Email/Password authentication
3. Configure authorized domains

### 4. Configure Firestore
1. Go to Firebase Console > Firestore Database
2. Create database in production mode
3. Deploy security rules: `firebase deploy --only firestore:rules`

### 5. Configure Storage
1. Go to Firebase Console > Storage
2. Deploy storage rules: `firebase deploy --only storage`

## Environment Configuration

### 1. Create Environment File
```bash
cp env.example .env
```

### 2. Update Environment Variables
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=big-diet-pos.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=big-diet-pos
VITE_FIREBASE_STORAGE_BUCKET=big-diet-pos.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Business Configuration
VITE_BUSINESS_NAME=Big Diet Restaurant
VITE_BUSINESS_NAME_AR=مطعم Big Diet
VITE_VAT_NUMBER=123456789012345
VITE_CR_NUMBER=1010101010
VITE_BUSINESS_ADDRESS=Riyadh, Saudi Arabia
VITE_BUSINESS_ADDRESS_AR=الرياض، المملكة العربية السعودية
VITE_BUSINESS_PHONE=+966 11 123 4567
VITE_BUSINESS_EMAIL=info@bigdiet.com

# ZATCA Configuration
VITE_ZATCA_SELLER_NAME=Big Diet Restaurant
VITE_ZATCA_SELLER_NAME_AR=مطعم Big Diet
VITE_ZATCA_VAT_NUMBER=123456789012345
VITE_ZATCA_CR_NUMBER=1010101010
```

### 3. Firebase Functions Environment
```bash
firebase functions:config:set app.vat_rate=15
firebase functions:config:set app.currency=SAR
firebase functions:config:set app.timezone=Asia/Riyadh
```

## Build and Deploy

### 1. Install Dependencies
```bash
npm install
cd functions && npm install && cd ..
```

### 2. Build Functions
```bash
cd functions
npm run build
cd ..
```

### 3. Deploy Everything
```bash
firebase deploy
```

### 4. Deploy Specific Services
```bash
# Deploy only functions
firebase deploy --only functions

# Deploy only hosting
firebase deploy --only hosting

# Deploy only firestore rules
firebase deploy --only firestore:rules

# Deploy only storage rules
firebase deploy --only storage
```

## Database Setup

### 1. Seed Initial Data
```bash
# Make sure you have serviceAccountKey.json in the root directory
npm run seed
```

### 2. Create Admin User
```bash
# Use Firebase CLI to create admin user
firebase auth:import users.json
```

### 3. Set User Claims
```javascript
// Run this in Firebase Functions or Admin SDK
const admin = require('firebase-admin');
admin.auth().setCustomUserClaims('user-uid', { 
  role: 'admin',
  branchId: 'main-branch'
});
```

## Custom Domain Setup

### 1. Add Custom Domain
```bash
firebase hosting:channel:deploy production --only hosting
```

### 2. Configure DNS
1. Go to Firebase Console > Hosting
2. Add custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate provisioning

### 3. Update Firebase Configuration
Update your `.env` file with the custom domain:
```env
VITE_FIREBASE_AUTH_DOMAIN=pos.bigdiet.com
```

## Production Configuration

### 1. Security Rules
Ensure production security rules are deployed:
```bash
firebase deploy --only firestore:rules,storage
```

### 2. CORS Configuration
Configure CORS for your domain in Firebase Functions:
```javascript
const cors = require('cors')({origin: 'https://pos.bigdiet.com'});
```

### 3. Rate Limiting
Implement rate limiting in Cloud Functions:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

## Monitoring and Logging

### 1. Enable Monitoring
```bash
# Enable Firebase Performance Monitoring
firebase perf:enable

# Enable Firebase Crashlytics
firebase crashlytics:enable
```

### 2. Set Up Alerts
1. Go to Firebase Console > Monitoring
2. Set up alerts for:
   - Function errors
   - High latency
   - Storage quota
   - Authentication failures

### 3. Log Analysis
```bash
# View function logs
firebase functions:log

# View hosting logs
firebase hosting:channel:logs production
```

## Backup and Recovery

### 1. Database Backup
```bash
# Export Firestore data
gcloud firestore export gs://big-diet-pos-backup/firestore-export

# Schedule regular backups
gcloud scheduler jobs create http firestore-backup \
  --schedule="0 2 * * *" \
  --uri="https://firestore.googleapis.com/v1/projects/big-diet-pos/databases/(default):exportDocuments"
```

### 2. Storage Backup
```bash
# Backup Firebase Storage
gsutil -m cp -r gs://big-diet-pos.appspot.com gs://big-diet-pos-backup/storage
```

### 3. Recovery Process
```bash
# Restore Firestore data
gcloud firestore import gs://big-diet-pos-backup/firestore-export

# Restore Storage data
gsutil -m cp -r gs://big-diet-pos-backup/storage gs://big-diet-pos.appspot.com
```

## Performance Optimization

### 1. Firestore Indexes
Deploy optimized indexes:
```bash
firebase deploy --only firestore:indexes
```

### 2. CDN Configuration
Configure Firebase Hosting CDN:
```json
{
  "hosting": {
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 3. Function Optimization
- Use connection pooling
- Implement caching
- Optimize cold starts
- Set appropriate memory limits

## Security Checklist

### 1. Authentication
- [ ] Email/password authentication enabled
- [ ] Authorized domains configured
- [ ] User roles properly set
- [ ] PIN authentication working

### 2. Database Security
- [ ] Firestore rules deployed
- [ ] Storage rules deployed
- [ ] No sensitive data in client code
- [ ] Proper data validation

### 3. Network Security
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] DDoS protection enabled

### 4. Data Privacy
- [ ] GDPR compliance (if applicable)
- [ ] Data encryption at rest
- [ ] Secure data transmission
- [ ] Regular security audits

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

2. **Function Deployment Errors**
   ```bash
   # Check function logs
   firebase functions:log --only generateInvoice
   
   # Test functions locally
   firebase emulators:start --only functions
   ```

3. **Hosting Issues**
   ```bash
   # Check hosting status
   firebase hosting:channel:list
   
   # Rollback if needed
   firebase hosting:channel:rollback production
   ```

4. **Database Connection Issues**
   - Verify Firestore rules
   - Check authentication status
   - Validate API keys
   - Review network connectivity

### Performance Issues

1. **Slow Loading**
   - Check bundle size
   - Optimize images
   - Enable compression
   - Use CDN

2. **High Function Costs**
   - Optimize function code
   - Implement caching
   - Reduce cold starts
   - Monitor usage

3. **Database Performance**
   - Add proper indexes
   - Optimize queries
   - Use pagination
   - Monitor read/write operations

## Maintenance

### 1. Regular Updates
```bash
# Update dependencies
npm update
npm audit fix

# Update Firebase CLI
npm install -g firebase-tools@latest
```

### 2. Security Updates
- Monitor security advisories
- Update dependencies regularly
- Review and update security rules
- Conduct security audits

### 3. Performance Monitoring
- Monitor function performance
- Track database usage
- Analyze user behavior
- Optimize based on metrics

## Support and Maintenance

### 1. Monitoring Setup
- Set up uptime monitoring
- Configure error tracking
- Monitor performance metrics
- Set up alerting

### 2. Backup Strategy
- Daily automated backups
- Test restore procedures
- Store backups securely
- Document recovery process

### 3. Documentation
- Keep deployment docs updated
- Document configuration changes
- Maintain runbooks
- Update troubleshooting guides

## Cost Optimization

### 1. Firebase Usage
- Monitor Firestore reads/writes
- Optimize function execution time
- Use appropriate storage classes
- Implement caching strategies

### 2. Resource Management
- Right-size function memory
- Optimize database queries
- Use CDN effectively
- Monitor bandwidth usage

### 3. Scaling Considerations
- Plan for traffic spikes
- Implement auto-scaling
- Use regional deployments
- Optimize for cost vs performance
