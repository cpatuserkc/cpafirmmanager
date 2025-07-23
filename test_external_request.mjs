// Test connectivity to external CPA sites
async function testSiteConnectivity() {
  const sites = [
    {
      name: "CPA Firm Clients Portal",
      url: "https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev",
      endpoints: ["/", "/api/health", "/api/services"]
    },
    {
      name: "Data Engine Platform", 
      url: "https://ss-cpa-firm-manager-v-100-accounts95.replit.app",
      endpoints: ["/", "/api/health", "/api/data"]
    }
  ];

  for (const site of sites) {
    console.log(`\n=== Testing ${site.name} ===`);
    console.log(`Base URL: ${site.url}`);
    
    for (const endpoint of site.endpoints) {
      try {
        const response = await fetch(`${site.url}${endpoint}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(5000)
        });
        
        console.log(`${endpoint}: Status ${response.status} - ${response.ok ? 'SUCCESS' : 'ERROR'}`);
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const data = await response.json();
              console.log(`  Response preview: ${JSON.stringify(data).substring(0, 100)}...`);
            } catch (e) {
              console.log(`  Response is JSON but parse failed`);
            }
          } else {
            const text = await response.text();
            console.log(`  Response preview: ${text.substring(0, 100)}...`);
          }
        }
      } catch (error) {
        console.log(`${endpoint}: FAILED - ${error.message}`);
      }
    }
  }
}

testSiteConnectivity().catch(console.error);