import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/analytics/FilterBar";
import { StaffUtilizationChart } from "@/components/analytics/StaffUtilizationChart";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import { ClientProfitabilityChart } from "@/components/analytics/ClientProfitabilityChart";
import { ServiceProfitabilityChart } from "@/components/analytics/ServiceProfitabilityChart";
import { ProfessionalRolesManager } from "@/components/professional-roles/ProfessionalRolesManager";
import { useAnalyticsData, AnalyticsFilters } from "@/hooks/use-analytics-data";
import { ArrowDown, ArrowUp, DollarSign, Users, Briefcase, CalendarClock } from "lucide-react";

export default function AnalyticsPage() {
  const { 
    filters, 
    setFilters,
    staffUtilization,
    revenueForecast,
    clientProfitability,
    serviceProfitability,
    isLoading
  } = useAnalyticsData();
  
  // Empty state placeholders for initial loading
  const placeholderData = {
    staffUtilization: [
      { 
        roleId: 1, 
        roleName: "Tax Specialist", 
        topTierHours: 120, 
        midTierHours: 240, 
        lowTierHours: 350, 
        topTierCapacity: 160, 
        midTierCapacity: 320, 
        lowTierCapacity: 480,
        projectedRevenue: 75000
      },
      { 
        roleId: 2, 
        roleName: "Accountant", 
        topTierHours: 80, 
        midTierHours: 180, 
        lowTierHours: 280, 
        topTierCapacity: 120, 
        midTierCapacity: 240, 
        lowTierCapacity: 360,
        projectedRevenue: 52000
      },
      { 
        roleId: 3, 
        roleName: "Auditor", 
        topTierHours: 60, 
        midTierHours: 140, 
        lowTierHours: 220, 
        topTierCapacity: 80, 
        midTierCapacity: 160, 
        lowTierCapacity: 320,
        projectedRevenue: 48000
      }
    ],
    revenueForecast: [
      { period: "Jan 2025", serviceCategory: "Tax", projected: 25000, confirmed: 15000 },
      { period: "Feb 2025", serviceCategory: "Tax", projected: 35000, confirmed: 10000 },
      { period: "Mar 2025", serviceCategory: "Tax", projected: 45000, confirmed: 5000 },
      { period: "Apr 2025", serviceCategory: "Tax", projected: 30000, confirmed: 2000 }
    ],
    clientProfitability: [
      { clientCompanyId: 1, clientName: "ABC Corp", revenue: 45000, cost: 22500, profit: 22500, profitMargin: 0.5 },
      { clientCompanyId: 2, clientName: "XYZ Inc", revenue: 32000, cost: 19200, profit: 12800, profitMargin: 0.4 },
      { clientCompanyId: 3, clientName: "123 LLC", revenue: 28000, cost: 11200, profit: 16800, profitMargin: 0.6 },
      { clientCompanyId: 4, clientName: "Acme Co", revenue: 38000, cost: 30400, profit: 7600, profitMargin: 0.2 }
    ],
    serviceProfitability: [
      { serviceId: 1, serviceName: "Tax Return - Individual", category: "Tax", revenue: 35000, cost: 17500, hours: 350, effectiveRate: 100, profitMargin: 0.5 },
      { serviceId: 2, serviceName: "Tax Return - Business", category: "Tax", revenue: 42000, cost: 16800, hours: 280, effectiveRate: 150, profitMargin: 0.6 },
      { serviceId: 3, serviceName: "Bookkeeping", category: "Accounting", revenue: 28000, cost: 19600, hours: 490, effectiveRate: 57, profitMargin: 0.3 },
      { serviceId: 4, serviceName: "Advisory", category: "Consulting", revenue: 22000, cost: 11000, hours: 110, effectiveRate: 200, profitMargin: 0.5 }
    ]
  };

  const handleFilterChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters);
  };

  // Summary metrics for current period
  const totalRevenue = placeholderData.clientProfitability.reduce((sum, client) => sum + client.revenue, 0);
  const totalProfit = placeholderData.clientProfitability.reduce((sum, client) => sum + client.profit, 0);
  const avgProfitMargin = totalProfit / totalRevenue;
  const totalHours = placeholderData.staffUtilization.reduce(
    (sum, role) => sum + role.topTierHours + role.midTierHours + role.lowTierHours, 
    0
  );
  const utilization = placeholderData.staffUtilization.reduce(
    (sum, role) => 
      sum + 
      (role.topTierHours / (role.topTierCapacity || 1)) + 
      (role.midTierHours / (role.midTierCapacity || 1)) + 
      (role.lowTierHours / (role.lowTierCapacity || 1)),
    0
  ) / (placeholderData.staffUtilization.length * 3) * 100; // Average across all roles and tiers

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Monitor your firm's performance and optimize resource allocation</p>
        </div>
      </div>

      <FilterBar 
        filters={filters} 
        onFilterChange={handleFilterChange} 
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+20.1% from last period</p>
            <div className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>14.2% YOY</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(avgProfitMargin * 100).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Target: 45%</p>
            <div className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+3.2% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Target: 80%</p>
            <div className="text-xs text-red-500 flex items-center mt-1">
              <ArrowDown className="h-3 w-3 mr-1" />
              <span>-4.3% from last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{(totalHours / 160).toFixed(1)} FTE</p>
            <div className="text-xs text-green-500 flex items-center mt-1">
              <ArrowUp className="h-3 w-3 mr-1" />
              <span>+8.7% from last period</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="professional-roles">Professional Roles</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <StaffUtilizationChart 
              data={isLoading ? [] : staffUtilization?.data || placeholderData.staffUtilization} 
              isLoading={isLoading} 
            />
            <RevenueForecastChart 
              data={isLoading ? [] : revenueForecast?.data || placeholderData.revenueForecast} 
              isLoading={isLoading} 
            />
            <ClientProfitabilityChart 
              data={isLoading ? [] : clientProfitability?.data || placeholderData.clientProfitability} 
              isLoading={isLoading} 
            />
            <ServiceProfitabilityChart 
              data={isLoading ? [] : serviceProfitability?.data || placeholderData.serviceProfitability} 
              isLoading={isLoading} 
            />
          </div>
        </TabsContent>

        <TabsContent value="professional-roles" className="mt-4">
          <ProfessionalRolesManager />
        </TabsContent>
        
        <TabsContent value="forecasting" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Forecasting</CardTitle>
              <CardDescription>
                Plan your firm's growth with our advanced forecasting tools
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Our forecasting tools help you predict future revenue, resource needs, and growth opportunities. 
                This section will be expanded with more detailed forecasting capabilities in future updates.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <RevenueForecastChart 
                  data={isLoading ? [] : revenueForecast?.data || placeholderData.revenueForecast} 
                  isLoading={isLoading} 
                />
                <StaffUtilizationChart 
                  data={isLoading ? [] : staffUtilization?.data || placeholderData.staffUtilization} 
                  isLoading={isLoading} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}