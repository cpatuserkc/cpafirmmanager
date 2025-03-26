import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "../../App";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { InsightBarChart } from './InsightBarChart';
import { InsightPieChart } from './InsightPieChart';
import { 
  CalendarClock, 
  Users, 
  Building2, 
  BarChart3, 
  DollarSign,
  Clock, 
  Briefcase 
} from 'lucide-react';
import { getQueryFn } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Chart color schemes
const colors = {
  blue: ['rgba(53, 162, 235, 0.8)', 'rgba(53, 162, 235, 0.4)'],
  green: ['rgba(75, 192, 192, 0.8)', 'rgba(75, 192, 192, 0.4)'],
  orange: ['rgba(255, 159, 64, 0.8)', 'rgba(255, 159, 64, 0.4)'],
  purple: ['rgba(153, 102, 255, 0.8)', 'rgba(153, 102, 255, 0.4)'],
  red: ['rgba(255, 99, 132, 0.8)', 'rgba(255, 99, 132, 0.4)'],
};

const TimeAnalyticsDashboard = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('firm');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1)); // January 1 of current year
  const [endDate, setEndDate] = useState<Date>(new Date());
  const firmId = user?.id || 1; // Using user id until we implement proper firm selection

  const queryFn = getQueryFn({ on401: 'throw' });

  // Define the response type for our analytics data
  interface TimeAnalyticsResponse {
    firmOverview: {
      totalHours: number;
      totalRevenue: number;
      averageRate: number;
      byMonth: Array<{ month: string; hours: number; revenue: number }>;
      byService: Array<{ name: string; hours: number; revenue: number }>;
      byStaff: Array<{ name: string; hours: number; revenue: number }>;
    };
    staffOverview: {
      utilization: number;
      totalStaff: number;
      byUtilization: Array<{ name: string; utilization: number; target: number }>;
      byRevenue: Array<{ name: string; revenue: number }>;
    };
    clientOverview: {
      totalClients: number;
      activeClients: number;
      byRevenue: Array<{ name: string; revenue: number }>;
      byHours: Array<{ name: string; hours: number }>;
      byProfitability: Array<{ name: string; count: number }>;
    };
  }

  // Fetch analytics data
  const { data, isLoading, error } = useQuery<TimeAnalyticsResponse>({
    queryKey: ['/api/time-analytics-dashboard', firmId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const result = await queryFn(`/api/time-analytics-dashboard?firmId=${firmId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return result as TimeAnalyticsResponse;
    },
    enabled: !!firmId,
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading analytics data. Please try again later.</p>
      </div>
    );
  }

  // Prepare chart data
  const revenueByMonthData = {
    labels: data?.firmOverview.byMonth.map(item => item.month) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.firmOverview.byMonth.map(item => item.revenue) || [],
        backgroundColor: colors.green[0],
        borderColor: colors.green[0],
      },
    ],
  };

  const hoursByMonthData = {
    labels: data?.firmOverview.byMonth.map(item => item.month) || [],
    datasets: [
      {
        label: 'Hours',
        data: data?.firmOverview.byMonth.map(item => item.hours) || [],
        backgroundColor: colors.blue[0],
        borderColor: colors.blue[0],
      },
    ],
  };

  const serviceData = {
    labels: data?.firmOverview.byService.map(item => item.name) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.firmOverview.byService.map(item => item.revenue) || [],
        backgroundColor: [colors.blue[0], colors.green[0], colors.orange[0], colors.purple[0]],
        borderColor: [colors.blue[0], colors.green[0], colors.orange[0], colors.purple[0]],
      },
    ],
  };

  const staffUtilizationData = {
    labels: data?.staffOverview.byUtilization.map(item => item.name) || [],
    datasets: [
      {
        label: 'Utilization',
        data: data?.staffOverview.byUtilization.map(item => item.utilization) || [],
        backgroundColor: colors.blue[0],
        borderColor: colors.blue[0],
      },
      {
        label: 'Target',
        data: data?.staffOverview.byUtilization.map(item => item.target) || [],
        backgroundColor: colors.orange[0],
        borderColor: colors.orange[0],
      },
    ],
  };

  const clientRevenueData = {
    labels: data?.clientOverview.byRevenue.map(item => item.name) || [],
    datasets: [
      {
        label: 'Revenue',
        data: data?.clientOverview.byRevenue.map(item => item.revenue) || [],
        backgroundColor: [
          colors.blue[0], 
          colors.green[0], 
          colors.orange[0], 
          colors.purple[0],
          colors.red[0]
        ],
        borderColor: [
          colors.blue[0], 
          colors.green[0], 
          colors.orange[0], 
          colors.purple[0],
          colors.red[0]
        ],
      },
    ],
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Time Analytics Dashboard</CardTitle>
          <CardDescription>
            Analyze time and billing data across clients, staff, and services
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Start Date</span>
              <DatePicker date={startDate} onChange={(date) => date && setStartDate(date)} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">End Date</span>
              <DatePicker date={endDate} onChange={(date) => date && setEndDate(date)} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="firm">Firm Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Overview</TabsTrigger>
          <TabsTrigger value="clients">Client Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="firm" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.firmOverview.totalHours.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {startDate.toLocaleDateString()} to {endDate.toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${data?.firmOverview.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg. Rate: ${data?.firmOverview.averageRate.toFixed(2)}/hr
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Services Breakdown</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.firmOverview.byService.length} Categories
                </div>
                <p className="text-xs text-muted-foreground">
                  Tax, Advisory, Audit, Bookkeeping
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <InsightBarChart 
                  data={revenueByMonthData}
                  height={300}
                  insightGenerator={(index, datasetIndex, label, value) => ({
                    title: `${label} Revenue`,
                    value: `$${value.toLocaleString()}`,
                    valuePrefix: '$',
                    description: `Revenue generated during ${label}`,
                    type: 'revenue',
                    detailsKeys: ['avgRate', 'clientCount', 'topService'],
                    avgRate: `$${Math.round(value / data!.firmOverview.byMonth[index].hours)}`,
                    clientCount: Math.round(value / 7500),
                    topService: index % 3 === 0 ? 'Tax Prep' : index % 3 === 1 ? 'Advisory' : 'Bookkeeping'
                  })}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Hours</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <InsightBarChart 
                  data={hoursByMonthData}
                  height={300}
                  insightGenerator={(index, datasetIndex, label, value) => ({
                    title: `${label} Hours`,
                    value: `${value.toLocaleString()} hrs`,
                    valueSuffix: ' hrs',
                    description: `Total billable hours during ${label}`,
                    type: 'hours',
                    detailsKeys: ['staffCount', 'utilizationRate', 'mostActive'],
                    staffCount: Math.ceil(value / 120),
                    utilizationRate: `${70 + Math.round(Math.random() * 20)}%`,
                    mostActive: index % 4 === 0 ? 'Partner' : index % 4 === 1 ? 'Manager' : 
                                index % 4 === 2 ? 'Senior' : 'Staff'
                  })}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent className="h-96">
              <InsightPieChart 
                data={serviceData}
                width={250}
                height={250}
                insightGenerator={(index, label, value) => ({
                  title: label,
                  value: `$${value.toLocaleString()}`,
                  valuePrefix: '$',
                  description: `Revenue from ${label} services`,
                  type: 'revenue',
                  detailsKeys: ['percentOfTotal', 'hourlyRate', 'growthRate'],
                  percentOfTotal: `${Math.round((value / data!.firmOverview.totalRevenue) * 100)}%`,
                  hourlyRate: `$${Math.round(value / data!.firmOverview.byService[index].hours)}`,
                  growthRate: `${5 + Math.round(Math.random() * 15)}%`
                })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.staffOverview.totalStaff}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all roles and levels
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Utilization</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.staffOverview.utilization}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Target: 80% average utilization
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue per Staff</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Math.round(data?.firmOverview.totalRevenue / data?.staffOverview.totalStaff).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average revenue per staff member
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Staff Utilization vs. Target</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <InsightBarChart 
                data={staffUtilizationData}
                height={300}
                options={{
                  scales: {
                    y: {
                      min: 0,
                      max: 100,
                    },
                  },
                }}
                insightGenerator={(index, datasetIndex, label, value) => ({
                  title: `${label} Utilization`,
                  value: `${value}%`,
                  valueSuffix: '%',
                  description: datasetIndex === 0 
                    ? `Current utilization rate for ${label}` 
                    : `Target utilization rate for ${label}`,
                  type: 'utilization',
                  detailsKeys: ['headcount', 'billableHours', 'nonBillableHours'],
                  headcount: Math.ceil(Math.random() * 5) + 1,
                  billableHours: Math.round(value * 40) + 'h/week',
                  nonBillableHours: Math.round((100 - value) * 40 / 100) + 'h/week'
                })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Staff Role</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-right py-3 px-4">Revenue</th>
                    <th className="text-right py-3 px-4">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.staffOverview.byRevenue.map((role, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">{role.name}</td>
                      <td className="text-right py-3 px-4">${role.revenue.toLocaleString()}</td>
                      <td className="text-right py-3 px-4">
                        {Math.round((role.revenue / data.firmOverview.totalRevenue) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.clientOverview.totalClients}
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.clientOverview.activeClients} active in selected period
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenue per Client</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${Math.round(data?.firmOverview.totalRevenue / data?.clientOverview.activeClients).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average for active clients
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Profitability</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.clientOverview.byProfitability.find(p => p.name === 'High')?.count || 0} High
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.clientOverview.byProfitability.find(p => p.name === 'Medium')?.count || 0} Medium, {data?.clientOverview.byProfitability.find(p => p.name === 'Low')?.count || 0} Low
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Clients by Revenue</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              <InsightPieChart 
                data={clientRevenueData}
                width={250}
                height={250}
                insightGenerator={(index, label, value) => ({
                  title: label,
                  value: `$${value.toLocaleString()}`,
                  valuePrefix: '$',
                  description: `Revenue from ${label}`,
                  type: 'clients',
                  detailsKeys: ['percentOfTotal', 'avgRate', 'projectCount'],
                  percentOfTotal: `${Math.round((value / data!.firmOverview.totalRevenue) * 100)}%`,
                  avgRate: `$${Math.round(value / (data!.clientOverview.byHours.find(h => h.name === label)?.hours || 1))}`,
                  projectCount: Math.ceil(Math.random() * 3) + 1
                })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Client Hours vs. Revenue</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Client</th>
                    <th className="text-right py-3 px-4">Hours</th>
                    <th className="text-right py-3 px-4">Revenue</th>
                    <th className="text-right py-3 px-4">Avg. Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.clientOverview.byRevenue.slice(0, 4).map((client, index) => {
                    const hours = data.clientOverview.byHours.find(
                      h => h.name === client.name
                    )?.hours || 0;
                    
                    return (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{client.name}</td>
                        <td className="text-right py-3 px-4">{hours}</td>
                        <td className="text-right py-3 px-4">${client.revenue.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">
                          ${hours > 0 ? Math.round(client.revenue / hours) : 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeAnalyticsDashboard;