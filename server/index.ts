/**
 * Express Server for ZATCA Integration
 * Provides secure proxy for ZATCA API calls
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import zatcaRoutes from './zatca.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'https://bigdiet-casher.onrender.com'],
  credentials: true
}));

app.use(bodyParser.json({ 
  limit: '10mb' // Allow large XML files
}));

app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ZATCA routes
app.use('/api/zatca', zatcaRoutes);

// Serve static files (if needed)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    ok: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    ok: false, 
    message: 'Route not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ZATCA Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 ZATCA Base URL: ${process.env.ZATCA_BASE_URL || 'default'}`);
  console.log(`🔐 Has CSID Token: ${!!process.env.ZATCA_CSID_TOKEN}`);
  console.log(`🔐 Has CSID Secret: ${!!process.env.ZATCA_CSID_SECRET}`);
});

export default app;
