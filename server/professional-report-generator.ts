/**
 * Professional Client Report Generator
 * Creates client-ready tax organizer reports and CSV checklists
 */

interface ClientInfo {
  clientName: string;
  address: string;
  taxYear: number;
  filingStatus: string;
  dependents: Array<{
    name: string;
    relationship: string;
    ssn?: string;
  }>;
  occupations?: {
    primary?: string;
    spouse?: string;
  };
}

interface PriorYearData {
  totalIncome: number;
  wages: number;
  capitalGains?: number;
  dividends?: number;
  itemizedDeductions?: number;
  totalTax?: number;
  complexity: 'basic' | 'intermediate' | 'advanced' | 'complex';
  formsDetected: string[];
}

interface DocumentRequirement {
  documentType: string;
  required: boolean;
  category: 'income' | 'deduction' | 'information' | 'family' | 'education' | 'medical';
  description: string;
  instructions: string;
  notes?: string;
  priorYearReference?: string;
}

class ProfessionalReportGenerator {
  
  /**
   * Generate a professional client-ready tax organizer report
   */
  generateProfessionalReport(
    clientInfo: ClientInfo,
    priorYearData: PriorYearData,
    firmInfo: {
      name: string;
      phone?: string;
      email?: string;
      assignedProfessional?: string;
    }
  ): string {
    
    const currentDate = new Date().toLocaleDateString();
    const dueDate = `April 15, ${clientInfo.taxYear + 1}`;
    
    const report = `# ${clientInfo.taxYear} Tax Document Collection Organizer

**Prepared For:** ${clientInfo.clientName}  
**Address:** ${clientInfo.address}  
**Tax Year:** ${clientInfo.taxYear} (Due ${dueDate})  
**Prepared By:** ${firmInfo.name}  
**Date:** ${currentDate}

---

## Executive Summary

Based on our analysis of your ${clientInfo.taxYear - 1} tax return, we have prepared this customized document collection checklist for your ${clientInfo.taxYear} tax preparation. Your return complexity is classified as **${priorYearData.complexity.charAt(0).toUpperCase() + priorYearData.complexity.slice(1)}** due to ${this.getComplexityReasons(priorYearData)}.

### Key Information from ${clientInfo.taxYear - 1} Return:
- **Filing Status:** ${clientInfo.filingStatus}
- **Total Income:** $${priorYearData.totalIncome.toLocaleString()}
- **Dependents:** ${clientInfo.dependents.length} ${clientInfo.dependents.length === 1 ? 'child' : 'children'} (${clientInfo.dependents.map(d => d.name).join(' and ')})
- **Notable Items:** ${this.getNotableItems(priorYearData)}

---

## Required Documents Checklist

Please gather the following documents for your ${clientInfo.taxYear} tax preparation. Items marked with ★ are required, while items marked with ○ apply only if relevant to your situation.

${this.generateDocumentSections(priorYearData, clientInfo)}

---

## Important Reminders

### Timeline Recommendations:
- **By February 15:** Collect all 1099 forms and W-2s
- **By March 15:** Gather deduction documentation
- **By March 31:** Schedule tax preparation appointment
- **${dueDate}:** Federal tax return due date

${this.generateSpecialConsiderations(priorYearData, clientInfo)}

---

## Contact Information

If you have questions about any of these documents or need clarification on what to collect, please contact our office:

**${firmInfo.name}**  
${firmInfo.phone ? `Phone: ${firmInfo.phone}` : ''}  
${firmInfo.email ? `Email: ${firmInfo.email}` : ''}

${firmInfo.assignedProfessional ? `**Assigned Tax Professional:** ${firmInfo.assignedProfessional}` : ''}

---

## Next Steps

1. Use the attached CSV checklist to track your document collection progress
2. Contact us immediately if any expected documents are missing or unavailable
3. Schedule your tax preparation appointment once you have gathered 90% of required documents
4. Bring all documents to your appointment in organized folders

We appreciate your business and look forward to preparing your ${clientInfo.taxYear} tax return efficiently and accurately.

---

*This organizer is based on analysis of your ${clientInfo.taxYear - 1} tax return and general tax law. Your specific situation may require additional documentation not listed here. Please contact us with any questions.*`;

    return report;
  }

  /**
   * Generate CSV checklist for client tracking
   */
  generateCSVChecklist(
    clientInfo: ClientInfo,
    priorYearData: PriorYearData,
    documents: DocumentRequirement[]
  ): string {
    
    const headers = [
      'Document Type',
      'Required',
      'Category',
      'Description',
      'Instructions',
      'Status',
      'Date Received',
      'Notes'
    ];

    const rows = [headers.join(',')];
    
    documents.forEach(doc => {
      const row = [
        `"${doc.documentType}"`,
        doc.required ? 'Required' : 'If Applicable',
        doc.category,
        `"${doc.description}"`,
        `"${doc.instructions}"`,
        'Pending',
        '',
        `"${doc.notes || doc.priorYearReference || ''}"`
      ];
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  /**
   * Generate comprehensive document requirements based on prior year analysis
   */
  generateDocumentRequirements(
    priorYearData: PriorYearData,
    clientInfo: ClientInfo
  ): DocumentRequirement[] {
    
    const documents: DocumentRequirement[] = [];

    // Income documents based on forms detected
    if (priorYearData.formsDetected.includes('W-2') || priorYearData.wages > 0) {
      documents.push({
        documentType: 'Form W-2 - Primary Taxpayer',
        required: true,
        category: 'income',
        description: 'Wage and Tax Statement',
        instructions: 'Obtain from all employers',
        priorYearReference: `Wages: $${priorYearData.wages.toLocaleString()} in ${clientInfo.taxYear - 1}`
      });

      if (clientInfo.filingStatus.includes('Married')) {
        documents.push({
          documentType: 'Form W-2 - Spouse',
          required: true,
          category: 'income',
          description: 'Spouse Wage and Tax Statement',
          instructions: 'Obtain from all spouse employers'
        });
      }
    }

    if (priorYearData.dividends && priorYearData.dividends > 0) {
      documents.push({
        documentType: 'Form 1099-DIV',
        required: true,
        category: 'income',
        description: 'Dividend Income Statements',
        instructions: 'Collect from all investment accounts',
        priorYearReference: `Had $${priorYearData.dividends.toLocaleString()} in dividends in ${clientInfo.taxYear - 1}`
      });
    }

    if (priorYearData.capitalGains && priorYearData.capitalGains > 0) {
      documents.push({
        documentType: 'Form 1099-B',
        required: true,
        category: 'income',
        description: 'Broker Transaction Statements',
        instructions: 'From all brokerage accounts for stock sales',
        priorYearReference: `Had $${priorYearData.capitalGains.toLocaleString()} in capital gains in ${clientInfo.taxYear - 1}`
      });
    }

    // Add interest income if typical for this income level
    if (priorYearData.totalIncome > 100000) {
      documents.push({
        documentType: 'Form 1099-INT',
        required: true,
        category: 'income',
        description: 'Interest Income',
        instructions: 'From all banks and financial institutions'
      });
    }

    // Deduction documents if itemized previously
    if (priorYearData.itemizedDeductions && priorYearData.itemizedDeductions > 0) {
      documents.push(
        {
          documentType: 'Form 1098',
          required: true,
          category: 'deduction',
          description: 'Mortgage Interest Statement',
          instructions: 'From mortgage lender',
          priorYearReference: `Used itemized deductions ($${priorYearData.itemizedDeductions.toLocaleString()}) in ${clientInfo.taxYear - 1}`
        },
        {
          documentType: 'Property Tax Records',
          required: true,
          category: 'deduction',
          description: 'Property Tax Payments',
          instructions: 'From county tax assessor or mortgage servicer'
        },
        {
          documentType: 'Charitable Donation Records',
          required: false,
          category: 'deduction',
          description: 'Charitable Contributions',
          instructions: 'Written acknowledgments required for donations over $250'
        }
      );
    }

    // Family documents
    documents.push({
      documentType: 'Social Security Cards',
      required: true,
      category: 'information',
      description: 'SSN verification for all family members',
      instructions: `Copies for ${clientInfo.clientName.split('&').map(n => n.trim()).join(', ')}${clientInfo.dependents.length > 0 ? ', and ' + clientInfo.dependents.map(d => d.name).join(', ') : ''}`
    });

    // Professional considerations for high earners
    if (clientInfo.occupations?.primary?.toLowerCase().includes('doctor') || 
        clientInfo.occupations?.primary?.toLowerCase().includes('surgeon') ||
        clientInfo.occupations?.spouse?.toLowerCase().includes('doctor')) {
      documents.push({
        documentType: 'Professional Development Expenses',
        required: false,
        category: 'deduction',
        description: 'Continuing education and professional expenses',
        instructions: 'Medical conferences, licensing fees, and memberships'
      });
    }

    // High-income specific documents
    if (priorYearData.totalIncome > 500000) {
      documents.push({
        documentType: 'Estimated Tax Payments',
        required: false,
        category: 'information',
        description: 'Quarterly estimated tax payments',
        instructions: 'Records of any estimated payments made during the year'
      });
    }

    // Standard documents
    documents.push(
      {
        documentType: 'Bank Account Information',
        required: true,
        category: 'information',
        description: 'Direct deposit information',
        instructions: 'Routing and account numbers for refund or payment'
      },
      {
        documentType: 'Photo Identification',
        required: true,
        category: 'information',
        description: 'Government-issued ID',
        instructions: 'Valid driver\'s license or state ID for electronic filing'
      }
    );

    return documents;
  }

  private getComplexityReasons(priorYearData: PriorYearData): string {
    const reasons = [];
    
    if (priorYearData.totalIncome > 500000) reasons.push('high income levels');
    if (priorYearData.capitalGains && priorYearData.capitalGains > 0) reasons.push('investment activity');
    if (priorYearData.itemizedDeductions && priorYearData.itemizedDeductions > 0) reasons.push('itemized deductions');
    if (priorYearData.formsDetected.includes('Schedule C')) reasons.push('business income');
    if (priorYearData.formsDetected.includes('Schedule E')) reasons.push('rental income');
    
    return reasons.join(', ') || 'multiple income sources and deductions';
  }

  private getNotableItems(priorYearData: PriorYearData): string {
    const items = [];
    
    if (priorYearData.capitalGains && priorYearData.capitalGains > 0) {
      items.push(`capital gains ($${priorYearData.capitalGains.toLocaleString()})`);
    }
    if (priorYearData.dividends && priorYearData.dividends > 0) {
      items.push(`dividend income ($${priorYearData.dividends.toLocaleString()})`);
    }
    if (priorYearData.itemizedDeductions && priorYearData.itemizedDeductions > 0) {
      items.push(`itemized deductions ($${priorYearData.itemizedDeductions.toLocaleString()})`);
    }
    
    return items.join(', ') || 'standard income and deductions';
  }

  private generateDocumentSections(priorYearData: PriorYearData, clientInfo: ClientInfo): string {
    const documents = this.generateDocumentRequirements(priorYearData, clientInfo);
    
    const sections = {
      income: documents.filter(d => d.category === 'income'),
      deduction: documents.filter(d => d.category === 'deduction'),
      information: documents.filter(d => d.category === 'information'),
      family: documents.filter(d => d.category === 'family'),
      education: documents.filter(d => d.category === 'education'),
      medical: documents.filter(d => d.category === 'medical')
    };

    let output = '';
    
    if (sections.income.length > 0) {
      output += '\n### Income Documentation\n\n';
      sections.income.forEach(doc => {
        const symbol = doc.required ? '★' : '○';
        output += `${symbol} **${doc.documentType}**\n`;
        output += `- ${doc.description}\n`;
        output += `- ${doc.instructions}\n`;
        if (doc.priorYearReference) {
          output += `- **Prior Year Note:** ${doc.priorYearReference}\n`;
        }
        output += '\n';
      });
    }

    if (sections.deduction.length > 0) {
      output += '### Deduction Documentation\n\n';
      sections.deduction.forEach(doc => {
        const symbol = doc.required ? '★' : '○';
        output += `${symbol} **${doc.documentType}**\n`;
        output += `- ${doc.description}\n`;
        output += `- ${doc.instructions}\n`;
        if (doc.priorYearReference) {
          output += `- **Prior Year Note:** ${doc.priorYearReference}\n`;
        }
        output += '\n';
      });
    }

    if (sections.information.length > 0) {
      output += '### Additional Documentation\n\n';
      sections.information.forEach(doc => {
        const symbol = doc.required ? '★' : '○';
        output += `${symbol} **${doc.documentType}**\n`;
        output += `- ${doc.description}\n`;
        output += `- ${doc.instructions}\n`;
        output += '\n';
      });
    }

    return output;
  }

  private generateSpecialConsiderations(priorYearData: PriorYearData, clientInfo: ClientInfo): string {
    let considerations = '';

    if (priorYearData.totalIncome > 500000) {
      considerations += `### Special Considerations for High-Income Earners:
1. **Estimated Tax Payments:** Consider quarterly payments for ${clientInfo.taxYear + 1} to avoid penalties
2. **Alternative Minimum Tax (AMT):** May apply given your income level
3. **Net Investment Income Tax:** 3.8% tax may apply to investment income
4. **State Tax Planning:** Consider tax implications if you have income in multiple states

`;
    }

    if (clientInfo.occupations?.primary?.toLowerCase().includes('doctor') || 
        clientInfo.occupations?.primary?.toLowerCase().includes('surgeon')) {
      considerations += `### Professional Practice Considerations:
- **Medical Malpractice Insurance:** Premiums may be deductible
- **Professional Equipment:** Consider Section 179 depreciation for large purchases
- **Retirement Plans:** Maximize contributions to 401(k), profit-sharing, or defined benefit plans

`;
    }

    return considerations;
  }
}

export { ProfessionalReportGenerator, ClientInfo, PriorYearData, DocumentRequirement };