/**
 * External Platform Sync Endpoints
 * 
 * Deploy these endpoints to your external platforms:
 * - CPA Firm Clients Portal: https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev
 * - Data Engine Platform: https://ss-cpa-firm-manager-v-100-accounts95.replit.app
 */

// For Express.js servers - add these routes to your external platforms

// REQUIRED ENDPOINT 1: Receive CPA service packages from main system
app.post('/api/services/sync', (req, res) => {
  try {
    const syncData = req.body;
    console.log('Received CPA service packages sync:', {
      firmId: syncData.firmId,
      packageCount: syncData.packages?.length || 0,
      platformType: syncData.platformType,
      lastUpdated: syncData.lastUpdated
    });
    
    // Store or process the service packages
    // syncData.packages contains: id, name, marketingTitle, basePrice, priceRange, category, features
    
    // Example: Store packages in your platform's database
    if (syncData.packages) {
      syncData.packages.forEach(pkg => {
        console.log(`Package: ${pkg.name} - $${pkg.basePrice} (${pkg.category})`);
        // Store pkg in your database/storage system
      });
    }
    
    res.json({
      success: true,
      message: 'CPA service packages synchronized successfully',
      packagesReceived: syncData.packages?.length || 0,
      firmId: syncData.firmId,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Service sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync service packages',
      timestamp: new Date().toISOString()
    });
  }
});

// REQUIRED ENDPOINT 2: General sync endpoint for data updates
app.post('/api/sync', (req, res) => {
  try {
    const syncData = req.body;
    console.log('General sync received:', syncData);
    
    res.json({
      success: true,
      message: 'Data synchronized',
      syncType: syncData.platformType || 'general',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Sync failed',
      timestamp: new Date().toISOString()
    });
  }
});

// REQUIRED ENDPOINT 3: Receive service package data
app.post('/api/cpa-packages', (req, res) => {
  try {
    const packageData = req.body;
    console.log('CPA packages received:', packageData);
    
    res.json({
      success: true,
      message: 'CPA packages received and processed',
      packagesCount: packageData.packages?.length || 0,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process CPA packages',
      timestamp: new Date().toISOString()
    });
  }
});

// OPTIONAL: Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'CPA External Platform',
    timestamp: new Date().toISOString(),
    syncEndpoints: [
      '/api/services/sync',
      '/api/sync', 
      '/api/cpa-packages'
    ]
  });
});

// WEBHOOK: Send client inquiries back to main system
async function sendClientInquiryToMainSystem(inquiryData) {
  const mainSystemWebhook = 'YOUR_MAIN_SYSTEM_URL/api/webhooks/client-inquiry';
  
  try {
    const response = await fetch(mainSystemWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firmId: inquiryData.firmId || 2,
        clientName: inquiryData.clientName,
        clientEmail: inquiryData.clientEmail,
        clientPhone: inquiryData.clientPhone,
        companyName: inquiryData.companyName,
        packageId: inquiryData.packageId,
        sourceSite: 'external-platform',
        inquiryDetails: inquiryData.details,
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('Client inquiry sent to main system:', result);
      return result;
    } else {
      console.error('Failed to send inquiry to main system:', response.status);
    }
    
  } catch (error) {
    console.error('Error sending inquiry to main system:', error);
  }
}

// Example usage: When a client submits an inquiry on your external platform
app.post('/api/client-inquiry', async (req, res) => {
  try {
    const inquiry = req.body;
    
    // Process inquiry locally
    console.log('New client inquiry received:', inquiry);
    
    // Send to main CPA system
    const mainSystemResult = await sendClientInquiryToMainSystem(inquiry);
    
    res.json({
      success: true,
      message: 'Inquiry received and forwarded to CPA system',
      localId: Math.floor(Math.random() * 1000),
      mainSystemResult: mainSystemResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to process inquiry'
    });
  }
});

// Export for module usage
module.exports = {
  sendClientInquiryToMainSystem
};