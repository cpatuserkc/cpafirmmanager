import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterBar } from "@/components/analytics/FilterBar";
import { StaffUtilizationChart } from "@/components/analytics/StaffUtilizationChart";
import { RevenueForecastChart } from "@/components/analytics/RevenueForecastChart";
import { ClientProfitabilityChart } from "@/components/analytics/ClientProfitabilityChart";
import { ServiceProfitabilityChart } from "@/components/analytics/ServiceProfitabilityChart";
import { ProfessionalRolesManager } from "@/components/professional-roles/ProfessionalRolesManager";
import { useAnalyticsData, AnalyticsFilters, MLProviderName } from "@/hooks/use-analytics-data";
import { ArrowDown, ArrowUp, DollarSign, Users, Briefcase, CalendarClock, Brain } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AnalyticsPage() {
  const { 
    filters, 
    setFilters,
    staffUtilization,
    revenueForecast,
    clientProfitability,
    serviceProfitability,
    mlProviders,
    mlInsightsData,
    isLoading,
    isLoadingProviders
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

  const handleProviderChange = (providerName: string) => {
    setFilters({
      ...filters,
      mlProvider: providerName as MLProviderName
    });
  };

  // Get summary metrics
  const dataSource = clientProfitability?.data?.length > 0 
    ? clientProfitability.data 
    : placeholderData.clientProfitability;
  
  const totalRevenue = dataSource.reduce((sum, client) => sum + client.revenue, 0);
  const totalProfit = dataSource.reduce((sum, client) => sum + client.profit, 0);
  const avgProfitMargin = totalProfit / totalRevenue;
  
  // Get utilization data
  const utilizationData = staffUtilization?.data?.length > 0 
    ? staffUtilization.data 
    : placeholderData.staffUtilization;
  
  const totalHours = utilizationData.reduce(
    (sum, role) => sum + role.topTierHours + role.midTierHours + role.lowTierHours, 
    0
  );
  
  const utilization = utilizationData.reduce(
    (sum, role) => 
      sum + 
      (role.topTierHours / (role.topTierCapacity || 1)) + 
      (role.midTierHours / (role.midTierCapacity || 1)) + 
      (role.lowTierHours / (role.lowTierCapacity || 1)),
    0
  ) / (utilizationData.length * 3) * 100; // Average across all roles and tiers

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-500">Monitor your firm's performance and optimize resource allocation</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Brain className="h-5 w-5 mr-2 text-primary" />
            <span className="text-sm mr-2">ML Provider:</span>
          </div>
          
          <Select
            value={filters.mlProvider || 'in-house'}
            onValueChange={handleProviderChange}
            disabled={isLoadingProviders}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              {mlProviders.map(provider => (
                <SelectItem key={provider.name} value={provider.name}>
                  {provider.name === 'in-house' ? 'In-house ML' : 'External ML'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <TabsList className="grid w-full sm:w-auto sm:inline-grid grid-cols-4 max-w-2xl">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="professional-roles">Professional Roles</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="insights">ML Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <StaffUtilizationChart 
              data={staffUtilization?.data?.length ? staffUtilization.data : placeholderData.staffUtilization} 
              isLoading={isLoading} 
            />
            <RevenueForecastChart 
              data={revenueForecast?.data?.length ? revenueForecast.data : placeholderData.revenueForecast} 
              isLoading={isLoading} 
            />
            <ClientProfitabilityChart 
              data={clientProfitability?.data?.length ? clientProfitability.data : placeholderData.clientProfitability} 
              isLoading={isLoading} 
            />
            <ServiceProfitabilityChart 
              data={serviceProfitability?.data?.length ? serviceProfitability.data : placeholderData.serviceProfitability} 
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
                ML-powered forecasts are generated using historical data and industry patterns.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <RevenueForecastChart 
                  data={revenueForecast?.data?.length ? revenueForecast.data : placeholderData.revenueForecast} 
                  isLoading={isLoading} 
                />
                <StaffUtilizationChart 
                  data={staffUtilization?.data?.length ? staffUtilization.data : placeholderData.staffUtilization} 
                  isLoading={isLoading} 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="insights" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-primary" />
                ML Insights
                {filters.mlProvider && (
                  <Badge variant="outline" className="ml-2">
                    {filters.mlProvider === 'in-house' ? 'In-house ML' : 'External ML'}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Advanced machine learning insights to optimize your business
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="spinner h-8 w-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <p>Loading ML insights...</p>
                </div>
              ) : mlInsightsData ? (
                <div className="space-y-6">
                  {/* Resource Constraints */}
                  {mlInsightsData.workloadPredictions?.resourceConstraints?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Resource Constraints</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <ul className="space-y-2">
                          {mlInsightsData.workloadPredictions.resourceConstraints.map((constraint: any, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-red-500 mr-2">⚠</span>
                              <span>{constraint.roleName} is overallocated by {constraint.shortageAmount.toFixed(0)} hours (high impact)</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Client Insights */}
                  {mlInsightsData.clientInsights?.topClients?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Top Clients</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2">Client</th>
                              <th className="text-right py-2">Revenue</th>
                              <th className="text-right py-2">Profit Margin</th>
                              <th className="text-right py-2">Growth</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mlInsightsData.clientInsights.topClients.slice(0, 5).map((client: any, idx: number) => (
                              <tr key={idx} className="border-b">
                                <td className="py-2">{client.clientName}</td>
                                <td className="text-right py-2">${client.totalRevenue.toLocaleString()}</td>
                                <td className="text-right py-2">{(client.profitability === 'high' ? '35-45%' : client.profitability === 'medium' ? '25-35%' : '15-25%')}</td>
                                <td className="text-right py-2">
                                  <span className={client.growthPotential === 'high' ? 'text-green-500' : client.growthPotential === 'medium' ? 'text-yellow-500' : 'text-red-500'}>
                                    {client.growthPotential === 'high' ? 'High' : client.growthPotential === 'medium' ? 'Medium' : 'Low'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  {/* At-Risk Clients */}
                  {mlInsightsData.clientInsights?.atRiskClients?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Retention Risk Clients</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <ul className="space-y-2">
                          {mlInsightsData.clientInsights.atRiskClients.slice(0, 3).map((client: any, idx: number) => (
                            <li key={idx} className="flex items-start">
                              <span className="text-red-500 mr-2">⚠</span>
                              <span>{client.clientName} - {client.retentionRisk} risk, engagement score: {client.engagementScore}/100</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Improvement Opportunities */}
                  {mlInsightsData.serviceEfficiencyInsights?.improvementOpportunities?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Service Improvement Opportunities</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <ul className="space-y-2">
                          {mlInsightsData.serviceEfficiencyInsights.improvementOpportunities.slice(0, 3).map((opp: any, idx: number) => (
                            <li key={idx}>
                              <span className="font-medium">{opp.serviceName}</span>: 
                              <span className="ml-1">Current efficiency: {opp.currentEfficiency.toFixed(0)}% - </span>
                              <span className="text-green-500">Potential improvement: {opp.potentialImprovement.toFixed(0)}%</span>
                              <span className="ml-1 text-sm text-muted-foreground">(Revenue impact: ${opp.revenueImpact.toLocaleString()})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Seasonal Recommendations */}
                  {mlInsightsData.seasonalPatterns?.recommendations?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Seasonal Planning Recommendations</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <ul className="space-y-2 list-disc list-inside">
                          {mlInsightsData.seasonalPatterns.recommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                        <div className="mt-2 text-sm">
                          <span className="font-medium">Peak periods: </span>
                          <span>{mlInsightsData.seasonalPatterns.peakPeriods.join(', ')}</span>
                        </div>
                        <div className="mt-1 text-sm">
                          <span className="font-medium">Slow periods: </span>
                          <span>{mlInsightsData.seasonalPatterns.slowPeriods.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Anomalies */}
                  {mlInsightsData.abnormalPatterns?.anomalies?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Detected Anomalies</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <ul className="space-y-3">
                          {mlInsightsData.abnormalPatterns.anomalies.slice(0, 3).map((anomaly: any, idx: number) => (
                            <li key={idx} className="border-l-2 border-red-500 pl-3">
                              <div className="font-medium">{anomaly.description}</div>
                              <div className="text-sm">
                                <span className="font-medium">Severity: </span>
                                <span className={anomaly.severity === 'high' ? 'text-red-500' : anomaly.severity === 'medium' ? 'text-amber-500' : 'text-yellow-500'}>
                                  {anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)}
                                </span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Impact: </span>
                                <span>{anomaly.impact}</span>
                              </div>
                              <div className="text-sm">
                                <span className="font-medium">Recommendation: </span>
                                <span>{anomaly.recommendation}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                  
                  {/* Profitability Recommendations */}
                  {mlInsightsData.profitabilityPredictions?.profitabilityRecommendations?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-2">Profitability Recommendations</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        <ul className="space-y-2 list-disc list-inside">
                          {mlInsightsData.profitabilityPredictions.profitabilityRecommendations.map((rec: string, idx: number) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                        <div className="mt-3 text-sm">
                          <span className="font-medium">Overall profitability trend: </span>
                          <span className={mlInsightsData.profitabilityPredictions.overallProfitability.trending === 'up' ? 'text-green-500' : mlInsightsData.profitabilityPredictions.overallProfitability.trending === 'down' ? 'text-red-500' : 'text-amber-500'}>
                            {mlInsightsData.profitabilityPredictions.overallProfitability.trending === 'up' ? 'Improving' : mlInsightsData.profitabilityPredictions.overallProfitability.trending === 'down' ? 'Declining' : 'Stable'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Provider Info */}
                  <div className="border-t pt-4 mt-6 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">ML Provider: </span>
                      <span>{filters.mlProvider || 'in-house'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Capabilities: </span>
                      <span>
                        {mlProviders.find(p => p.name === filters.mlProvider)?.capabilities.slice(0, 3).join(', ')}... 
                        and {mlProviders.find(p => p.name === filters.mlProvider)?.capabilities.length - 3} more
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No ML insights available. Try changing the filters or ML provider.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}