/**
 * External Data Aggregation Module
 * 
 * Handles aggregating data from external systems:
 * - Time entry systems (staff time/projects)
 * - CRM systems (client/contact lists)
 * - QuickBooks Online (QBO)
 * - Tax platforms (Canopy Tax, etc.)
 * - Project management systems
 * 
 * This enables standardized pricing, project estimates, and scheduling
 */

import { ServiceSyncManager } from './service-sync';

// External system configurations
interface ExternalDataSource {
  name: string;
  type: 'time_entry' | 'crm' | 'accounting' | 'tax_prep' | 'project_mgmt';
  url: string;
  apiKey?: string;
  enabled: boolean;
  syncInterval: number; // minutes
  dataFields: string[];
}

const externalDataSources: ExternalDataSource[] = [
  {
    name: "Time Entry System",
    type: "time_entry",
    url: process.env.TIME_ENTRY_URL || "https://time-tracking-api.example.com",
    apiKey: process.env.TIME_ENTRY_API_KEY,
    enabled: false, // Enable when API keys provided
    syncInterval: 30,
    dataFields: ['staff_id', 'project_id', 'hours', 'billing_rate', 'date', 'task_type']
  },
  {
    name: "CRM System",
    type: "crm",
    url: process.env.CRM_URL || "https://crm-api.example.com",
    apiKey: process.env.CRM_API_KEY,
    enabled: false,
    syncInterval: 60,
    dataFields: ['client_id', 'company_name', 'contact_info', 'industry', 'annual_revenue', 'status']
  },
  {
    name: "QuickBooks Online",
    type: "accounting",
    url: process.env.QBO_URL || "https://sandbox-quickbooks.api.intuit.com",
    apiKey: process.env.QBO_ACCESS_TOKEN,
    enabled: false,
    syncInterval: 120,
    dataFields: ['company_id', 'revenue', 'expenses', 'chart_of_accounts', 'transactions']
  },
  {
    name: "Canopy Tax Platform",
    type: "tax_prep",
    url: process.env.CANOPY_URL || "https://api.canopytax.com",
    apiKey: process.env.CANOPY_API_KEY,
    enabled: false,
    syncInterval: 240,
    dataFields: ['client_id', 'return_type', 'complexity_score', 'prep_time', 'review_time']
  }
];

// Staff role definitions based on your proposal template
interface StaffRole {
  code: string;
  title: string;
  level: number;
  hourlyRate: number;
  capabilities: string[];
}

const staffRoles: StaffRole[] = [
  {
    code: 'acct-bookkeeper-1',
    title: 'Bookkeeper Level 1',
    level: 1,
    hourlyRate: 35,
    capabilities: ['basic_bookkeeping', 'data_entry', 'reconciliation']
  },
  {
    code: 'acct-bookkeeper-2',
    title: 'Bookkeeper Level 2',
    level: 2,
    hourlyRate: 45,
    capabilities: ['advanced_bookkeeping', 'financial_statements', 'payroll']
  },
  {
    code: 'tax-preparer-1',
    title: 'Tax Preparer Level 1',
    level: 1,
    hourlyRate: 50,
    capabilities: ['individual_tax', 'simple_business_tax', 'basic_planning']
  },
  {
    code: 'tax-preparer-2',
    title: 'Tax Preparer Level 2', 
    level: 2,
    hourlyRate: 75,
    capabilities: ['complex_tax', 'multi_state', 'advanced_planning', 'representation']
  },
  {
    code: 'cpa-senior',
    title: 'Senior CPA',
    level: 3,
    hourlyRate: 125,
    capabilities: ['all_services', 'client_advisory', 'complex_planning', 'audit']
  }
];

// Service estimation models based on your proposal template
interface ServiceEstimate {
  serviceId: string;
  serviceName: string;
  category: string;
  staffRequirements: {
    roleCode: string;
    hoursLow: number;
    hoursHigh: number;
    recurrencePerYear: number;
  }[];
  complexityFactors: string[];
  basePrice: number;
  priceRange: {
    low: number;
    high: number;
  };
}

const serviceEstimates: ServiceEstimate[] = [
  {
    serviceId: 'monthly-bookkeeping',
    serviceName: 'Monthly Bookkeeping',
    category: 'accounting',
    staffRequirements: [
      {
        roleCode: 'acct-bookkeeper-2',
        hoursLow: 8,
        hoursHigh: 16,
        recurrencePerYear: 12
      },
      {
        roleCode: 'cpa-senior',
        hoursLow: 2,
        hoursHigh: 4,
        recurrencePerYear: 4 // quarterly review
      }
    ],
    complexityFactors: ['transaction_volume', 'account_count', 'reconciliation_complexity'],
    basePrice: 1500,
    priceRange: { low: 800, high: 2500 }
  },
  {
    serviceId: 'individual-tax-prep',
    serviceName: 'Individual Tax Preparation',
    category: 'tax',
    staffRequirements: [
      {
        roleCode: 'tax-preparer-1',
        hoursLow: 3,
        hoursHigh: 8,
        recurrencePerYear: 1
      }
    ],
    complexityFactors: ['form_complexity', 'state_count', 'schedule_count', 'business_income'],
    basePrice: 450,
    priceRange: { low: 250, high: 800 }
  },
  {
    serviceId: 'business-tax-prep',
    serviceName: 'Business Tax Preparation',
    category: 'tax',
    staffRequirements: [
      {
        roleCode: 'tax-preparer-2',
        hoursLow: 6,
        hoursHigh: 20,
        recurrencePerYear: 1
      },
      {
        roleCode: 'cpa-senior',
        hoursLow: 2,
        hoursHigh: 6,
        recurrencePerYear: 1
      }
    ],
    complexityFactors: ['entity_type', 'revenue_size', 'multi_state', 'international'],
    basePrice: 1800,
    priceRange: { low: 1200, high: 4000 }
  }
];

export class ExternalDataAggregator {
  private serviceSyncManager: ServiceSyncManager;

  constructor() {
    this.serviceSyncManager = new ServiceSyncManager();
  }

  /**
   * Aggregate time entry data from external systems
   */
  async aggregateTimeEntryData(firmId: number, dateRange?: { start: Date; end: Date }): Promise<any> {
    const timeSource = externalDataSources.find(s => s.type === 'time_entry');
    
    if (!timeSource?.enabled) {
      return {
        source: 'mock_data',
        message: 'Time entry system not connected - showing sample data',
        data: this.getMockTimeEntryData(firmId)
      };
    }

    try {
      // In production, this would fetch from actual time tracking API
      const response = await fetch(`${timeSource.url}/api/time-entries`, {
        headers: {
          'Authorization': `Bearer ${timeSource.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Time entry API error: ${response.status}`);
      }

      const timeData = await response.json();
      return this.processTimeEntryData(timeData);
    } catch (error) {
      console.error('Error aggregating time entry data:', error);
      return {
        source: 'error_fallback',
        error: error.message,
        data: this.getMockTimeEntryData(firmId)
      };
    }
  }

  /**
   * Generate project estimates based on aggregated data
   */
  async generateProjectEstimate(
    serviceId: string, 
    clientComplexity: any, 
    historicalData?: any
  ): Promise<any> {
    const serviceTemplate = serviceEstimates.find(s => s.serviceId === serviceId);
    
    if (!serviceTemplate) {
      throw new Error(`Service template not found: ${serviceId}`);
    }

    // Calculate estimated hours and cost based on complexity
    const estimate = {
      serviceId,
      serviceName: serviceTemplate.serviceName,
      category: serviceTemplate.category,
      staffBreakdown: serviceTemplate.staffRequirements.map(req => {
        const role = staffRoles.find(r => r.code === req.roleCode);
        const complexityMultiplier = this.calculateComplexityMultiplier(
          clientComplexity, 
          serviceTemplate.complexityFactors
        );
        
        const adjustedHoursLow = Math.ceil(req.hoursLow * complexityMultiplier);
        const adjustedHoursHigh = Math.ceil(req.hoursHigh * complexityMultiplier);
        
        return {
          role: role?.title || req.roleCode,
          roleCode: req.roleCode,
          hourlyRate: role?.hourlyRate || 50,
          hoursLow: adjustedHoursLow,
          hoursHigh: adjustedHoursHigh,
          recurrencePerYear: req.recurrencePerYear,
          annualCostLow: adjustedHoursLow * (role?.hourlyRate || 50) * req.recurrencePerYear,
          annualCostHigh: adjustedHoursHigh * (role?.hourlyRate || 50) * req.recurrencePerYear
        };
      }),
      complexityFactors: clientComplexity,
      totalEstimate: {
        hoursLow: 0,
        hoursHigh: 0,
        costLow: 0,
        costHigh: 0,
        recurringAnnual: true
      }
    };

    // Calculate totals
    estimate.totalEstimate.hoursLow = estimate.staffBreakdown.reduce((sum, staff) => 
      sum + (staff.hoursLow * staff.recurrencePerYear), 0);
    estimate.totalEstimate.hoursHigh = estimate.staffBreakdown.reduce((sum, staff) => 
      sum + (staff.hoursHigh * staff.recurrencePerYear), 0);
    estimate.totalEstimate.costLow = estimate.staffBreakdown.reduce((sum, staff) => 
      sum + staff.annualCostLow, 0);
    estimate.totalEstimate.costHigh = estimate.staffBreakdown.reduce((sum, staff) => 
      sum + staff.annualCostHigh, 0);

    return estimate;
  }

  /**
   * Calculate complexity multiplier based on client factors
   */
  private calculateComplexityMultiplier(clientComplexity: any, factors: string[]): number {
    let multiplier = 1.0;
    
    // Base complexity adjustments
    if (clientComplexity.transactionVolume > 1000) multiplier += 0.3;
    if (clientComplexity.multiState === true) multiplier += 0.4;
    if (clientComplexity.internationalOperations === true) multiplier += 0.5;
    if (clientComplexity.entityType === 'partnership') multiplier += 0.2;
    if (clientComplexity.entityType === 'corporation') multiplier += 0.3;
    
    // Industry-specific adjustments
    if (['construction', 'restaurant', 'nonprofit'].includes(clientComplexity.industry)) {
      multiplier += 0.2;
    }
    
    return Math.min(multiplier, 2.5); // Cap at 2.5x base estimate
  }

  /**
   * Mock time entry data for demonstration
   */
  private getMockTimeEntryData(firmId: number) {
    return [
      {
        id: 1,
        staffId: 'staff-001',
        staffName: 'Sarah Johnson',
        roleCode: 'acct-bookkeeper-2',
        projectId: 'proj-abc-001',
        clientName: 'ABC Manufacturing',
        taskType: 'monthly_bookkeeping',
        hoursLogged: 12.5,
        billingRate: 45,
        date: '2025-01-15',
        status: 'billable'
      },
      {
        id: 2,
        staffId: 'staff-002', 
        staffName: 'Mike Chen',
        roleCode: 'tax-preparer-1',
        projectId: 'proj-xyz-002',
        clientName: 'XYZ Services LLC',
        taskType: 'individual_tax_prep',
        hoursLogged: 6.0,
        billingRate: 50,
        date: '2025-01-16',
        status: 'billable'
      }
    ];
  }

  /**
   * Process raw time entry data into standardized format
   */
  private processTimeEntryData(rawData: any): any {
    return {
      totalHours: rawData.reduce((sum: number, entry: any) => sum + entry.hours, 0),
      totalBillable: rawData.filter((entry: any) => entry.billable).length,
      byStaffRole: this.groupByStaffRole(rawData),
      byTaskType: this.groupByTaskType(rawData),
      recentProjects: rawData.slice(0, 10)
    };
  }

  private groupByStaffRole(data: any[]): any {
    return data.reduce((acc, entry) => {
      const role = entry.roleCode || 'unknown';
      if (!acc[role]) {
        acc[role] = { totalHours: 0, entries: [] };
      }
      acc[role].totalHours += entry.hours;
      acc[role].entries.push(entry);
      return acc;
    }, {});
  }

  private groupByTaskType(data: any[]): any {
    return data.reduce((acc, entry) => {
      const taskType = entry.taskType || 'unknown';
      if (!acc[taskType]) {
        acc[taskType] = { totalHours: 0, entries: [] };
      }
      acc[taskType].totalHours += entry.hours;
      acc[taskType].entries.push(entry);
      return acc;
    }, {});
  }

  /**
   * Get standardized pricing for all services
   */
  async getStandardizedPricing(firmId: number): Promise<any> {
    return {
      firmId,
      staffRoles,
      serviceEstimates,
      lastUpdated: new Date().toISOString(),
      pricingModel: 'role_based_hourly_with_complexity_factors'
    };
  }

  /**
   * Sync aggregated data to external platforms
   */
  async syncAggregatedData(firmId: number): Promise<any> {
    const timeData = await this.aggregateTimeEntryData(firmId);
    const pricingData = await this.getStandardizedPricing(firmId);
    
    // Sync to external platforms via ServiceSyncManager
    const syncResults = await this.serviceSyncManager.syncToAllPlatforms(firmId);
    
    return {
      timeDataSync: timeData,
      pricingDataSync: pricingData,
      externalSyncResults: syncResults,
      timestamp: new Date().toISOString()
    };
  }
}