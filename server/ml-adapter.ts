/**
 * ML Insights Adapter Pattern
 * 
 * This module provides a flexible adapter pattern for ML insights.
 * It allows swapping between different ML implementations (in-house, external APIs, etc.)
 * without changing the interface used by the rest of the application.
 */

import type { 
  Project, 
  Proposal, 
  TimeEstimate, 
  Service, 
  ProfessionalRole, 
  ClientCompany
} from "@shared/schema";

// ML Insights Request - Common parameter interface for all providers
export interface MLInsightsRequest {
  projects: Project[];
  proposals: Proposal[];
  timeEstimates: TimeEstimate[];
  services: Service[];
  professionalRoles: ProfessionalRole[];
  clientCompanies: ClientCompany[];
  period?: string;
  firmId?: number;
  userId?: number;
}

// ML Insights Response Interfaces
export interface ResourceUtilizationInsight {
  roleId: number;
  roleName: string;
  currentHours: number;
  projectedHours: number;
  availableCapacity: number;
  utilizationRate: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface RevenueInsight {
  period: string;
  confirmed: number;
  projected: number;
  total: number;
}

export interface ClientInsight {
  clientId: number;
  clientName: string;
  totalHours: number;
  totalRevenue: number;
  averageRate: number;
  profitability: 'low' | 'medium' | 'high';
  growthPotential: 'low' | 'medium' | 'high';
  engagementScore: number;
  retentionRisk: 'low' | 'medium' | 'high';
}

export interface ServiceInsight {
  serviceId: number;
  serviceName: string;
  category: string;
  totalHours: number;
  totalRevenue: number;
  averageRate: number;
  efficiencyScore: number;
  profitability: 'low' | 'medium' | 'high';
}

export interface SeasonalInsight {
  period: string;
  workload: number;
  factor: number;
}

export interface StaffingInsight {
  roleId: number;
  roleName: string;
  tier: string;
  hoursNeeded: number;
  currentCapacity: number;
  shortfall: number;
  hiringNeeded: number;
}

export interface AnomalyInsight {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  impact: string | number;
  recommendation: string;
}

export interface ProfitabilityInsight {
  clientId?: number;
  projectId?: number;
  name: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  trend?: 'improving' | 'stable' | 'declining';
}

// Complete ML Insights Response
export interface MLInsightsResponse {
  workloadPredictions: {
    roleWorkloads: ResourceUtilizationInsight[];
    overallUtilization: number;
    resourceConstraints: {
      roleId: number;
      roleName: string;
      shortageAmount: number;
      impactLevel: string;
    }[];
  };
  revenueForecasts: {
    totalRevenueForecast: RevenueInsight[];
    forecastAccuracy: number;
    anomalies: any[];
  };
  clientInsights: {
    clientInsights: ClientInsight[];
    topClients: ClientInsight[];
    atRiskClients: ClientInsight[];
    growthOpportunities: ClientInsight[];
  };
  serviceEfficiencyInsights: {
    serviceEfficiency: ServiceInsight[];
    mostEfficientServices: ServiceInsight[];
    leastEfficientServices: ServiceInsight[];
    improvementOpportunities: {
      serviceId: number;
      serviceName: string;
      currentEfficiency: number;
      potentialImprovement: number;
      revenueImpact: number;
    }[];
  };
  seasonalPatterns: {
    seasonalWorkload: SeasonalInsight[];
    peakPeriods: string[];
    slowPeriods: string[];
    seasonalityScore: number;
    recommendations: string[];
  };
  staffingRecommendations: {
    staffingNeeds: StaffingInsight[];
    hiringRecommendations: {
      roleId: number;
      roleName: string;
      tier: string;
      hiringNeeded: number;
      urgency: string;
      impact: string;
    }[];
    excessCapacityRoles: {
      roleId: number;
      roleName: string;
      tier: string;
      excessCapacity: number;
      utilization: string;
    }[];
    resourceShiftOpportunities: {
      fromRole: string;
      toRole: string;
      potentialHours: number;
      costSavings: string;
    }[];
  };
  abnormalPatterns: {
    anomalies: AnomalyInsight[];
    riskScore: string;
    recommendations: string[];
  };
  profitabilityPredictions: {
    clientProfitability: ProfitabilityInsight[];
    projectProfitability: ProfitabilityInsight[];
    mostProfitableClients: ProfitabilityInsight[];
    leastProfitableClients: ProfitabilityInsight[];
    overallProfitability: {
      current: number;
      trending: 'up' | 'down' | 'stable';
    };
    profitabilityRecommendations: string[];
  };
}

// ML Provider Interface - All ML providers must implement this interface
export interface MLProvider {
  generateInsights(request: MLInsightsRequest): Promise<MLInsightsResponse>;
  getName(): string;
  getCapabilities(): string[];
}

// Registry of available ML providers
const mlProviders: Record<string, MLProvider> = {};

// Register a new ML provider
export function registerMLProvider(provider: MLProvider): void {
  mlProviders[provider.getName()] = provider;
}

// Get a specific ML provider by name
export function getMLProvider(name: string): MLProvider {
  if (!mlProviders[name]) {
    throw new Error(`ML provider '${name}' not found`);
  }
  return mlProviders[name];
}

// Get the default ML provider
export function getDefaultMLProvider(): MLProvider {
  // Return the in-house provider by default
  return mlProviders['in-house'] || Object.values(mlProviders)[0];
}

// Get all available ML providers
export function getAllMLProviders(): Record<string, MLProvider> {
  return { ...mlProviders };
}

// Generate insights using the default provider
export async function generateInsights(request: MLInsightsRequest): Promise<MLInsightsResponse> {
  const provider = getDefaultMLProvider();
  return provider.generateInsights(request);
}

// Export data for external ML processing
export async function exportDataForExternalML(request: MLInsightsRequest, format: string = 'json'): Promise<string> {
  // In a real implementation, this would transform the data into the specified format
  // For now, we just return a JSON string
  return JSON.stringify(request);
}

// Import insights from external ML processing
export async function importInsightsFromExternalML(data: string): Promise<MLInsightsResponse> {
  // In a real implementation, this would parse the data from the external ML service
  // For now, we just parse the JSON string
  try {
    return JSON.parse(data) as MLInsightsResponse;
  } catch (error) {
    throw new Error('Failed to parse external ML insights');
  }
}