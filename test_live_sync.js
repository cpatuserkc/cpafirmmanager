// Test live synchronization with awakened external platforms

async function testLiveSync() {
  console.log('=== Testing Live Network Synchronization ===\n');
  
  // Test sync to both platforms now that they're awake
  try {
    const response = await fetch('http://localhost:5000/api/service-sync/sync/2', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const results = await response.json();
    
    console.log(`Network Sync Status: ${response.status}\n`);
    
    results.forEach(result => {
      const status = result.success ? '✅ LIVE SUCCESS' : '⏳ QUEUED/RETRY';
      console.log(`${result.platform}: ${status}`);
      console.log(`  Packages synced: ${result.packageCount}`);
      if (result.result) {
        console.log(`  Response: ${result.result}`);
      }
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.log(`Sync test failed: ${error.message}`);
  }
  
  // Test individual platform connectivity
  const platforms = [
    { 
      name: 'CPA Clients Portal',
      url: 'https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev'
    },
    { 
      name: 'Data Engine Platform',
      url: 'https://ss-cpa-firm-manager-v-100-accounts95.replit.app'
    }
  ];
  
  console.log('=== Direct Platform Connectivity Test ===\n');
  
  for (const platform of platforms) {
    try {
      const response = await fetch(platform.url, { 
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      console.log(`${platform.name}: Status ${response.status} - ${response.ok ? 'AWAKE ✅' : 'RESPONDING'}`);
      
    } catch (error) {
      console.log(`${platform.name}: ${error.message}`);
    }
  }
  
  // Test sync endpoints specifically
  console.log('\n=== Testing Sync Endpoint Connectivity ===\n');
  
  const syncEndpoints = [
    {
      platform: 'CPA Clients Portal',
      endpoints: [
        'https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev/api/services/sync',
        'https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev/api/sync',
        'https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev/api/cpa-packages'
      ]
    },
    {
      platform: 'Data Engine Platform', 
      endpoints: [
        'https://ss-cpa-firm-manager-v-100-accounts95.replit.app/api/services/sync',
        'https://ss-cpa-firm-manager-v-100-accounts95.replit.app/api/sync',
        'https://ss-cpa-firm-manager-v-100-accounts95.replit.app/api/cpa-packages'
      ]
    }
  ];
  
  for (const platform of syncEndpoints) {
    console.log(`Testing ${platform.platform} sync endpoints:`);
    
    for (const endpoint of platform.endpoints) {
      try {
        const testData = {
          firmId: 2,
          lastUpdated: new Date().toISOString(),
          platformType: 'client_site',
          packages: [
            {
              id: 8,
              name: 'Startup Essential Package',
              basePrice: 3250,
              category: 'startup',
              isActive: true
            }
          ]
        };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testData),
          signal: AbortSignal.timeout(8000)
        });
        
        const endpointPath = endpoint.split('/').slice(-1)[0];
        
        if (response.ok) {
          const result = await response.json();
          console.log(`  ✅ /${endpointPath}: SUCCESS (Status ${response.status})`);
          if (result.message) {
            console.log(`     Message: ${result.message}`);
          }
        } else {
          console.log(`  ⚠️  /${endpointPath}: Response ${response.status}`);
        }
        
      } catch (error) {
        const endpointPath = endpoint.split('/').slice(-1)[0];
        console.log(`  ❌ /${endpointPath}: ${error.message}`);
      }
    }
    console.log('');
  }
}

testLiveSync().catch(console.error);