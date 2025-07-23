# External Platform Integration Instructions

## Quick Setup for Your Awakened Platforms

### Platform URLs (Confirmed Awake ✅)
- **CPA Clients Portal**: `https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev`
- **Data Engine Platform**: `https://ss-cpa-firm-manager-v-100-accounts95.replit.app`

## Step 1: Add Sync Endpoints to External Platforms

Copy the endpoints from `external_platform_endpoints.js` to your external platforms:

### Required Endpoints
```javascript
POST /api/services/sync    // Receive CPA service packages
POST /api/sync            // General sync endpoint  
POST /api/cpa-packages    // Service package data receiver
GET  /api/health          // Health check (optional)
```

## Step 2: Configure Webhook URL

In your external platforms, set the main system webhook URL:
```javascript
const MAIN_SYSTEM_WEBHOOK = 'YOUR_MAIN_SYSTEM_URL/api/webhooks/client-inquiry';
```

## Step 3: Test Integration

### Test Command 1: Sync from Main System
```bash
curl -X POST YOUR_EXTERNAL_PLATFORM/api/services/sync \
  -H "Content-Type: application/json" \
  -d '{
    "firmId": 2,
    "platformType": "client_site",
    "packages": [
      {
        "id": 8,
        "name": "Startup Essential Package",
        "basePrice": 3250,
        "category": "startup"
      }
    ]
  }'
```

### Test Command 2: Send Inquiry to Main System
```bash
curl -X POST YOUR_MAIN_SYSTEM/api/webhooks/client-inquiry \
  -H "Content-Type: application/json" \
  -d '{
    "firmId": 2,
    "clientName": "John Smith",
    "clientEmail": "john@test.com",
    "packageId": 8,
    "sourceSite": "external-platform"
  }'
```

## Step 4: Verify Integration

### Main System Ready ✅
- Service packages: 3 packages ready (Startup Essential $3,250, Small Business Complete $2,500, Individual Tax Premium $1,400)
- Analytics: 787 historical engagements processed
- Pricing model: $1.83M revenue projection
- Webhook receiver: Ready for client inquiries

### External Platform Checklist
- [ ] Add sync endpoints (`/api/services/sync`, `/api/sync`, `/api/cpa-packages`)
- [ ] Configure main system webhook URL
- [ ] Test connectivity with sample data
- [ ] Verify client inquiry forwarding

## Step 5: Live Testing

Once endpoints are added, test the full integration:

```bash
# From main system - sync to external platforms
curl -X POST localhost:5000/api/service-sync/sync/2

# Expected result: All platforms show SUCCESS instead of QUEUED
```

## Benefits After Integration

### For CPA Firms
- **Standardized pricing** based on 787 historical engagements
- **Accurate time estimates** with complexity analysis
- **Unified client inquiries** from all platforms
- **Real-time synchronization** of services and pricing

### Competitive Advantage
- **Only CPA platform** with historical engagement-based pricing
- **Data-driven insights** from actual practice operations  
- **Multi-platform integration** for comprehensive client experience
- **Automated workflow** reducing manual data entry

## Next Steps After Integration

1. **API Key Security**: Add authentication between platforms
2. **Time Entry Integration**: Connect staff time tracking systems
3. **CRM Integration**: Sync client data from management systems  
4. **QuickBooks Integration**: Financial data aggregation
5. **Tax Platform Integration**: Workflow optimization

The system provides significant competitive advantages through data-driven standardized pricing that no other CPA platform offers.