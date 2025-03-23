// Test script to send multiple external proposal requests

const testRequests = [
  {
    clientName: "Adams Family Trust",
    contactName: "Morticia Adams",
    contactEmail: "morticia@adamsfamily.com",
    contactPhone: "555-666-7777",
    website: "www.adamsfamily.com",
    industry: "Real Estate",
    message: "We need help with our estate planning and tax optimization. Our family has multiple properties and investments that need proper accounting."
  },
  {
    clientName: "White Dental Practice",
    contactName: "Dr. Daniel White",
    contactEmail: "dr.white@whitedental.com",
    contactPhone: "555-222-3333",
    website: "www.whitedental.com",
    industry: "Healthcare",
    message: "Looking for bookkeeping services and financial planning for our dental practice. We have 5 dentists and 15 staff members."
  },
  {
    clientName: "Blue Mountain Brewery",
    contactName: "Sam Johnson",
    contactEmail: "sam@bluemtnbrewery.com",
    contactPhone: "555-987-6543",
    website: "www.bluemtnbrewery.com",
    industry: "Food & Beverage",
    message: "We need help with inventory accounting and tax filing for our craft brewery business. We're expanding to a second location and need financial guidance."
  }
];

async function sendRequests() {
  for (const request of testRequests) {
    try {
      const response = await fetch('http://localhost:5000/api/external/proposal-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      const data = await response.json();
      console.log(`Success for ${request.clientName}:`, data);
      
      // Wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error for ${request.clientName}:`, error);
    }
  }
}

sendRequests();