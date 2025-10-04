/**
 * ZATCA Server Routes - Secure Proxy for Invoice Submission
 * Handles CSID credentials securely on server side
 */

import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// ZATCA Configuration from environment variables
const BASE_URL = process.env.ZATCA_BASE_URL || 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation';
const CSID_TOKEN = process.env.ZATCA_CSID_TOKEN || '';
const CSID_SECRET = process.env.ZATCA_CSID_SECRET || '';

/**
 * POST /api/zatca/clearance
 * Submits invoice to ZATCA clearance API
 */
router.post('/clearance', async (req, res) => {
  try {
    console.log('📡 Received invoice submission request');
    
    const { uuid, invoiceHash, invoiceXMLBase64, previousHash, counterValue } = req.body;

    // Validate required fields
    if (!uuid || !invoiceHash || !invoiceXMLBase64) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Missing required fields: uuid, invoiceHash, invoiceXMLBase64' 
      });
    }

    // Validate CSID credentials
    if (!CSID_TOKEN || !CSID_SECRET) {
      console.error('❌ Missing ZATCA CSID credentials');
      return res.status(500).json({ 
        ok: false, 
        message: 'ZATCA credentials not configured' 
      });
    }

    // Prepare ZATCA request
    const endpoint = `${BASE_URL}/clearance/invoices`;
    const auth = Buffer.from(`${CSID_TOKEN}:${CSID_SECRET}`).toString('base64');
    
    const payload: any = {
      uuid,
      invoiceHash,
      invoice: invoiceXMLBase64
    };

    // Add optional fields if present
    if (previousHash) payload.previousInvoiceHash = previousHash;
    if (counterValue !== undefined) payload.invoiceCounterValue = counterValue;

    console.log('🌐 Submitting to ZATCA:', endpoint);
    console.log('📋 Payload:', { 
      uuid, 
      invoiceHash, 
      hasInvoice: !!invoiceXMLBase64,
      hasPreviousHash: !!previousHash,
      counterValue 
    });

    // Submit to ZATCA
    const zatcaResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': 'V2',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
      timeout: 30000 // 30 second timeout
    });

    const responseData = await zatcaResponse.json().catch(() => ({}));
    
    console.log('📊 ZATCA Response:', {
      status: zatcaResponse.status,
      ok: zatcaResponse.ok,
      hasData: !!responseData,
      errorMessage: responseData?.message || responseData?.error
    });

    if (!zatcaResponse.ok) {
      return res.status(zatcaResponse.status).json({ 
        ok: false, 
        status: zatcaResponse.status,
        message: responseData?.message || responseData?.error || 'ZATCA API error',
        data: responseData 
      });
    }

    // Success response
    return res.json({
      ok: true,
      status: zatcaResponse.status,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ ZATCA submission error:', error);
    
    return res.status(500).json({ 
      ok: false, 
      message: error?.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/zatca/reporting
 * Submits simplified invoices to ZATCA reporting API
 */
router.post('/reporting', async (req, res) => {
  try {
    console.log('📡 Received simplified invoice submission request');
    
    const { uuid, invoiceHash, invoiceXMLBase64 } = req.body;

    if (!uuid || !invoiceHash || !invoiceXMLBase64) {
      return res.status(400).json({ 
        ok: false, 
        message: 'Missing required fields: uuid, invoiceHash, invoiceXMLBase64' 
      });
    }

    const endpoint = `${BASE_URL}/reporting/invoices`;
    const auth = Buffer.from(`${CSID_TOKEN}:${CSID_SECRET}`).toString('base64');

    const zatcaResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': 'V2',
        'Accept': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        uuid,
        invoiceHash,
        invoice: invoiceXMLBase64
      }),
      timeout: 30000
    });

    const responseData = await zatcaResponse.json().catch(() => ({}));

    if (!zatcaResponse.ok) {
      return res.status(zatcaResponse.status).json({ 
        ok: false, 
        status: zatcaResponse.status,
        message: responseData?.message || responseData?.error || 'ZATCA API error',
        data: responseData 
      });
    }

    return res.json({
      ok: true,
      status: zatcaResponse.status,
      data: responseData,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ ZATCA reporting error:', error);
    
    return res.status(500).json({ 
      ok: false, 
      message: error?.message || 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/zatca/status
 * Check ZATCA service status
 */
router.get('/status', async (req, res) => {
  try {
    const hasCredentials = !!(CSID_TOKEN && CSID_SECRET);
    const environment = process.env.ZATCA_ENVIRONMENT || BASE_URL.includes('simulation') ? 'sandbox' : 'production';
    
    return res.json({
      ok: true,
      service: 'ZATCA Proxy',
      environment,
      hasCredentials,
      backend: 'Express Server',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ 
      ok: false, 
      message: 'Service status check failed' 
    });
  }
});

export default router;
