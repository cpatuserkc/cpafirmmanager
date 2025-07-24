# Data Engines Integration Guide

## Overview

The Data Engines system provides powerful external processing capabilities for your CPA Resource Hub, enabling document analysis, bulk calculations, and large-scale data manipulation through specialized engines.

## Available Data Engines

### 1. CPA Analytics Engine
- **URL**: `https://ss-cpa-firm-manager-v-100-accounts95.replit.app`
- **Capabilities**: Tax calculations, financial analysis, client insights, bulk processing
- **Max File Size**: 50MB
- **Formats**: PDF, Excel, CSV, JSON, ZIP

### 2. Document Processing Engine  
- **URL**: `https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev`
- **Capabilities**: Document analysis, OCR, data extraction, compliance checking
- **Max File Size**: 100MB
- **Formats**: PDF, JPG, PNG, TIFF, ZIP

### 3. High-Performance Calculation Engine
- **URL**: Configurable via environment
- **Capabilities**: Complex calculations, tax modeling, scenario analysis, optimization
- **Max File Size**: 200MB
- **Formats**: JSON, CSV, Excel, ZIP

## Core Operations

### Document Processing
Submit documents for automated analysis and data extraction:

```javascript
POST /api/data-engines/process-document
{
  "filePath": "/path/to/document.pdf",
  "documentType": "tax_return",
  "analysisType": "extract_data", 
  "firmId": 2,
  "clientId": 1,
  "engineId": "document_processor" // optional
}
```

**Document Types:**
- `tax_return` - Tax returns and schedules
- `financial_statement` - Balance sheets, P&L statements
- `client_records` - Client files and documentation
- `general` - Any business document

**Analysis Types:**
- `extract_data` - Extract structured data from documents
- `validate_entries` - Verify data accuracy and completeness
- `calculate_totals` - Compute sums and financial totals
- `compliance_check` - Verify regulatory compliance

### Bulk Calculations
Process large datasets with complex calculations:

```javascript
POST /api/data-engines/bulk-calculate
{
  "calculationType": "tax_estimates",
  "dataSet": [
    { "income": 50000, "deductions": 12000, "filingStatus": "single" },
    { "income": 75000, "deductions": 18000, "filingStatus": "married" }
  ],
  "parameters": {
    "taxYear": 2024,
    "includeState": true
  },
  "engineId": "calculation_engine" // optional
}
```

**Calculation Types:**
- `tax_estimates` - Tax liability calculations
- `depreciation` - Asset depreciation schedules
- `payroll` - Payroll tax and benefit calculations
- `custom` - Custom business calculations

### Financial Analysis with QuickBooks Integration
Combine live QuickBooks data with historical insights:

```javascript
POST /api/data-engines/financial-analysis
{
  "qbData": {
    "totalRevenue": 150000,
    "totalExpenses": 90000,
    "clientCount": 25,
    "topClients": [...]
  },
  "analysisType": "profitability",
  "engineId": "cpa_analytics_engine" // optional
}
```

**Analysis Types:**
- `cash_flow` - Cash flow analysis and projections
- `profitability` - Profit margin and efficiency analysis
- `tax_planning` - Tax optimization strategies
- `forecasting` - Revenue and expense forecasting

## Job Management

### Check Job Status
```javascript
GET /api/data-engines/job/{jobId}
```

### Get All Jobs for Firm
```javascript
GET /api/data-engines/jobs/{firmId}
```

### Test Engine Connectivity
```javascript
GET /api/data-engines/test/{engineId}
```

## Enhanced Intelligence

### Historical Data Integration
All processing jobs are automatically enhanced with your 787 historical client engagements:

- **Service Breakdown**: Tax (450), Accounting (220), Advisory (85), Payroll (32)
- **Complexity Distribution**: Basic (320), Intermediate (285), Advanced (140), Complex (42)
- **Staff Role Requirements**: Detailed role mapping and hourly rates
- **Time Estimation Models**: Proven accuracy from historical data

### Real-Time Synchronization
Data engines integrate seamlessly with:
- **QuickBooks Live Data**: Current financial metrics and client information
- **External Platforms**: Your connected CPA client portals and data engines
- **CPA System**: Service packages, time estimates, and pricing models

## Competitive Advantages

### Multi-Modal Processing
- **Documents**: PDF analysis, OCR, data extraction
- **Calculations**: Large-scale tax and financial computations
- **Integration**: QB data + historical insights + real-time processing

### Scalable Architecture
- **Asynchronous Processing**: Handle large jobs without blocking
- **Multiple Engines**: Route operations to specialized processors
- **Load Distribution**: Balance processing across available engines

### Historical Intelligence
- **787 Engagements**: Every analysis enhanced with proven patterns
- **Complexity Modeling**: Accurate scoping based on historical data
- **Staff Optimization**: Role assignments based on successful projects

## File Upload Integration

### Supported Operations with File Uploads

**ZIP File Processing:**
- Upload entire client folders for batch processing
- Automatic file type detection and routing
- Bulk document analysis and data extraction
- Consolidated reporting across multiple documents

**Large Document Sets:**
- Tax return packages with multiple schedules
- Complete financial statement sets
- Client records and supporting documentation
- Scanned document collections

### Implementation Example

```javascript
// Example: Process uploaded tax return package
const formData = new FormData();
formData.append('file', clientTaxPackage.zip);
formData.append('documentType', 'tax_return');
formData.append('analysisType', 'extract_data');
formData.append('firmId', '2');

const job = await submitDocumentProcessing(formData);
```

## Integration Benefits

### For CPA Firms
- **Automated Processing**: Handle large document volumes efficiently
- **Enhanced Accuracy**: Historical data improves analysis quality
- **Scalable Operations**: Process hundreds of returns simultaneously
- **Competitive Intelligence**: Unique market insights from 787 engagements

### For Clients
- **Faster Service**: Automated processing reduces turnaround time
- **Better Accuracy**: Multiple validation layers and historical benchmarking
- **Comprehensive Analysis**: Document + data + calculation integration
- **Transparent Pricing**: Historical engagement data enables accurate estimates

The Data Engines system transforms your CPA practice into a high-performance, data-driven operation with capabilities that no competitor can match through the combination of specialized processing engines and 787 historical client engagements.