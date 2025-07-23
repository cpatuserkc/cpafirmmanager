// Test local service sync endpoints and external site integration

async function testServiceSyncEndpoints() {
  const baseUrl = 'http://localhost:5000';
  const firmId = 2;
  
  console.log('=== Testing Service Sync Endpoints ===\n');

  // Test 1: Get packages for sync
  try {
    const packagesResponse = await fetch(`${baseUrl}/api/service-sync/packages/${firmId}`);
    console.log(`✓ Get Packages: Status ${packagesResponse.status}`);
    if (packagesResponse.ok) {
      const packages = await packagesResponse.json();
      console.log(`  Found ${packages.length} packages ready for sync`);
      packages.forEach(pkg => console.log(`    - ${pkg.name} (${pkg.category})`));
    }
  } catch (error) {
    console.log(`✗ Get Packages failed: ${error.message}`);
  }

  // Test 2: Get sync status
  try {
    const statusResponse = await fetch(`${baseUrl}/api/service-sync/status/${firmId}`);
    console.log(`✓ Get Sync Status: Status ${statusResponse.status}`);
    if (statusResponse.ok) {
      const status = await statusResponse.json();
      console.log(`  Firm ${status.firmId} has ${status.syncStatus.length} sync records`);
    }
  } catch (error) {
    console.log(`✗ Get Sync Status failed: ${error.message}`);
  }

  // Test 3: Get service data for platforms
  try {
    const dataResponse = await fetch(`${baseUrl}/api/service-sync/data/${firmId}/client_site`);
    console.log(`✓ Get Service Data: Status ${dataResponse.status}`);
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      console.log(`  Platform data prepared with ${data.packages.length} packages`);
    }
  } catch (error) {
    console.log(`✗ Get Service Data failed: ${error.message}`);
  }

  // Test 4: Submit test inquiry
  try {
    const inquiryData = {
      firmId: firmId,
      clientName: "John Smith",
      clientEmail: "john@testcompany.com",
      clientPhone: "+1-555-0199",
      companyName: "Test Startup LLC",
      industry: "Technology",
      packageId: 1,
      urgency: "normal",
      sourceSite: "test-client-portal",
      inquiryDetails: {
        message: "Interested in startup package for new LLC formation",
        preferredContact: "email",
        timeline: "Within 2 weeks"
      }
    };

    const inquiryResponse = await fetch(`${baseUrl}/api/service-sync/inquiry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData)
    });
    
    console.log(`✓ Submit Inquiry: Status ${inquiryResponse.status}`);
    if (inquiryResponse.ok) {
      const inquiry = await inquiryResponse.json();
      console.log(`  Created inquiry ID: ${inquiry.id}`);
    }
  } catch (error) {
    console.log(`✗ Submit Inquiry failed: ${error.message}`);
  }

  // Test 5: Get inquiries
  try {
    const inquiriesResponse = await fetch(`${baseUrl}/api/service-sync/inquiries/${firmId}`);
    console.log(`✓ Get Inquiries: Status ${inquiriesResponse.status}`);
    if (inquiriesResponse.ok) {
      const inquiries = await inquiriesResponse.json();
      console.log(`  Found ${inquiries.length} client inquiries`);
    }
  } catch (error) {
    console.log(`✗ Get Inquiries failed: ${error.message}`);
  }

  console.log('\n=== Testing External Site Sync ===\n');

  // Test 6: Sync to all platforms (this will test your external URLs)
  try {
    const syncResponse = await fetch(`${baseUrl}/api/service-sync/sync/${firmId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✓ Sync All Platforms: Status ${syncResponse.status}`);
    if (syncResponse.ok) {
      const syncResults = await syncResponse.json();
      console.log(`  Sync completed for ${syncResults.length} platforms:`);
      syncResults.forEach(result => {
        console.log(`    - ${result.platform}: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        if (!result.success) {
          console.log(`      Error: ${result.error}`);
        }
      });
    }
  } catch (error) {
    console.log(`✗ Sync All Platforms failed: ${error.message}`);
  }
}

// Run the tests
testServiceSyncEndpoints().catch(console.error);