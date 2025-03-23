import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useState } from "react";

// Time periods for analytics
export type TimePeriod = "week" | "month" | "quarter" | "year";

// ML Provider types
export type MLProviderName = "in-house" | "external" | undefined;

// Filters for analytics data
export interface AnalyticsFilters {
  firmId?: number;
  startDate?: Date;
  endDate?: Date;
  period?: TimePeriod;
  serviceCategories?: string[];
  professionalRoles?: number[];
  clientCompanyIds?: number[];
  mlProvider?: MLProviderName;
}

// Staff utilization data structure
export interface StaffUtilizationData {
  roleId: number;
  roleName: string;
  topTierHours: number;
  midTierHours: number;
  lowTierHours: number;
  topTierCapacity: number;
  midTierCapacity: number;
  lowTierCapacity: number;
  projectedRevenue: number;
}

// Revenue forecast data structure
export interface RevenueForecastData {
  period: string; // e.g., "Jan 2025"
  serviceCategory: string;
  projected: number;
  confirmed: number;
}

// Client profitability data
export interface ClientProfitabilityData {
  clientCompanyId: number;
  clientName: string;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
}

// Service profitability data
export interface ServiceProfitabilityData {
  serviceId: number;
  serviceName: string;
  category: string;
  revenue: number;
  cost: number;
  hours: number;
  effectiveRate: number;
  profitMargin: number;
}

// ML Provider info
export interface MLProviderInfo {
  name: string;
  capabilities: string[];
}

/**
 * Hook to fetch ML providers information
 */
export function useMLProviders() {
  return useQuery({
    queryKey: ['/api/ml-providers'],
    queryFn: getQueryFn<MLProviderInfo[]>({ on401: "throw" }),
  });
}

/**
 * Main hook to fetch ML insights data
 */
export function useMLInsights(filters: AnalyticsFilters = {}) {
  const queryParams = new URLSearchParams();
  
  if (filters.firmId) queryParams.append('firmId', filters.firmId.toString());
  if (filters.period) queryParams.append('period', filters.period);
  if (filters.mlProvider) queryParams.append('provider', filters.mlProvider);
  
  return useQuery({
    queryKey: ['/api/ml-insights', filters],
    queryFn: getQueryFn<any>({ on401: "throw" }),
    enabled: !!filters.firmId, // Only enable if firmId is provided
  });
}

/**
 * Transform ML insights data to staff utilization format
 */
function transformToStaffUtilization(mlInsights: any): StaffUtilizationData[] {
  if (!mlInsights || !mlInsights.workloadPredictions || !mlInsights.workloadPredictions.roleWorkloads) {
    return [];
  }
  
  return mlInsights.workloadPredictions.roleWorkloads.map((role: any) => {
    // Calculate hours distribution across tiers (70% top, 20% mid, 10% low as a simple distribution)
    const totalHours = role.projectedHours || 0;
    const topTierHours = Math.round(totalHours * 0.3);
    const midTierHours = Math.round(totalHours * 0.4);
    const lowTierHours = Math.round(totalHours * 0.3);
    
    // For capacities, use availableCapacity distributed across tiers
    const totalCapacity = role.availableCapacity || 0;
    const topTierCapacity = Math.round(totalCapacity * 0.3);
    const midTierCapacity = Math.round(totalCapacity * 0.4);
    const lowTierCapacity = Math.round(totalCapacity * 0.3);
    
    // Estimate projected revenue (simplified calculation)
    // In a real system, this would use actual rate information from the database
    const avgHourlyRate = 150; // Simplified average hourly rate
    const projectedRevenue = Math.round(totalHours * avgHourlyRate);
    
    return {
      roleId: role.roleId,
      roleName: role.roleName,
      topTierHours,
      midTierHours,
      lowTierHours,
      topTierCapacity,
      midTierCapacity,
      lowTierCapacity,
      projectedRevenue
    };
  });
}

/**
 * Transform ML insights data to revenue forecast format
 */
function transformToRevenueForecast(mlInsights: any): RevenueForecastData[] {
  if (!mlInsights || !mlInsights.revenueForecasts || !mlInsights.revenueForecasts.totalRevenueForecast) {
    return [];
  }
  
  return mlInsights.revenueForecasts.totalRevenueForecast.map((forecast: any) => ({
    period: forecast.period,
    serviceCategory: 'All Services', // Group all services by default since ML insights don't break down by category
    projected: forecast.projected,
    confirmed: forecast.confirmed
  }));
}

/**
 * Transform ML insights data to client profitability format
 */
function transformToClientProfitability(mlInsights: any): ClientProfitabilityData[] {
  if (!mlInsights || !mlInsights.profitabilityPredictions || !mlInsights.profitabilityPredictions.clientProfitability) {
    return [];
  }
  
  return mlInsights.profitabilityPredictions.clientProfitability.map((client: any) => ({
    clientCompanyId: client.clientId,
    clientName: client.name,
    revenue: client.revenue,
    cost: client.cost,
    profit: client.profit,
    profitMargin: client.profitMargin
  }));
}

/**
 * Transform ML insights data to service profitability format
 */
function transformToServiceProfitability(mlInsights: any): ServiceProfitabilityData[] {
  if (!mlInsights || !mlInsights.serviceEfficiencyInsights || !mlInsights.serviceEfficiencyInsights.serviceEfficiency) {
    return [];
  }
  
  return mlInsights.serviceEfficiencyInsights.serviceEfficiency.map((service: any) => {
    // Calculate effective rate from total revenue and hours
    const effectiveRate = service.totalHours > 0 ? Math.round(service.totalRevenue / service.totalHours) : 0;
    
    // Calculate cost (simplified - in ML data it might be derived differently)
    // Using profitability as a guide to estimate cost
    let cost;
    switch (service.profitability) {
      case 'high': cost = Math.round(service.totalRevenue * 0.4); break; // 60% profit margin
      case 'medium': cost = Math.round(service.totalRevenue * 0.6); break; // 40% profit margin
      case 'low': cost = Math.round(service.totalRevenue * 0.8); break; // 20% profit margin
      default: cost = Math.round(service.totalRevenue * 0.5); // Default 50% profit margin
    }
    
    return {
      serviceId: service.serviceId,
      serviceName: service.serviceName,
      category: service.category,
      revenue: service.totalRevenue,
      cost: cost,
      hours: service.totalHours,
      effectiveRate: effectiveRate,
      profitMargin: service.totalRevenue > 0 ? ((service.totalRevenue - cost) / service.totalRevenue) : 0
    };
  });
}

/**
 * Combined analytics hook that uses ML insights API
 */
export function useAnalyticsData() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    firmId: 1, // Default to firm ID 1
    period: "month",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // Default to 3-month forecast
    mlProvider: 'in-house' // Default to in-house provider
  });

  // Fetch ML providers
  const providersQuery = useMLProviders();
  
  // Fetch ML insights
  const mlInsightsQuery = useMLInsights(filters);
  
  // Transform data from ML insights
  let staffUtilization = {
    data: [] as StaffUtilizationData[],
    isLoading: mlInsightsQuery.isLoading,
    isError: mlInsightsQuery.isError
  };
  
  let revenueForecast = {
    data: [] as RevenueForecastData[],
    isLoading: mlInsightsQuery.isLoading,
    isError: mlInsightsQuery.isError
  };
  
  let clientProfitability = {
    data: [] as ClientProfitabilityData[],
    isLoading: mlInsightsQuery.isLoading,
    isError: mlInsightsQuery.isError
  };
  
  let serviceProfitability = {
    data: [] as ServiceProfitabilityData[],
    isLoading: mlInsightsQuery.isLoading,
    isError: mlInsightsQuery.isError
  };
  
  // If we have ML insights data, transform it into our chart data formats
  if (mlInsightsQuery.data) {
    staffUtilization.data = transformToStaffUtilization(mlInsightsQuery.data);
    revenueForecast.data = transformToRevenueForecast(mlInsightsQuery.data);
    clientProfitability.data = transformToClientProfitability(mlInsightsQuery.data);
    serviceProfitability.data = transformToServiceProfitability(mlInsightsQuery.data);
  }

  return {
    filters,
    setFilters,
    staffUtilization,
    revenueForecast,
    clientProfitability,
    serviceProfitability,
    mlProviders: providersQuery.data || [],
    isLoadingProviders: providersQuery.isLoading,
    mlInsightsData: mlInsightsQuery.data,
    isLoading: mlInsightsQuery.isLoading,
    isError: mlInsightsQuery.isError
  };
}