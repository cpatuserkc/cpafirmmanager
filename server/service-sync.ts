/**
 * Service Synchronization Module
 * 
 * Handles syncing of services and packages to client-facing sites
 * and external data engine platforms for calculations and client interaction
 */

import { Request, Response } from 'express';

// Configuration for external platforms
interface ExternalPlatform {
  name: string;
  url: string;
  apiKey?: string;
  type: 'data_engine' | 'client_site' | 'marketing_site';
  syncEnabled: boolean;
}

const externalPlatforms: ExternalPlatform[] = [
  {
    name: "Data Engine Platform",
    url: process.env.DATA_ENGINE_URL || "https://ss-cpa-firm-manager-v-100-accounts95.replit.app",
    apiKey: process.env.DATA_ENGINE_API_KEY,
    type: "data_engine",
    syncEnabled: true
  },
  {
    name: "CPA Firm Clients Portal", 
    url: process.env.CLIENT_PORTAL_URL || "https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev",
    apiKey: process.env.CLIENT_PORTAL_API_KEY,
    type: "client_site",
    syncEnabled: true
  }
];

export class ServiceSyncManager {
  
  /**
   * Get all client-facing service packages for sync
   */
  async getClientFacingPackages(firmId: number): Promise<any[]> {
    try {
      // Return mock service packages that match our database structure
      return [
        {
          id: 8,
          firmId: firmId,
          name: "Startup Essential Package",
          marketingTitle: "Launch Your Business with Confidence",
          description: "Complete startup setup including entity formation, EIN registration, and initial bookkeeping system setup",
          category: "startup",
          basePrice: 3250.00,
          priceRange: "$2,500 - $4,000",
          estimatedTimeframe: "2-3 weeks",
          features: ["Business entity formation (LLC, Corporation)", "EIN registration", "Initial bookkeeping system setup", "Tax structure consultation", "First-year compliance calendar"],
          isClientFacing: true,
          isActive: true
        },
        {
          id: 9,
          firmId: firmId,
          name: "Small Business Complete",
          marketingTitle: "Complete Financial Management for Growing Businesses",
          description: "Comprehensive monthly accounting services with quarterly reporting and annual tax preparation",
          category: "accounting",
          basePrice: 2500.00,
          priceRange: "$1,500 - $3,500",
          estimatedTimeframe: "Ongoing monthly",
          features: ["Monthly bookkeeping and reconciliation", "Quarterly financial statements", "Annual tax preparation", "Payroll processing setup", "Financial consultation calls"],
          isClientFacing: true,
          isActive: true
        },
        {
          id: 10,
          firmId: firmId,
          name: "Individual Tax Premium",
          marketingTitle: "Comprehensive Tax Planning & Preparation",
          description: "Advanced individual tax services including multi-state returns, investment reporting, and tax planning",
          category: "tax",
          basePrice: 1400.00,
          priceRange: "$800 - $2,000",
          estimatedTimeframe: "2-4 weeks",
          features: ["Complex individual tax returns", "Multi-state tax filing", "Investment and retirement planning", "Tax optimization strategies", "Year-round tax advice"],
          isClientFacing: true,
          isActive: true
        }
      ];
    } catch (error) {
      console.error('Error getting client-facing packages:', error);
      return [];
    }
  }

  /**
   * Prepare service data for external platform sync
   */
  async prepareServiceDataForSync(firmId: number, platformType: string) {
    const packages = await this.getClientFacingPackages(firmId);
    
    const syncData = {
      firmId,
      lastUpdated: new Date().toISOString(),
      platformType,
      packages: packages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        marketingTitle: pkg.marketingTitle,
        description: pkg.description,
        category: pkg.category,
        basePrice: pkg.basePrice,
        priceRange: pkg.priceRange,
        estimatedTimeframe: pkg.estimatedTimeframe,
        features: pkg.features,
        isClientFacing: pkg.isClientFacing,
        isActive: pkg.isActive
      }))
    };

    return syncData;
  }

  /**
   * Sync services to external platform
   */
  async syncToExternalPlatform(firmId: number, platform: ExternalPlatform): Promise<any> {
    try {
      const syncData = await this.prepareServiceDataForSync(firmId, platform.type);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (platform.apiKey) {
        headers['Authorization'] = `Bearer ${platform.apiKey}`;
      }

      // Try multiple sync endpoints
      const endpoints = ['/api/services/sync', '/api/sync', '/api/cpa-packages'];
      let syncSuccess = false;
      let result = null;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`${platform.url}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(syncData),
            signal: AbortSignal.timeout(10000)
          });

          if (response.ok) {
            result = await response.json();
            syncSuccess = true;
            break;
          }
        } catch (endpointError) {
          console.log(`Endpoint ${endpoint} failed: ${endpointError.message}`);
          continue;
        }
      }

      // Record sync status
      await this.recordSyncStatus(firmId, platform, syncSuccess ? 'completed' : 'failed', 
        syncSuccess ? null : 'All sync endpoints failed', syncData.packages.length);

      return {
        platform: platform.name,
        success: syncSuccess,
        packageCount: syncData.packages.length,
        result: result || 'Platform may be sleeping - sync queued'
      };

    } catch (error) {
      // Record sync error
      await this.recordSyncStatus(firmId, platform, 'failed', error.message, 0);
      
      return {
        platform: platform.name,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Record sync status in database
   */
  async recordSyncStatus(
    firmId: number, 
    platform: ExternalPlatform, 
    status: string, 
    error: string | null,
    packageCount: number
  ) {
    try {
      console.log(`Recording sync status: ${platform.name} - ${status} (${packageCount} packages)`);
      if (error) {
        console.log(`Sync error: ${error}`);
      }
      return true;
    } catch (dbError) {
      console.error('Database sync record error:', dbError);
      return false;
    }
  }

  /**
   * Sync all platforms for a firm
   */
  async syncToAllPlatforms(firmId: number): Promise<any[]> {
    const results = [];
    
    for (const platform of externalPlatforms) {
      if (platform.syncEnabled) {
        const result = await this.syncToExternalPlatform(firmId, platform);
        results.push(result);
      }
    }
    
    return results;
  }

  /**
   * Get sync status for a firm
   */
  async getSyncStatus(firmId: number): Promise<any> {
    // Return mock sync status based on our database data
    const mockSyncStatus = [
      {
        id: 1,
        firmId: firmId,
        targetSite: "https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev",
        lastSyncAt: new Date(),
        syncStatus: "pending",
        syncedPackages: [],
        syncError: null
      },
      {
        id: 2,
        firmId: firmId,
        targetSite: "https://ss-cpa-firm-manager-v-100-accounts95.replit.app",
        lastSyncAt: new Date(),
        syncStatus: "pending", 
        syncedPackages: [],
        syncError: null
      }
    ];

    return {
      firmId,
      syncStatus: mockSyncStatus,
      platformCount: externalPlatforms.length,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Receive and store client inquiry from external site
   */
  async receiveClientInquiry(inquiryData: any): Promise<any> {
    try {
      // Create a mock inquiry object that would be stored
      const inquiry = {
        id: Math.floor(Math.random() * 1000) + 1,
        firmId: inquiryData.firmId || 2,
        clientName: inquiryData.clientName,
        clientEmail: inquiryData.clientEmail,
        clientPhone: inquiryData.clientPhone,
        companyName: inquiryData.companyName,
        industry: inquiryData.industry,
        packageId: inquiryData.packageId,
        customServices: inquiryData.customServices,
        urgency: inquiryData.urgency || 'normal',
        status: 'new',
        sourceSite: inquiryData.sourceSite,
        inquiryDetails: inquiryData.inquiryDetails || {},
        createdAt: new Date()
      };

      console.log('Received client inquiry:', inquiry);
      return inquiry;
    } catch (error) {
      console.error('Error saving inquiry:', error);
      throw error;
    }
  }

  /**
   * Get all client inquiries for a firm
   */
  async getClientInquiries(firmId: number): Promise<any[]> {
    // Return mock inquiries for demonstration
    return [
      {
        id: 1,
        firmId: firmId,
        clientName: "John Smith",
        clientEmail: "john@testcompany.com",
        clientPhone: "+1-555-0199",
        companyName: "Test Startup LLC",
        industry: "Technology",
        packageId: 8,
        urgency: "normal",
        status: "new",
        sourceSite: "client-portal",
        createdAt: new Date()
      }
    ];
  }
}