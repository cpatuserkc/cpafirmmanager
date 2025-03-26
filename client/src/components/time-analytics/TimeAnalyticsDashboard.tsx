import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { 
  Calendar, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Users, 
  Briefcase, 
  Clock,
  Filter,
  Download,
  CalendarDays
} from "lucide-react";

// Sample color palette
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TimeAnalyticsDashboard = () => {
  // State for filters
  const [activeTab, setActiveTab] = useState("firmOverview");
  const [timeRange, setTimeRange] = useState("lastThreeMonths");
  const [startDate, setStartDate] = useState(subMonths(startOfMonth(new Date()), 3));
  const [endDate, setEndDate] = useState(endOfMonth(new Date()));
  const [selectedFirmId, setSelectedFirmId] = useState<number | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string | null>(null);

  // Fetch data for the analytics
  const { data: timeAnalyticsData, isLoading } = useQuery({
    queryKey: [
      "/api/time-analytics", 
      {
        startDate: format(startDate, "yyyy-MM-dd"),
        endDate: format(endDate, "yyyy-MM-dd"),
        firmId: selectedFirmId,
        staffId: selectedStaffId,
        clientId: selectedClientId,
        serviceCategory: selectedServiceCategory
      }
    ],
    // This will be replaced with actual API call when backend is ready
    queryFn: async () => {
      // For now, return mock data structure that matches what we'll need
      return {
        firmOverview: {
          totalHours: 1240,
          totalRevenue: 187500,
          averageRate: 151.21,
          byMonth: [
            { month: "Jan", hours: 410, revenue: 62000 },
            { month: "Feb", hours: 380, revenue: 58000 },
            { month: "Mar", hours: 450, revenue: 67500 }
          ],
          byService: [
            { name: "Tax Prep", hours: 580, revenue: 84000 },
            { name: "Bookkeeping", hours: 320, revenue: 41000 },
            { name: "Advisory", hours: 220, revenue: 44000 },
            { name: "Audit", hours: 120, revenue: 18500 }
          ],
          byStaff: [
            { name: "Partner", hours: 280, revenue: 70000 },
            { name: "Manager", hours: 360, revenue: 61200 },
            { name: "Senior", hours: 400, revenue: 40000 },
            { name: "Staff", hours: 200, revenue: 16300 }
          ]
        },
        staffOverview: {
          utilization: 78,
          totalStaff: 12,
          byUtilization: [
            { name: "Partner", utilization: 65, target: 70 },
            { name: "Manager", utilization: 82, target: 80 },
            { name: "Senior", utilization: 88, target: 85 },
            { name: "Staff", utilization: 72, target: 75 }
          ],
          byRevenue: [
            { name: "Partner", revenue: 70000 },
            { name: "Manager", revenue: 61200 },
            { name: "Senior", revenue: 40000 },
            { name: "Staff", revenue: 16300 }
          ]
        },
        clientOverview: {
          totalClients: 38,
          activeClients: 24,
          byRevenue: [
            { name: "Adams Family", revenue: 12500 },
            { name: "XYZ Corp", revenue: 8700 },
            { name: "123 Industries", revenue: 7300 },
            { name: "Smith Consulting", revenue: 6800 },
            { name: "Other Clients", revenue: 152200 }
          ],
          byHours: [
            { name: "Adams Family", hours: 82 },
            { name: "XYZ Corp", hours: 64 },
            { name: "123 Industries", hours: 51 },
            { name: "Smith Consulting", hours: 48 },
            { name: "Other Clients", hours: 995 }
          ],
          byProfitability: [
            { name: "High", count: 8 },
            { name: "Medium", count: 12 },
            { name: "Low", count: 4 }
          ]
        }
      };
    }
  });

  // Handle date range selection
  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    
    switch (value) {
      case "currentMonth":
        setStartDate(startOfMonth(new Date()));
        setEndDate(endOfMonth(new Date()));
        break;
      case "lastMonth":
        setStartDate(startOfMonth(subMonths(new Date(), 1)));
        setEndDate(endOfMonth(subMonths(new Date(), 1)));
        break;
      case "lastThreeMonths":
        setStartDate(subMonths(startOfMonth(new Date()), 3));
        setEndDate(endOfMonth(new Date()));
        break;
      case "lastSixMonths":
        setStartDate(subMonths(startOfMonth(new Date()), 6));
        setEndDate(endOfMonth(new Date()));
        break;
      case "lastYear":
        setStartDate(subMonths(startOfMonth(new Date()), 12));
        setEndDate(endOfMonth(new Date()));
        break;
      case "custom":
        // Keep current custom date selection
        break;
    }
  };

  const renderPercentage = (percentage: number) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const dashoffset = circumference - (percentage / 100) * circumference;
    
    return (
      <div className="relative h-24 w-24 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            className="text-neutral-200"
            strokeWidth="8"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
          />
          <circle
            className="text-primary"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="50"
            cy="50"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Time Range</label>
              <Select value={timeRange} onValueChange={handleTimeRangeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="currentMonth">Current Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="lastThreeMonths">Last 3 Months</SelectItem>
                  <SelectItem value="lastSixMonths">Last 6 Months</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {timeRange === "custom" && (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date</label>
                  <DatePicker
                    date={startDate}
                    onChange={(date) => date && setStartDate(date)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date</label>
                  <DatePicker
                    date={endDate}
                    onChange={(date) => date && setEndDate(date)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end space-x-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="firmOverview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Firm Overview
          </TabsTrigger>
          <TabsTrigger value="staffOverview" className="flex items-center">
            <Users className="h-4 w-4 mr-2" />
            Staff Overview
          </TabsTrigger>
          <TabsTrigger value="clientOverview" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Client Overview
          </TabsTrigger>
        </TabsList>

        {/* Firm Overview Tab */}
        <TabsContent value="firmOverview">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-10 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Total Hours</div>
                    <div className="text-3xl font-bold">{timeAnalyticsData?.firmOverview.totalHours.toLocaleString()}</div>
                    <div className="text-xs text-neutral-500 mt-1 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      For period {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Total Revenue</div>
                    <div className="text-3xl font-bold">${timeAnalyticsData?.firmOverview.totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-neutral-500 mt-1 flex items-center">
                      <CalendarDays className="h-3 w-3 mr-1" />
                      For period {format(startDate, "MMM d, yyyy")} to {format(endDate, "MMM d, yyyy")}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Average Rate</div>
                    <div className="text-3xl font-bold">${timeAnalyticsData?.firmOverview.averageRate.toFixed(2)}</div>
                    <div className="text-xs text-neutral-500 mt-1">Per hour across all services</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Hours & Revenue by Month</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeAnalyticsData?.firmOverview.byMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Revenue by Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={timeAnalyticsData?.firmOverview.byService}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {timeAnalyticsData?.firmOverview.byService.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Hours & Revenue by Staff Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeAnalyticsData?.firmOverview.byStaff} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="hours" name="Hours" fill="#8884d8" />
                      <Bar yAxisId="right" dataKey="revenue" name="Revenue ($)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Staff Overview Tab */}
        <TabsContent value="staffOverview">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-10 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Overall Utilization</div>
                    <div className="flex items-center">
                      {renderPercentage(timeAnalyticsData?.staffOverview.utilization || 0)}
                      <div className="ml-4">
                        <div className="text-sm text-neutral-500">Total Staff</div>
                        <div className="text-xl font-bold">{timeAnalyticsData?.staffOverview.totalStaff}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Utilization by Role</div>
                    <div className="space-y-3 mt-3">
                      {timeAnalyticsData?.staffOverview.byUtilization.map((role) => (
                        <div key={role.name}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium">{role.name}</span>
                            <span className="text-sm text-neutral-500">{role.utilization}% of {role.target}% target</span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${role.utilization >= role.target ? 'bg-green-500' : 'bg-amber-500'}`} 
                              style={{ width: `${role.utilization}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Revenue by Staff Role</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeAnalyticsData?.staffOverview.byRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" name="Revenue ($)" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Client Overview Tab */}
        <TabsContent value="clientOverview">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-10 w-32" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Total Clients</div>
                    <div className="text-3xl font-bold">{timeAnalyticsData?.clientOverview.totalClients}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      {timeAnalyticsData?.clientOverview.activeClients} active in selected period
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Client Profitability</div>
                    <div className="flex justify-between items-center mt-2">
                      {timeAnalyticsData?.clientOverview.byProfitability.map((segment) => (
                        <div key={segment.name} className="text-center">
                          <div className={`
                            text-xl font-bold
                            ${segment.name === "High" ? "text-green-500" : 
                              segment.name === "Medium" ? "text-amber-500" : "text-red-500"}
                          `}>
                            {segment.count}
                          </div>
                          <div className="text-xs text-neutral-500">{segment.name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-neutral-500 mb-1">Top Client</div>
                    <div className="text-xl font-bold">{timeAnalyticsData?.clientOverview.byRevenue[0].name}</div>
                    <div className="text-xs text-neutral-500 mt-1">
                      ${timeAnalyticsData?.clientOverview.byRevenue[0].revenue.toLocaleString()} in revenue
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Clients by Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeAnalyticsData?.clientOverview.byRevenue} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                        <Legend />
                        <Bar dataKey="revenue" name="Revenue ($)" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Top Clients by Hours</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={timeAnalyticsData?.clientOverview.byHours} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="hours" name="Hours" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TimeAnalyticsDashboard;