import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { useState } from "react";

// Time periods for analytics
export type TimePeriod = "week" | "month" | "quarter" | "year";

// Filters for analytics data
export interface AnalyticsFilters {
  firmId?: number;
  startDate?: Date;
  endDate?: Date;
  period?: TimePeriod;
  serviceCategories?: string[];
  professionalRoles?: number[];
  clientCompanyIds?: number[];
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

/**
 * Hook to fetch staff utilization data
 */
export function useStaffUtilization(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['/api/analytics/staff-utilization', filters],
    queryFn: getQueryFn<StaffUtilizationData[]>({ on401: "throw" }),
  });
}

/**
 * Hook to fetch revenue forecast data
 */
export function useRevenueForecast(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['/api/analytics/revenue-forecast', filters],
    queryFn: getQueryFn<RevenueForecastData[]>({ on401: "throw" }),
  });
}

/**
 * Hook to fetch client profitability data
 */
export function useClientProfitability(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['/api/analytics/client-profitability', filters],
    queryFn: getQueryFn<ClientProfitabilityData[]>({ on401: "throw" }),
  });
}

/**
 * Hook to fetch service profitability data
 */
export function useServiceProfitability(filters: AnalyticsFilters = {}) {
  return useQuery({
    queryKey: ['/api/analytics/service-profitability', filters],
    queryFn: getQueryFn<ServiceProfitabilityData[]>({ on401: "throw" }),
  });
}

/**
 * Combined analytics hook that manages filters and provides all data sources
 */
export function useAnalyticsData() {
  const [filters, setFilters] = useState<AnalyticsFilters>({
    period: "month",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)) // Default to 3-month forecast
  });

  const staffUtilization = useStaffUtilization(filters);
  const revenueForecast = useRevenueForecast(filters);
  const clientProfitability = useClientProfitability(filters);
  const serviceProfitability = useServiceProfitability(filters);

  return {
    filters,
    setFilters,
    staffUtilization,
    revenueForecast,
    clientProfitability,
    serviceProfitability,
    isLoading: 
      staffUtilization.isLoading || 
      revenueForecast.isLoading || 
      clientProfitability.isLoading || 
      serviceProfitability.isLoading,
    isError: 
      staffUtilization.isError || 
      revenueForecast.isError || 
      clientProfitability.isError || 
      serviceProfitability.isError,
  };
}