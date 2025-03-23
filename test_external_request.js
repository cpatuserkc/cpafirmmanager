// Simple test script to send an external proposal request

const testRequest = {
  clientName: "Test Client Co.",
  contactName: "John Smith",
  contactEmail: "john@testclientco.com",
  contactPhone: "555-123-4567",
  website: "www.testclientco.com",
  industry: "Technology",
  message: "We need help with our quarterly tax filings and financial statements. Our company has been growing quickly and we need professional accounting advice."
};

fetch('http://localhost:5000/api/external/proposal-requests', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testRequest)
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch((error) => {
  console.error('Error:', error);
});