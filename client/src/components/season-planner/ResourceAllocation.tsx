import { useMemo, useState } from "react";
import { format, differenceInDays, addDays, isSameMonth, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface ResourceAllocationProps {
  startDate: Date;
  endDate: Date;
  projects: any[];
  proposals: any[];
  firmId?: number;
}

export function ResourceAllocation({ startDate, endDate, projects, proposals, firmId }: ResourceAllocationProps) {
  const [view, setView] = useState<"roles" | "timeline">("roles");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  
  // Fetch professional roles
  const { data: professionalRoles = [] } = useQuery({
    queryKey: ['/api/professional-roles', firmId],
    enabled: !!firmId
  });

  // Create month range between start and end dates
  const monthRange = useMemo(() => {
    const result = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      result.push({
        month: format(currentDate, 'MMM yyyy'),
        monthNum: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        startDate: startOfMonth(currentDate),
        endDate: endOfMonth(currentDate)
      });
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return result;
  }, [startDate, endDate]);
  
  // Calculate resource allocations by role
  const roleAllocations = useMemo(() => {
    // Filter only active projects and proposals with valid dates
    const activeProjects = projects.filter(project => 
      project.status !== 'cancelled' && project.status !== 'rejected' && 
      (new Date(project.startDate || project.createdAt) <= endDate) &&
      (!project.endDate || new Date(project.endDate) >= startDate)
    );
    
    const activeProposals = proposals.filter(proposal => 
      proposal.status !== 'rejected' && proposal.status !== 'cancelled' &&
      (new Date(proposal.estimatedStartDate || proposal.createdAt) <= endDate) &&
      (!proposal.estimatedEndDate || new Date(proposal.estimatedEndDate) >= startDate)
    );
    
    // Create a map to track allocations by role
    const allocationsByRole = new Map();
    
    // Initialize roles with zero hours
    professionalRoles.forEach(role => {
      allocationsByRole.set(role.id, {
        roleId: role.id,
        roleName: role.name,
        confirmedHours: 0,
        projectedHours: 0,
        capacity: parseFloat(role.capacityHours || '160') * monthRange.length, // assuming 160 hours per month capacity
        topTierRate: role.topTierRate,
        topTierCapacity: Math.floor(parseFloat(role.capacityHours || '160') * monthRange.length * 0.2), // 20% of time for top-tier work
        midTierCapacity: Math.floor(parseFloat(role.capacityHours || '160') * monthRange.length * 0.5), // 50% of time for mid-tier work
        lowTierCapacity: Math.floor(parseFloat(role.capacityHours || '160') * monthRange.length * 0.3), // 30% of time for low-tier work
        confirmedTopTierHours: 0,
        confirmedMidTierHours: 0,
        confirmedLowTierHours: 0,
        projectedTopTierHours: 0,
        projectedMidTierHours: 0,
        projectedLowTierHours: 0,
        monthlyData: monthRange.map(month => ({
          month: month.month,
          confirmedHours: 0,
          projectedHours: 0,
          capacity: parseFloat(role.capacityHours || '160')
        }))
      });
    });
    
    // Process projects
    activeProjects.forEach(project => {
      // Skip projects without role assignments
      if (!project.professionalRoleId) return;
      
      const roleData = allocationsByRole.get(project.professionalRoleId);
      if (!roleData) return;
      
      const projectStart = new Date(project.startDate || project.createdAt);
      const projectEnd = project.endDate ? new Date(project.endDate) : addDays(projectStart, 30);
      
      // Calculate how many days the project overlaps with our date range
      const rangeStart = new Date(Math.max(projectStart.getTime(), startDate.getTime()));
      const rangeEnd = new Date(Math.min(projectEnd.getTime(), endDate.getTime()));
      
      const daysInRange = differenceInDays(rangeEnd, rangeStart) + 1;
      const totalProjectDays = differenceInDays(projectEnd, projectStart) + 1;
      
      // Calculate proportional hours for the days in our range
      const hoursInRange = (parseFloat(project.estimatedHours || '0') * daysInRange) / totalProjectDays;
      
      // Assign these hours to confirmed totals
      roleData.confirmedHours += hoursInRange;
      
      // Distribute hours by tier based on the service tier or default to mid-tier
      const tier = project.tier || 'mid';
      
      if (tier === 'top') {
        roleData.confirmedTopTierHours += hoursInRange;
      } else if (tier === 'mid') {
        roleData.confirmedMidTierHours += hoursInRange;
      } else {
        roleData.confirmedLowTierHours += hoursInRange;
      }
      
      // Distribute hours across months
      monthRange.forEach((month, idx) => {
        // Check if project overlaps with this month
        if (
          (projectStart <= month.endDate && projectEnd >= month.startDate)
        ) {
          // Calculate overlap days in this month
          const monthOverlapStart = new Date(Math.max(projectStart.getTime(), month.startDate.getTime()));
          const monthOverlapEnd = new Date(Math.min(projectEnd.getTime(), month.endDate.getTime()));
          const daysInMonth = differenceInDays(monthOverlapEnd, monthOverlapStart) + 1;
          
          // Calculate proportional hours for this month
          const monthHours = (parseFloat(project.estimatedHours || '0') * daysInMonth) / totalProjectDays;
          
          roleData.monthlyData[idx].confirmedHours += monthHours;
        }
      });
    });
    
    // Process proposals
    activeProposals.forEach(proposal => {
      // Proposals might not have role assignments yet, so we'll distribute evenly
      // or use a default role if specified
      let roleId = proposal.preferredRoleId || (professionalRoles.length > 0 ? professionalRoles[0].id : null);
      
      if (!roleId) return;
      
      const roleData = allocationsByRole.get(roleId);
      if (!roleData) return;
      
      const proposalStart = new Date(proposal.estimatedStartDate || proposal.createdAt);
      const proposalEnd = proposal.estimatedEndDate 
        ? new Date(proposal.estimatedEndDate) 
        : addDays(proposalStart, 30);
      
      // Calculate how many days the proposal overlaps with our date range
      const rangeStart = new Date(Math.max(proposalStart.getTime(), startDate.getTime()));
      const rangeEnd = new Date(Math.min(proposalEnd.getTime(), endDate.getTime()));
      
      const daysInRange = differenceInDays(rangeEnd, rangeStart) + 1;
      const totalProposalDays = differenceInDays(proposalEnd, proposalStart) + 1;
      
      // Calculate proportional hours for the days in our range
      const hoursInRange = (parseFloat(proposal.estimatedHours || '0') * daysInRange) / totalProposalDays;
      
      // Apply a "probability factor" based on proposal status
      let probabilityFactor = 0.5; // Default 50% for proposals
      
      if (proposal.status === 'sent') {
        probabilityFactor = 0.7; // 70% for sent proposals
      } else if (proposal.status === 'draft') {
        probabilityFactor = 0.3; // 30% for drafts
      }
      
      // Assign hours to projected totals (adjusted by probability)
      const projectedHours = hoursInRange * probabilityFactor;
      roleData.projectedHours += projectedHours;
      
      // Distribute hours by tier based on the service tier or default to mid-tier
      const tier = proposal.tier || 'mid';
      
      if (tier === 'top') {
        roleData.projectedTopTierHours += projectedHours;
      } else if (tier === 'mid') {
        roleData.projectedMidTierHours += projectedHours;
      } else {
        roleData.projectedLowTierHours += projectedHours;
      }
      
      // Distribute hours across months
      monthRange.forEach((month, idx) => {
        // Check if proposal overlaps with this month
        if (
          (proposalStart <= month.endDate && proposalEnd >= month.startDate)
        ) {
          // Calculate overlap days in this month
          const monthOverlapStart = new Date(Math.max(proposalStart.getTime(), month.startDate.getTime()));
          const monthOverlapEnd = new Date(Math.min(proposalEnd.getTime(), month.endDate.getTime()));
          const daysInMonth = differenceInDays(monthOverlapEnd, monthOverlapStart) + 1;
          
          // Calculate proportional hours for this month
          const monthHours = (parseFloat(proposal.estimatedHours || '0') * daysInMonth) / totalProposalDays;
          
          // Apply probability factor
          roleData.monthlyData[idx].projectedHours += monthHours * probabilityFactor;
        }
      });
    });
    
    // Convert map to array for rendering
    const allocations = Array.from(allocationsByRole.values());
    
    // Sort by utilization (highest to lowest)
    allocations.sort((a, b) => {
      const utilizationA = ((a.confirmedHours + a.projectedHours) / a.capacity) || 0;
      const utilizationB = ((b.confirmedHours + b.projectedHours) / b.capacity) || 0;
      return utilizationB - utilizationA;
    });
    
    return allocations;
  }, [projects, proposals, professionalRoles, startDate, endDate, monthRange]);
  
  // Prepare role overview data
  const roleOverviewData = useMemo(() => {
    if (roleFilter === 'all') {
      return roleAllocations;
    }
    
    return roleAllocations.filter(role => role.roleId.toString() === roleFilter);
  }, [roleAllocations, roleFilter]);
  
  // Prepare monthly timeline data
  const timelineData = useMemo(() => {
    // If filtering by role, only include that role's monthly data
    const selectedRoles = roleFilter === 'all'
      ? roleAllocations
      : roleAllocations.filter(role => role.roleId.toString() === roleFilter);
    
    return monthRange.map((month, idx) => {
      // Sum up all hours for this month across selected roles
      const confirmedHours = selectedRoles.reduce((sum, role) => 
        sum + role.monthlyData[idx].confirmedHours, 0);
      
      const projectedHours = selectedRoles.reduce((sum, role) => 
        sum + role.monthlyData[idx].projectedHours, 0);
      
      const capacity = selectedRoles.reduce((sum, role) => 
        sum + role.monthlyData[idx].capacity, 0);
      
      return {
        name: month.month,
        confirmed: Math.round(confirmedHours),
        projected: Math.round(projectedHours),
        available: Math.max(0, capacity - confirmedHours - projectedHours),
        capacity
      };
    });
  }, [monthRange, roleAllocations, roleFilter]);
  
  // Calculate tier allocation data
  const tierAllocationData = useMemo(() => {
    // Get the selected roles
    const selectedRoles = roleFilter === 'all'
      ? roleAllocations
      : roleAllocations.filter(role => role.roleId.toString() === roleFilter);
    
    // Calculate totals
    const topTierConfirmed = selectedRoles.reduce((sum, r) => sum + r.confirmedTopTierHours, 0);
    const midTierConfirmed = selectedRoles.reduce((sum, r) => sum + r.confirmedMidTierHours, 0);
    const lowTierConfirmed = selectedRoles.reduce((sum, r) => sum + r.confirmedLowTierHours, 0);
    
    const topTierProjected = selectedRoles.reduce((sum, r) => sum + r.projectedTopTierHours, 0);
    const midTierProjected = selectedRoles.reduce((sum, r) => sum + r.projectedMidTierHours, 0);
    const lowTierProjected = selectedRoles.reduce((sum, r) => sum + r.projectedLowTierHours, 0);
    
    const topTierCapacity = selectedRoles.reduce((sum, r) => sum + r.topTierCapacity, 0);
    const midTierCapacity = selectedRoles.reduce((sum, r) => sum + r.midTierCapacity, 0);
    const lowTierCapacity = selectedRoles.reduce((sum, r) => sum + r.lowTierCapacity, 0);
    
    return [
      {
        name: "Top Tier",
        confirmed: Math.round(topTierConfirmed),
        projected: Math.round(topTierProjected),
        available: Math.max(0, topTierCapacity - topTierConfirmed - topTierProjected),
        capacity: topTierCapacity,
        fill: "#ef4444"  // red
      },
      {
        name: "Mid Tier",
        confirmed: Math.round(midTierConfirmed),
        projected: Math.round(midTierProjected),
        available: Math.max(0, midTierCapacity - midTierConfirmed - midTierProjected),
        capacity: midTierCapacity,
        fill: "#3b82f6"  // blue
      },
      {
        name: "Low Tier",
        confirmed: Math.round(lowTierConfirmed),
        projected: Math.round(lowTierProjected),
        available: Math.max(0, lowTierCapacity - lowTierConfirmed - lowTierProjected),
        capacity: lowTierCapacity,
        fill: "#10b981"  // green
      }
    ];
  }, [roleAllocations, roleFilter]);
  
  // Calculate total projected revenue
  const totalProjectedRevenue = useMemo(() => {
    return roleAllocations.reduce((total, role) => {
      const topTierRevenue = role.confirmedTopTierHours * parseFloat(role.topTierRate || '0') +
                            role.projectedTopTierHours * parseFloat(role.topTierRate || '0') * 0.7; // 70% probability factor
      
      const midTierRevenue = role.confirmedMidTierHours * parseFloat(role.topTierRate || '0') * 0.85 +
                            role.projectedMidTierHours * parseFloat(role.topTierRate || '0') * 0.85 * 0.7;
      
      const lowTierRevenue = role.confirmedLowTierHours * parseFloat(role.topTierRate || '0') * 0.7 +
                            role.projectedLowTierHours * parseFloat(role.topTierRate || '0') * 0.7 * 0.7;
      
      return total + topTierRevenue + midTierRevenue + lowTierRevenue;
    }, 0);
  }, [roleAllocations]);
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md shadow-md p-3">
          <p className="font-medium mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 my-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              ></div>
              <span>
                {entry.name}: {entry.value} hrs
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap justify-between gap-4">
        <Tabs value={view} onValueChange={(v) => setView(v as "roles" | "timeline")}>
          <TabsList>
            <TabsTrigger value="roles">Role Allocation</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roleAllocations.map(role => (
              <SelectItem key={role.roleId} value={role.roleId.toString()}>
                {role.roleName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Role allocation visualization */}
      {view === "roles" && (
        <div className="space-y-6">
          {/* Role allocations summary */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Resource Allocation by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roleOverviewData.map(role => {
                  const totalHours = role.confirmedHours + role.projectedHours;
                  const utilization = (totalHours / role.capacity) * 100;
                  const confirmedPercentage = (role.confirmedHours / role.capacity) * 100;
                  const projectedPercentage = (role.projectedHours / role.capacity) * 100;
                  
                  return (
                    <div key={role.roleId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{role.roleName}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            utilization > 110 ? "destructive" :
                            utilization > 90 ? "default" :
                            utilization < 50 ? "secondary" :
                            "outline"
                          }>
                            {Math.round(utilization)}% Utilization
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {Math.round(totalHours)} / {role.capacity} hrs
                          </span>
                        </div>
                      </div>
                      
                      <div className="relative h-3">
                        {/* Confirmed hours */}
                        <Progress 
                          value={confirmedPercentage} 
                          max={100}
                          className="h-full z-10 relative"
                        />
                        {/* Projected hours (shown as a lighter overlay) */}
                        <div 
                          className="absolute top-0 left-0 h-full bg-primary/30 z-20"
                          style={{ 
                            width: `${Math.min(100, confirmedPercentage + projectedPercentage)}%`,
                            clipPath: confirmedPercentage > 0 
                              ? `inset(0 0 0 ${confirmedPercentage}%)` 
                              : undefined
                          }}
                        />
                        {/* Capacity threshold marker at 100% */}
                        <div className="absolute top-0 h-full w-px bg-yellow-500 z-30" style={{ left: '100%' }}></div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mt-1">
                        <div>
                          <div className="font-medium">Confirmed</div>
                          <div>{Math.round(role.confirmedHours)} hrs ({Math.round(confirmedPercentage)}%)</div>
                        </div>
                        <div>
                          <div className="font-medium">Projected</div>
                          <div>{Math.round(role.projectedHours)} hrs ({Math.round(projectedPercentage)}%)</div>
                        </div>
                        <div>
                          <div className="font-medium">Available</div>
                          <div>{Math.round(Math.max(0, role.capacity - totalHours))} hrs ({Math.round(Math.max(0, 100 - utilization))}%)</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          {/* Tier allocation chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Service Tiers Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tierAllocationData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="confirmed" name="Confirmed Hours" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="projected" name="Projected Hours" stackId="a" fill="#93c5fd" />
                    <Bar dataKey="available" name="Available Hours" stackId="a" fill="#e5e7eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Projected Revenue</h3>
                    <p className="text-2xl font-bold">${Math.round(totalProjectedRevenue).toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Hours</h3>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        roleOverviewData.reduce((sum, role) => sum + role.confirmedHours + role.projectedHours, 0)
                      ).toLocaleString()} hrs
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Overall Utilization</h3>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        (roleOverviewData.reduce((sum, role) => sum + role.confirmedHours + role.projectedHours, 0) /
                        roleOverviewData.reduce((sum, role) => sum + role.capacity, 0)) * 100
                      )}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Timeline visualization */}
      {view === "timeline" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Resource Allocation Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timelineData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="confirmed" name="Confirmed Hours" stackId="1" fill="#3b82f6" stroke="#2563eb" />
                  <Area type="monotone" dataKey="projected" name="Projected Hours" stackId="1" fill="#93c5fd" stroke="#60a5fa" />
                  <Area type="monotone" dataKey="available" name="Available Hours" stackId="1" fill="#e5e7eb" stroke="#d1d5db" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-6 space-y-4">
              <h3 className="font-medium">Monthly Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {timelineData.map((monthData, index) => {
                  const utilization = ((monthData.confirmed + monthData.projected) / monthData.capacity) * 100;
                  const confirmedPercentage = (monthData.confirmed / monthData.capacity) * 100;
                  const projectedPercentage = (monthData.projected / monthData.capacity) * 100;
                  
                  return (
                    <Card key={index} className={`overflow-hidden ${
                      utilization > 100 ? 'border-red-200 bg-red-50' : 
                      utilization < 50 ? 'border-blue-200 bg-blue-50' : ''
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{monthData.name}</h4>
                          <Badge variant={
                            utilization > 110 ? "destructive" :
                            utilization > 90 ? "default" :
                            utilization < 50 ? "secondary" :
                            "outline"
                          }>
                            {Math.round(utilization)}%
                          </Badge>
                        </div>
                        
                        <div className="relative h-2 mb-3">
                          {/* Confirmed hours */}
                          <Progress 
                            value={confirmedPercentage} 
                            max={100}
                            className="h-full z-10 relative"
                          />
                          {/* Projected hours (shown as a lighter overlay) */}
                          <div 
                            className="absolute top-0 left-0 h-full bg-primary/30 z-20"
                            style={{ 
                              width: `${Math.min(100, confirmedPercentage + projectedPercentage)}%`,
                              clipPath: confirmedPercentage > 0 
                                ? `inset(0 0 0 ${confirmedPercentage}%)` 
                                : undefined
                            }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium">Confirmed</div>
                            <div>{monthData.confirmed} hrs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">Projected</div>
                            <div>{monthData.projected} hrs</div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium">Available</div>
                            <div>{monthData.available} hrs</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}