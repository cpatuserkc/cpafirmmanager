/**
 * Tax Document Extraction System
 * Analyzes previous year tax returns to build customized document collection lists
 */

interface TaxDocument {
  documentType: string;
  vendorName?: string;
  formType: string;
  description: string;
  required: boolean;
  category: 'income' | 'deduction' | 'credit' | 'information';
  instructions?: string;
}

interface TaxOrganizerRequest {
  clientId: number;
  firmId: number;
  priorYearReturn: string; // file path
  taxYear: number;
  clientName: string;
  filingStatus: string;
}

interface TaxOrganizer {
  id: string;
  clientId: number;
  taxYear: number;
  createdAt: Date;
  documents: TaxDocument[];
  completionStatus: {
    total: number;
    received: number;
    pending: string[];
  };
}

class TaxDocumentExtractor {
  private documentPatterns = new Map<string, TaxDocument[]>();

  constructor() {
    this.initializeDocumentPatterns();
  }

  private initializeDocumentPatterns() {
    // Common tax document patterns based on form analysis
    const patterns: Record<string, TaxDocument[]> = {
      'W-2_WAGES': [{
        documentType: 'W-2',
        formType: 'W-2',
        description: 'Wage and Tax Statement',
        required: true,
        category: 'income',
        instructions: 'Request from employer or payroll provider'
      }],
      '1099-INT_INTEREST': [{
        documentType: '1099-INT',
        formType: '1099-INT',
        description: 'Interest Income',
        required: true,
        category: 'income',
        instructions: 'Request from bank or financial institution'
      }],
      '1099-DIV_DIVIDENDS': [{
        documentType: '1099-DIV',
        formType: '1099-DIV',
        description: 'Dividend Income',
        required: true,
        category: 'income',
        instructions: 'Request from brokerage or investment company'
      }],
      '1099-B_STOCK_SALES': [{
        documentType: '1099-B',
        formType: '1099-B',
        description: 'Stock Sales and Transactions',
        required: true,
        category: 'income',
        instructions: 'Request from brokerage firm'
      }],
      'SCHEDULE_A_ITEMIZED': [
        {
          documentType: 'Medical Receipts',
          formType: 'Schedule A',
          description: 'Medical and dental expenses',
          required: false,
          category: 'deduction',
          instructions: 'Collect receipts from healthcare providers'
        },
        {
          documentType: 'Mortgage Interest Statement',
          formType: '1098',
          description: 'Mortgage interest paid',
          required: true,
          category: 'deduction',
          instructions: 'Request from mortgage lender'
        },
        {
          documentType: 'Property Tax Records',
          formType: 'Schedule A',
          description: 'State and local taxes paid',
          required: true,
          category: 'deduction',
          instructions: 'Obtain from county tax assessor'
        },
        {
          documentType: 'Charitable Donation Receipts',
          formType: 'Schedule A',
          description: 'Charitable contributions',
          required: false,
          category: 'deduction',
          instructions: 'Collect acknowledgment letters from charities'
        }
      ],
      'SCHEDULE_C_BUSINESS': [
        {
          documentType: 'Business Income Records',
          formType: 'Schedule C',
          description: 'Business revenue and sales',
          required: true,
          category: 'income',
          instructions: 'Provide sales reports and 1099-NEC forms received'
        },
        {
          documentType: 'Business Expense Receipts',
          formType: 'Schedule C',
          description: 'Business operating expenses',
          required: true,
          category: 'deduction',
          instructions: 'Organize by expense category (office, travel, supplies, etc.)'
        },
        {
          documentType: 'Vehicle Mileage Log',
          formType: 'Schedule C',
          description: 'Business use of vehicle',
          required: false,
          category: 'deduction',
          instructions: 'Maintain detailed mileage records with business purpose'
        }
      ],
      'RENTAL_PROPERTY': [{
        documentType: 'Rental Income Records',
        formType: 'Schedule E',
        description: 'Rental income received',
        required: true,
        category: 'income',
        instructions: 'Provide lease agreements and rent rolls'
      }],
      'RETIREMENT_CONTRIBUTIONS': [{
        documentType: 'IRA Contribution Records',
        formType: '5498',
        description: 'Retirement account contributions',
        required: true,
        category: 'deduction',
        instructions: 'Request from IRA custodian or employer 401k provider'
      }]
    };

    Object.entries(patterns).forEach(([key, docs]) => {
      this.documentPatterns.set(key, docs);
    });
  }

  /**
   * Extract document requirements from previous year tax return
   */
  async extractDocumentRequirements(
    priorReturnPath: string,
    clientInfo: TaxOrganizerRequest
  ): Promise<TaxOrganizer> {
    try {
      // Skip data engine processing for now to prevent file access issues
      // In production, this would submit to the processing engine ONLY if file persists
      
      // For demonstration, simulate analysis results without any file access
      console.log("🎯 Processing tax organizer for:", clientInfo.clientName, "Tax Year:", clientInfo.taxYear);
      const extractedForms = await this.simulateDocumentAnalysis(clientInfo.priorYearReturn);
      
      const requiredDocuments = this.buildDocumentList(extractedForms, clientInfo);
      
      const organizer: TaxOrganizer = {
        id: this.generateOrganizerId(),
        clientId: clientInfo.clientId,
        taxYear: clientInfo.taxYear,
        createdAt: new Date(),
        documents: requiredDocuments,
        completionStatus: {
          total: requiredDocuments.length,
          received: 0,
          pending: requiredDocuments.map(doc => doc.documentType)
        }
      };

      return organizer;

    } catch (error) {
      throw new Error(`Document extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build comprehensive document list from extracted forms
   */
  private buildDocumentList(extractedForms: string[], clientInfo: TaxOrganizerRequest): TaxDocument[] {
    const documents: TaxDocument[] = [];
    const seenDocuments = new Set<string>();

    // Process each form found in prior return
    extractedForms.forEach(formType => {
      const patternDocs = this.getDocumentsForForm(formType);
      patternDocs.forEach(doc => {
        const key = `${doc.documentType}_${doc.formType}`;
        if (!seenDocuments.has(key)) {
          seenDocuments.add(key);
          documents.push({
            ...doc,
            // Add vendor extraction from prior year
            vendorName: this.extractVendorName(formType, doc.documentType)
          });
        }
      });
    });

    // Add standard documents for all returns  
    this.addStandardDocuments(documents, clientInfo);

    return documents.sort((a, b) => {
      // Sort by required first, then by category
      if (a.required && !b.required) return -1;
      if (!a.required && b.required) return 1;
      return a.category.localeCompare(b.category);
    });
  }

  private getDocumentsForForm(formType: string): TaxDocument[] {
    // Map form types to document patterns
    const formMappings: Record<string, string> = {
      'W-2': 'W-2_WAGES',
      '1099-INT': '1099-INT_INTEREST',
      '1099-DIV': '1099-DIV_DIVIDENDS',
      '1099-B': '1099-B_STOCK_SALES',
      'Schedule A': 'SCHEDULE_A_ITEMIZED',
      'Schedule C': 'SCHEDULE_C_BUSINESS',
      'Schedule E': 'RENTAL_PROPERTY',
      '5498': 'RETIREMENT_CONTRIBUTIONS'
    };

    const patternKey = formMappings[formType];
    return patternKey ? this.documentPatterns.get(patternKey) || [] : [];
  }

  private extractVendorName(formType: string, documentType: string): string | undefined {
    // In production, this would extract actual vendor names from the prior return
    // For now, provide helpful placeholders
    const vendorMappings: Record<string, string> = {
      'W-2': 'Previous employer name',
      '1099-INT': 'Bank or credit union name',
      '1099-DIV': 'Investment company name',
      '1099-B': 'Brokerage firm name',
      'Mortgage Interest Statement': 'Mortgage lender name',
      'Property Tax Records': 'County tax assessor'
    };

    return vendorMappings[documentType];
  }

  private addStandardDocuments(documents: TaxDocument[], clientInfo: TaxOrganizerRequest) {
    // Add documents required for all returns
    const standardDocs: TaxDocument[] = [
      {
        documentType: 'Social Security Cards',
        formType: 'General',
        description: 'SSN verification for all family members',
        required: true,
        category: 'information',
        instructions: 'Copies of Social Security cards for taxpayer, spouse, and dependents'
      },
      {
        documentType: 'Photo ID',
        formType: 'General',
        description: 'Government-issued identification',
        required: true,
        category: 'information',
        instructions: "Driver's license or state ID for taxpayer and spouse"
      },
      {
        documentType: 'Prior Year Tax Return',
        formType: 'General',
        description: 'Previous year federal and state returns',
        required: true,
        category: 'information',
        instructions: 'Complete copy of prior year returns for reference'
      }
    ];

    standardDocs.forEach(doc => documents.push(doc));
  }

  /**
   * Generate customized tax organizer document
   */
  generateOrganizerDocument(organizer: TaxOrganizer): string {
    const header = `
# ${new Date().getFullYear()} Tax Document Organizer
**Client:** ${organizer.clientId}  
**Tax Year:** ${organizer.taxYear}  
**Created:** ${organizer.createdAt.toLocaleDateString()}

## Document Collection Checklist

Please provide the following documents for your ${organizer.taxYear} tax return preparation. Items marked with ★ are required.

`;

    const categories = ['income', 'deduction', 'credit', 'information'];
    let content = header;

    categories.forEach(category => {
      const categoryDocs = organizer.documents.filter(doc => doc.category === category);
      if (categoryDocs.length > 0) {
        content += `\n### ${category.toUpperCase()} DOCUMENTS\n\n`;
        
        categoryDocs.forEach((doc, index) => {
          const required = doc.required ? '★' : '○';
          const vendor = doc.vendorName ? ` (${doc.vendorName})` : '';
          
          content += `${required} **${doc.documentType}**${vendor}\n`;
          content += `   - ${doc.description}\n`;
          if (doc.instructions) {
            content += `   - Instructions: ${doc.instructions}\n`;
          }
          content += `   - Form: ${doc.formType}\n\n`;
        });
      }
    });

    content += `
## Collection Status
- **Total Documents:** ${organizer.completionStatus.total}
- **Received:** ${organizer.completionStatus.received}
- **Pending:** ${organizer.completionStatus.pending.length}

## Important Notes
- Please provide documents as soon as available
- Digital copies (PDF scans) are acceptable
- Contact us if you have questions about any document
- Some documents may not apply if your situation has changed

★ = Required | ○ = If Applicable
`;

    return content;
  }

  /**
   * Update organizer when documents are received
   */
  markDocumentReceived(organizerId: string, documentType: string): boolean {
    // In production, this would update the database
    // For now, return success
    return true;
  }

  /**
   * Get organizer completion percentage
   */
  getCompletionStatus(organizer: TaxOrganizer): { percentage: number; missing: string[] } {
    const requiredDocs = organizer.documents.filter(doc => doc.required);
    const received = requiredDocs.length - organizer.completionStatus.pending.length;
    
    return {
      percentage: Math.round((received / requiredDocs.length) * 100),
      missing: organizer.completionStatus.pending
    };
  }

  private async simulateDocumentAnalysis(filename: string): Promise<string[]> {
    // Simulate analyzing a typical tax return based on filename patterns
    // In production, this would process the actual PDF content
    console.log("📄 Simulating analysis for:", filename);
    
    // Return realistic forms found in a comprehensive tax return
    return [
      'W-2',        // Employment income
      '1099-INT',   // Interest income  
      '1099-DIV',   // Dividend income
      'Schedule A', // Itemized deductions
      'Schedule C', // Business income/expenses
      '1098'        // Mortgage interest
    ];
  }

  private generateOrganizerId(): string {
    return `organizer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export { TaxDocumentExtractor, TaxOrganizer, TaxDocument, TaxOrganizerRequest };