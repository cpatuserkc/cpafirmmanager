import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { format, isWithinInterval, addDays } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResourceAllocationProps {
  startDate: Date;
  endDate: Date;
  projects: any[];
  proposals: any[];
  firmId?: number;
}

export function ResourceAllocation({ startDate, endDate, projects, proposals, firmId }: ResourceAllocationProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [activeView, setActiveView] = useState<'roles' | 'resources' | 'day'>('roles');

  // Fetch professional roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/professional-roles', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const response = await fetch(`/api/professional-roles?firmId=${firmId}`);
      if (!response.ok) throw new Error('Failed to fetch professional roles');
      return response.json();
    },
    enabled: !!firmId,
  });

  // Process projects/proposals to create allocation data
  const allocationData = useMemo(() => {
    // Map of role ID to allocation data
    const roleAllocations: Map<number, { 
      allocated: number;
      topTier: number;
      midTier: number;
      lowTier: number;
      capacity: number;
      dailyData: { [date: string]: number };
    }> = new Map();
    
    // Initialize allocation data for each role
    roles.forEach(role => {
      roleAllocations.set(role.id, {
        allocated: 0,
        topTier: 0,
        midTier: 0,
        lowTier: 0,
        capacity: 160, // default 160 hours per month capacity (placeholder)
        dailyData: {}
      });
    });
    
    // Process projects to calculate allocations
    projects.forEach(project => {
      if (!project.professionalRoleId || !project.estimatedHours || !project.startDate) return;
      
      const roleId = project.professionalRoleId;
      const hours = parseFloat(project.estimatedHours);
      const tier = project.tier || 'top';
      const roleData = roleAllocations.get(roleId);
      
      if (!roleData) return;
      
      // Add to total allocation
      roleData.allocated += hours;
      
      // Add to tier-specific allocation
      if (tier === 'top') {
        roleData.topTier += hours;
      } else if (tier === 'mid') {
        roleData.midTier += hours;
      } else if (tier === 'low') {
        roleData.lowTier += hours;
      }
      
      // Add to daily allocation data (distribute hours evenly across project duration)
      const projectStartDate = new Date(project.startDate);
      const projectEndDate = project.endDate ? new Date(project.endDate) : addDays(projectStartDate, Math.ceil(hours / 8));
      const dayCount = Math.max(1, Math.ceil((projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyHours = hours / dayCount;
      
      let currentDate = new Date(projectStartDate);
      while (currentDate <= projectEndDate) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        roleData.dailyData[dateString] = (roleData.dailyData[dateString] || 0) + dailyHours;
        currentDate = addDays(currentDate, 1);
      }
    });
    
    // Similar logic for proposals, but with lower weight
    proposals.forEach(proposal => {
      if (!proposal.professionalRoleId || !proposal.estimatedHours || !proposal.estimatedStartDate) return;
      
      const roleId = proposal.professionalRoleId;
      // Apply a 50% weight to proposals since they're not confirmed
      const hours = parseFloat(proposal.estimatedHours) * 0.5;
      const tier = proposal.tier || 'top';
      const roleData = roleAllocations.get(roleId);
      
      if (!roleData) return;
      
      // Add to total allocation
      roleData.allocated += hours;
      
      // Add to tier-specific allocation
      if (tier === 'top') {
        roleData.topTier += hours;
      } else if (tier === 'mid') {
        roleData.midTier += hours;
      } else if (tier === 'low') {
        roleData.lowTier += hours;
      }
      
      // Add to daily allocation data (distribute hours evenly across project duration)
      const proposalStartDate = new Date(proposal.estimatedStartDate);
      const proposalEndDate = proposal.estimatedEndDate ? 
        new Date(proposal.estimatedEndDate) : 
        addDays(proposalStartDate, Math.ceil(hours / 8));
      
      const dayCount = Math.max(1, Math.ceil((proposalEndDate.getTime() - proposalStartDate.getTime()) / (1000 * 60 * 60 * 24)));
      const dailyHours = hours / dayCount;
      
      let currentDate = new Date(proposalStartDate);
      while (currentDate <= proposalEndDate) {
        const dateString = format(currentDate, 'yyyy-MM-dd');
        roleData.dailyData[dateString] = (roleData.dailyData[dateString] || 0) + dailyHours;
        currentDate = addDays(currentDate, 1);
      }
    });
    
    return roleAllocations;
  }, [roles, projects, proposals]);

  // Prepare data for charts
  const roleChartData = useMemo(() => {
    return Array.from(allocationData.entries()).map(([roleId, data]) => {
      const role = roles.find(r => r.id === roleId) || { name: 'Unknown Role' };
      const utilizationPercent = Math.min(100, Math.round((data.allocated / data.capacity) * 100));
      
      return {
        id: roleId,
        name: role.name,
        allocated: Math.round(data.allocated),
        topTier: Math.round(data.topTier),
        midTier: Math.round(data.midTier),
        lowTier: Math.round(data.lowTier),
        capacity: data.capacity,
        utilization: utilizationPercent
      };
    }).sort((a, b) => b.utilization - a.utilization); // Sort by utilization (highest first)
  }, [roles, allocationData]);

  // Prepare data for daily view
  const dailyAllocationData = useMemo(() => {
    if (!selectedDate) return [];
    
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    return Array.from(allocationData.entries()).map(([roleId, data]) => {
      const role = roles.find(r => r.id === roleId) || { name: 'Unknown Role' };
      const dailyHours = data.dailyData[dateString] || 0;
      const dailyCapacity = data.capacity / 20; // Assuming 20 working days per month
      const utilizationPercent = Math.min(100, Math.round((dailyHours / dailyCapacity) * 100));
      
      return {
        id: roleId,
        name: role.name,
        hours: Math.round(dailyHours * 10) / 10, // Round to 1 decimal
        capacity: dailyCapacity,
        utilization: utilizationPercent
      };
    }).filter(item => item.hours > 0).sort((a, b) => b.utilization - a.utilization);
  }, [selectedDate, roles, allocationData]);

  // Calculate role aggregates for pie chart
  const roleDistributionData = useMemo(() => {
    const total = roleChartData.reduce((sum, role) => sum + role.allocated, 0);
    if (total === 0) return [];
    
    return roleChartData
      .filter(role => role.allocated > 0)
      .map(role => ({
        name: role.name,
        value: role.allocated,
        percentage: Math.round((role.allocated / total) * 100)
      }));
  }, [roleChartData]);

  // Calculate tier distribution data
  const tierDistributionData = useMemo(() => {
    const topTier = roleChartData.reduce((sum, role) => sum + role.topTier, 0);
    const midTier = roleChartData.reduce((sum, role) => sum + role.midTier, 0);
    const lowTier = roleChartData.reduce((sum, role) => sum + role.lowTier, 0);
    const total = topTier + midTier + lowTier;
    
    if (total === 0) return [];
    
    return [
      { name: 'Top Tier', value: topTier, percentage: Math.round((topTier / total) * 100) },
      { name: 'Mid Tier', value: midTier, percentage: Math.round((midTier / total) * 100) },
      { name: 'Low Tier', value: lowTier, percentage: Math.round((lowTier / total) * 100) }
    ].filter(item => item.value > 0);
  }, [roleChartData]);

  // Generate colors for pie charts
  const COLORS = ['#4338ca', '#059669', '#ca8a04', '#be185d', '#0284c7', '#7c3aed'];

  if (rolesLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="roles">Role Utilization</TabsTrigger>
          <TabsTrigger value="resources">Resource Distribution</TabsTrigger>
          <TabsTrigger value="day">Daily View</TabsTrigger>
        </TabsList>
        
        <TabsContent value="roles" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Role Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                {roleChartData.length > 0 ? (
                  <div className="space-y-4">
                    {roleChartData.map(role => (
                      <div key={role.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{role.name}</span>
                          <span>
                            {role.allocated} / {role.capacity} hours ({role.utilization}%)
                          </span>
                        </div>
                        <Progress value={role.utilization} className="h-2" />
                        <div className="text-xs text-muted-foreground flex gap-4">
                          <span>Top: {role.topTier} hrs</span>
                          <span>Mid: {role.midTier} hrs</span>
                          <span>Low: {role.lowTier} hrs</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No allocation data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Capacity Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {roleChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={roleChartData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} hours`, ``]} />
                      <Legend />
                      <Bar dataKey="capacity" name="Capacity" fill="#e2e8f0" />
                      <Bar dataKey="allocated" name="Allocated" fill="#4338ca" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No allocation data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Tier Distribution by Role</CardTitle>
            </CardHeader>
            <CardContent>
              {roleChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={roleChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} hours`, ``]} />
                    <Legend />
                    <Bar dataKey="topTier" name="Top Tier" stackId="a" fill="#4338ca" />
                    <Bar dataKey="midTier" name="Mid Tier" stackId="a" fill="#059669" />
                    <Bar dataKey="lowTier" name="Low Tier" stackId="a" fill="#ca8a04" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No allocation data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Role Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {roleDistributionData.length > 0 ? (
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={roleDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {roleDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} hours`, ``]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No distribution data available
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Tier Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {tierDistributionData.length > 0 ? (
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={tierDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#4338ca" /> {/* Top Tier */}
                          <Cell fill="#059669" /> {/* Mid Tier */}
                          <Cell fill="#ca8a04" /> {/* Low Tier */}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} hours`, ``]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No distribution data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Insights & Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleChartData.some(role => role.utilization > 90) && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm dark:bg-red-950/30 dark:border-red-900">
                    <div className="font-medium text-red-800 dark:text-red-400">Overallocation Warning</div>
                    <p className="text-red-700 dark:text-red-300">
                      Some roles are overallocated (&gt;90% capacity). Consider adjusting staffing or redistributing work.
                    </p>
                  </div>
                )}
                
                {roleChartData.some(role => role.utilization < 40) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm dark:bg-amber-950/30 dark:border-amber-900">
                    <div className="font-medium text-amber-800 dark:text-amber-400">Underutilization Alert</div>
                    <p className="text-amber-700 dark:text-amber-300">
                      Some roles have low utilization (&lt;40% capacity). Consider reassigning work or reducing rates to attract more business.
                    </p>
                  </div>
                )}
                
                {tierDistributionData.length > 0 && tierDistributionData[0]?.percentage > 70 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm dark:bg-blue-950/30 dark:border-blue-900">
                    <div className="font-medium text-blue-800 dark:text-blue-400">Tier Balance Opportunity</div>
                    <p className="text-blue-700 dark:text-blue-300">
                      Top-tier work dominates your allocation. Consider delegating more to mid and low tiers for better profitability.
                    </p>
                  </div>
                )}
                
                {tierDistributionData.length > 0 && tierDistributionData.find(t => t.name === 'Low Tier')?.percentage > 50 && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm dark:bg-green-950/30 dark:border-green-900">
                    <div className="font-medium text-green-800 dark:text-green-400">Revenue Enhancement</div>
                    <p className="text-green-700 dark:text-green-300">
                      Low-tier work represents a high proportion of your allocation. Consider raising rates or pursuing higher-value clients.
                    </p>
                  </div>
                )}
                
                {(roleChartData.length === 0 || roleDistributionData.length === 0) && (
                  <div className="text-center py-4 text-muted-foreground">
                    Insufficient data for meaningful insights
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="day" className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-shrink-0 w-full md:w-64">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="mt-4 text-sm text-muted-foreground">
                  Select a date to view resource allocation for that specific day.
                </div>
              </CardContent>
            </Card>
            
            <Card className="flex-grow">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Daily Allocation: {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select a date'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyAllocationData.length > 0 ? (
                  <div className="space-y-4">
                    {dailyAllocationData.map(role => (
                      <div key={role.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{role.name}</span>
                          <span>
                            {role.hours} / {Math.round(role.capacity * 10) / 10} hours ({role.utilization}%)
                          </span>
                        </div>
                        <Progress 
                          value={role.utilization} 
                          className={cn(
                            "h-2",
                            role.utilization > 100 ? "bg-red-200" : ""
                          )} 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No allocation data for the selected date
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Daily Staff Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {dailyAllocationData.length > 0 ? (
                <div className="space-y-4">
                  {dailyAllocationData.some(role => role.utilization > 100) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm dark:bg-red-950/30 dark:border-red-900">
                      <div className="font-medium text-red-800 dark:text-red-400">Overallocation Warning</div>
                      <p className="text-red-700 dark:text-red-300">
                        Some roles are overallocated for {selectedDate ? format(selectedDate, 'MMM d') : 'this day'}. Consider:
                      </p>
                      <ul className="list-disc ml-5 mt-1 text-red-700 dark:text-red-300">
                        <li>Postponing non-critical work</li>
                        <li>Bringing in temporary assistance</li>
                        <li>Redistributing tasks among available staff</li>
                      </ul>
                    </div>
                  )}
                  
                  {dailyAllocationData.every(role => role.utilization < 50) && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm dark:bg-green-950/30 dark:border-green-900">
                      <div className="font-medium text-green-800 dark:text-green-400">Capacity Available</div>
                      <p className="text-green-700 dark:text-green-300">
                        All roles have available capacity for {selectedDate ? format(selectedDate, 'MMM d') : 'this day'}. Consider:
                      </p>
                      <ul className="list-disc ml-5 mt-1 text-green-700 dark:text-green-300">
                        <li>Scheduling additional client work</li>
                        <li>Planning professional development activities</li>
                        <li>Focusing on business development initiatives</li>
                      </ul>
                    </div>
                  )}
                  
                  {!dailyAllocationData.some(role => role.utilization > 100) && 
                   !dailyAllocationData.every(role => role.utilization < 50) && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm dark:bg-blue-950/30 dark:border-blue-900">
                      <div className="font-medium text-blue-800 dark:text-blue-400">Balanced Workload</div>
                      <p className="text-blue-700 dark:text-blue-300">
                        Workload appears balanced for {selectedDate ? format(selectedDate, 'MMM d') : 'this day'}.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No allocation data for the selected date
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}