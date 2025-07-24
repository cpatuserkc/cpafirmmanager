# Tax Document Extraction Demo

## How It Works for New Clients

When a new client provides their prior year tax return, your system automatically:

### 1. Analyzes Previous Tax Return
```bash
POST /api/tax-organizer/extract
{
  "clientId": 1,
  "firmId": 2, 
  "priorYearReturn": "/uploads/smith_2023_return.pdf",
  "taxYear": 2024,
  "clientName": "John & Jane Smith",
  "filingStatus": "Married Filing Jointly"
}
```

**System automatically detects:**
- W-2 forms from ABC Company and XYZ Corp
- 1099-INT from First National Bank
- 1099-DIV from Vanguard Investments
- Schedule A itemized deductions
- Schedule C business income
- Mortgage interest from Wells Fargo

### 2. Generates Customized Tax Organizer

The system creates a personalized document checklist:

```markdown
# 2024 Tax Document Organizer
**Client:** John & Jane Smith
**Tax Year:** 2024
**Created:** January 15, 2025

## Document Collection Checklist

### INCOME DOCUMENTS

★ **W-2** (ABC Company)
   - Wage and Tax Statement
   - Instructions: Request from employer or payroll provider
   - Form: W-2

★ **W-2** (XYZ Corp)  
   - Wage and Tax Statement
   - Instructions: Request from employer or payroll provider
   - Form: W-2

★ **1099-INT** (First National Bank)
   - Interest Income
   - Instructions: Request from bank or financial institution
   - Form: 1099-INT

★ **1099-DIV** (Vanguard Investments)
   - Dividend Income
   - Instructions: Request from brokerage or investment company
   - Form: 1099-DIV

### DEDUCTION DOCUMENTS

★ **Mortgage Interest Statement** (Wells Fargo)
   - Mortgage interest paid
   - Instructions: Request from mortgage lender
   - Form: 1098

○ **Medical Receipts**
   - Medical and dental expenses
   - Instructions: Collect receipts from healthcare providers
   - Form: Schedule A

○ **Charitable Donation Receipts**
   - Charitable contributions
   - Instructions: Collect acknowledgment letters from charities
   - Form: Schedule A

★ = Required | ○ = If Applicable
```

### 3. Tracks Document Collection

**Real-time progress monitoring:**
- Total Documents: 15
- Received: 3 (20%)
- Pending: W-2 (ABC Company), 1099-INT, Mortgage Interest Statement...

### 4. Client Benefits

**Immediate Value:**
- Receives specific vendor names (not generic "employer")
- Clear instructions for each document type
- Professional, customized organizer document
- Progress tracking visibility

**CPA Firm Benefits:**
- Eliminates manual organizer creation
- Reduces client follow-up calls
- Ensures complete document collection
- Professional client onboarding experience

## Integration with Your 787 Historical Engagements

The system enhances extraction with:
- **Document Patterns**: Based on 787 processed returns
- **Complexity Assessment**: Historical data predicts preparation time
- **Service Recommendations**: Additional services based on client profile
- **Risk Assessment**: Identifies potential compliance issues

## Competitive Advantage

**Unique Market Position:**
- Only CPA system with instant organizer generation from prior returns
- Vendor name extraction (not available in generic tax software)
- Historical intelligence from 787 engagements
- Seamless integration with QuickBooks live data

This transforms client onboarding from a manual, time-consuming process into an automated, professional experience that delivers immediate value.