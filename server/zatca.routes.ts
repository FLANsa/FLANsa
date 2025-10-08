/**
 * ZATCA Server Routes - Secure Proxy for Invoice Submission
 * Handles CSID credentials securely on server side
 */

import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// helper to read env at call time
const getEnv = () => ({
  BASE_URL: process.env.ZATCA_BASE_URL || 'https://gw-fatoora.zatca.gov.sa/e-invoicing/simulation',
  CSID_TOKEN: process.env.ZATCA_CSID_TOKEN || '',
  CSID_SECRET: process.env.ZATCA_CSID_SECRET || '',
  ONBOARDING_URL: process.env.ZATCA_ONBOARDING_URL || '',
  PRODUCTION_CSID_URL: process.env.ZATCA_PRODUCTION_CSID_URL || ''
});

/**
 * POST /api/zatca/clearance
 * Submits invoice to ZATCA clearance API
 */
router.post('/clearance', async (req, res) => {
  try {
    const { BASE_URL, CSID_TOKEN, CSID_SECRET } = getEnv();
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
        errors: [
          {
            category: 'Upstream',
            code: (responseData?.code || responseData?.errorCode || 'ZATCA_API_ERROR'),
            message: (responseData?.message || responseData?.error || 'ZATCA API error')
          }
        ],
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
    const { BASE_URL, CSID_TOKEN, CSID_SECRET } = getEnv();
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
        errors: [
          {
            category: 'Upstream',
            code: (responseData?.code || responseData?.errorCode || 'ZATCA_API_ERROR'),
            message: (responseData?.message || responseData?.error || 'ZATCA API error')
          }
        ],
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
    const { BASE_URL, CSID_TOKEN, CSID_SECRET } = getEnv();
    const hasCredentials = !!(CSID_TOKEN && CSID_SECRET);
    const environment = (process.env.ZATCA_ENVIRONMENT
      ? process.env.ZATCA_ENVIRONMENT
      : (BASE_URL.includes('simulation') ? 'sandbox' : 'production'));
    
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

/**
 * POST /api/zatca/onboarding
 * Proxies CSR onboarding with OTP header, returns token/secret on success
 */
router.post('/onboarding', async (req, res) => {
  try {
    const { ONBOARDING_URL } = getEnv();
    if (!ONBOARDING_URL) {
      return res.status(500).json({ ok: false, message: 'ZATCA_ONBOARDING_URL not configured' });
    }

    const { csr } = req.body || {};
    if (!csr) {
      return res.status(400).json({ ok: false, message: 'Missing required field: csr' });
    }

    const otp = req.header('Otp') || req.header('OTP') || req.header('otp');
    if (!otp) {
      return res.status(400).json({ ok: false, message: 'Missing OTP header' });
    }

    console.log('🧾 Onboarding request →', ONBOARDING_URL);

    const resp = await fetch(ONBOARDING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept-Version': 'V2',
        'Accept': 'application/json',
        'Otp': otp
      },
      body: JSON.stringify({ csr }),
      timeout: 30000
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return res.status(resp.status).json({
        ok: false,
        status: resp.status,
        errors: [
          {
            category: 'Upstream',
            code: (data?.code || data?.errorCode || 'ONBOARDING_FAILED'),
            message: (data?.message || 'Onboarding failed')
          }
        ],
        data
      });
    }

    // Return the onboarding response as-is (includes token/secret on success)
    return res.json({ ok: true, status: resp.status, data, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('❌ ZATCA onboarding error:', error);
    return res.status(500).json({ ok: false, message: error?.message || 'Internal server error' });
  }
});

/**
 * POST /api/zatca/production/csids
 * Requests a Production CSID using Basic auth (token:secret) and optional compliance_request_id
 */
router.post('/production/csids', async (req, res) => {
  try {
    const { PRODUCTION_CSID_URL, CSID_TOKEN, CSID_SECRET } = getEnv();
    if (!PRODUCTION_CSID_URL) {
      return res.status(500).json({ ok: false, errors: [{ category: 'Config', code: 'MISSING_URL', message: 'ZATCA_PRODUCTION_CSID_URL not configured' }] });
    }
    if (!CSID_TOKEN || !CSID_SECRET) {
      return res.status(401).json({ ok: false, errors: [{ category: 'Auth', code: 'MISSING_CREDENTIALS', message: 'Missing CSID token/secret in server env' }] });
    }

    const { compliance_request_id } = req.body || {};
    const auth = Buffer.from(`${CSID_TOKEN}:${CSID_SECRET}`).toString('base64');

    console.log('🔐 Production CSID request →', PRODUCTION_CSID_URL);

    const resp = await fetch(PRODUCTION_CSID_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Version': 'V2',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(compliance_request_id ? { compliance_request_id } : {}),
      timeout: 30000
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      return res.status(resp.status).json({
        ok: false,
        status: resp.status,
        errors: [
          {
            category: 'Upstream',
            code: (data?.code || data?.errorCode || 'PRODUCTION_CSID_FAILED'),
            message: (data?.message || 'Production CSID request failed')
          }
        ],
        data
      });
    }

    return res.json({ ok: true, status: resp.status, data, timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error('❌ ZATCA production csid error:', error);
    return res.status(500).json({ ok: false, errors: [{ category: 'Server', code: 'INTERNAL', message: error?.message || 'Internal server error' }] });
  }
});

export default router;
