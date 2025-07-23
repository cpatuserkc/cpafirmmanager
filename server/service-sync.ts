/**
 * Service Synchronization Module
 * 
 * Handles syncing of services and packages to client-facing sites
 * and external data engine platforms for calculations and client interaction
 */

import { Request, Response } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import { db } from './db';
import {
  services,
  servicePackages,
  packageServices,
  clientServiceInquiries,
  serviceNetworkSync,
  type Service,
  type ServicePackage,
  type ClientServiceInquiry,
  type ServiceNetworkSync,
  type InsertServiceNetworkSync,
  type InsertClientServiceInquiry
} from '@shared/schema';

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
    url: process.env.DATA_ENGINE_URL || "https://data-engine-dev.example.com",
    apiKey: process.env.DATA_ENGINE_API_KEY,
    type: "data_engine",
    syncEnabled: true
  },
  {
    name: "Client Portal Site", 
    url: process.env.CLIENT_PORTAL_URL || "https://cpafirmclients-dev.example.com",
    apiKey: process.env.CLIENT_PORTAL_API_KEY,
    type: "client_site",
    syncEnabled: true
  }
];

export class ServiceSyncManager {
  
  /**
   * Get all client-facing service packages for sync
   */
  async getClientFacingPackages(firmId: number): Promise<ServicePackage[]> {
    const packages = await db
      .select()
      .from(servicePackages)
      .where(
        and(
          eq(servicePackages.firmId, firmId),
          eq(servicePackages.isClientFacing, true),
          eq(servicePackages.isActive, true)
        )
      )
      .orderBy(servicePackages.displayOrder);

    return packages;
  }

  /**
   * Get services for a package with detailed information
   */
  async getPackageServicesDetails(packageId: number): Promise<any[]> {
    const packageServicesData = await db
      .select({
        service: services,
        packageService: packageServices
      })
      .from(packageServices)
      .innerJoin(services, eq(services.id, packageServices.serviceId))
      .where(eq(packageServices.packageId, packageId))
      .orderBy(packageServices.sortOrder);

    return packageServicesData.map(ps => ({
      ...ps.service,
      isRequired: ps.packageService.isRequired,
      estimatedHours: ps.packageService.estimatedHours,
      sortOrder: ps.packageService.sortOrder
    }));
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
      packages: []
    };

    for (const pkg of packages) {
      const packageServices = await this.getPackageServicesDetails(pkg.id);
      
      const packageData = {
        id: pkg.id,
        name: pkg.name,
        marketingTitle: pkg.marketingTitle,
        marketingDescription: pkg.marketingDescription,
        category: pkg.category,
        basePrice: pkg.basePrice,
        priceRange: pkg.priceRange,
        estimatedTimeframe: pkg.estimatedTimeframe,
        isPopular: pkg.isPopular,
        features: pkg.features,
        requirements: pkg.requirements,
        deliverables: pkg.deliverables,
        services: packageServices.map(service => ({
          id: service.id,
          name: service.name,
          description: service.description,
          category: service.category,
          estimatedHours: service.estimatedHours,
          isRequired: service.isRequired,
          jurisdictionFederal: service.jurisdictionFederal,
          jurisdictionState: service.jurisdictionState
        }))
      };

      syncData.packages.push(packageData);
    }

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

      const response = await fetch(`${platform.url}/api/services/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify(syncData)
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      // Record sync status
      await this.recordSyncStatus(firmId, platform, 'completed', null, syncData.packages.length);

      return {
        platform: platform.name,
        success: true,
        packageCount: syncData.packages.length,
        result
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
    const syncRecord: InsertServiceNetworkSync = {
      firmId,
      targetSite: platform.url,
      syncStatus: status,
      syncedPackages: packageCount > 0 ? Array.from({length: packageCount}, (_, i) => i + 1) : [],
      syncError: error,
      lastSyncAt: new Date()
    };

    // Check if sync record exists
    const existingSync = await db
      .select()
      .from(serviceNetworkSync)
      .where(
        and(
          eq(serviceNetworkSync.firmId, firmId),
          eq(serviceNetworkSync.targetSite, platform.url)
        )
      )
      .limit(1);

    if (existingSync.length > 0) {
      // Update existing record
      await db
        .update(serviceNetworkSync)
        .set(syncRecord)
        .where(eq(serviceNetworkSync.id, existingSync[0].id));
    } else {
      // Insert new record
      await db.insert(serviceNetworkSync).values(syncRecord);
    }
  }

  /**
   * Sync all platforms for a firm
   */
  async syncAllPlatforms(firmId: number): Promise<any[]> {
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
  async getSyncStatus(firmId: number): Promise<ServiceNetworkSync[]> {
    return await db
      .select()
      .from(serviceNetworkSync)
      .where(eq(serviceNetworkSync.firmId, firmId))
      .orderBy(desc(serviceNetworkSync.lastSyncAt));
  }

  /**
   * Process incoming client inquiry from external site
   */
  async processClientInquiry(inquiryData: any): Promise<ClientServiceInquiry> {
    const inquiry: InsertClientServiceInquiry = {
      firmId: inquiryData.firmId,
      packageId: inquiryData.packageId,
      serviceIds: inquiryData.serviceIds,
      clientName: inquiryData.clientName,
      clientEmail: inquiryData.clientEmail,
      clientPhone: inquiryData.clientPhone,
      companyName: inquiryData.companyName,
      industry: inquiryData.industry,
      businessType: inquiryData.businessType,
      annualRevenue: inquiryData.annualRevenue,
      numberOfEmployees: inquiryData.numberOfEmployees,
      urgency: inquiryData.urgency || 'normal',
      preferredStartDate: inquiryData.preferredStartDate ? new Date(inquiryData.preferredStartDate) : null,
      budget: inquiryData.budget,
      additionalDetails: inquiryData.additionalDetails,
      requirements: inquiryData.requirements,
      source: inquiryData.source || 'website',
      status: 'new'
    };

    const [newInquiry] = await db.insert(clientServiceInquiries).values(inquiry).returning();
    return newInquiry;
  }

  /**
   * Get client inquiries for a firm
   */
  async getClientInquiries(firmId: number, status?: string): Promise<ClientServiceInquiry[]> {
    let query = db
      .select()
      .from(clientServiceInquiries)
      .where(eq(clientServiceInquiries.firmId, firmId));

    if (status) {
      query = query.where(
        and(
          eq(clientServiceInquiries.firmId, firmId),
          eq(clientServiceInquiries.status, status)
        )
      );
    }

    return await query.orderBy(desc(clientServiceInquiries.createdAt));
  }
}

// Export singleton instance
export const serviceSyncManager = new ServiceSyncManager();

// Express route handlers
export const serviceRoutes = {

  // Get client-facing packages for sync
  async getPackagesForSync(req: Request, res: Response) {
    try {
      const firmId = parseInt(req.params.firmId);
      const packages = await serviceSyncManager.getClientFacingPackages(firmId);
      
      res.json({
        success: true,
        packages,
        count: packages.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Trigger sync to all external platforms
  async syncToAllPlatforms(req: Request, res: Response) {
    try {
      const firmId = parseInt(req.params.firmId);
      const results = await serviceSyncManager.syncAllPlatforms(firmId);
      
      res.json({
        success: true,
        results,
        syncedPlatforms: results.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get sync status
  async getSyncStatus(req: Request, res: Response) {
    try {
      const firmId = parseInt(req.params.firmId);
      const status = await serviceSyncManager.getSyncStatus(firmId);
      
      res.json({
        success: true,
        syncStatus: status,
        platforms: externalPlatforms.map(p => ({
          name: p.name,
          type: p.type,
          syncEnabled: p.syncEnabled
        }))
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Receive client inquiry from external site
  async receiveClientInquiry(req: Request, res: Response) {
    try {
      const inquiry = await serviceSyncManager.processClientInquiry(req.body);
      
      res.json({
        success: true,
        inquiryId: inquiry.id,
        message: 'Inquiry received successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get client inquiries
  async getClientInquiries(req: Request, res: Response) {
    try {
      const firmId = parseInt(req.params.firmId);
      const status = req.query.status as string;
      const inquiries = await serviceSyncManager.getClientInquiries(firmId, status);
      
      res.json({
        success: true,
        inquiries,
        count: inquiries.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // Get service data formatted for external platform
  async getServiceDataForPlatform(req: Request, res: Response) {
    try {
      const firmId = parseInt(req.params.firmId);
      const platformType = req.params.platformType;
      
      const syncData = await serviceSyncManager.prepareServiceDataForSync(firmId, platformType);
      
      res.json({
        success: true,
        data: syncData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
};