import { useMemo } from "react";
import { isWithinInterval, differenceInDays, addDays, format, isSameDay } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpRight, ArrowDownRight, CheckCircle2 } from "lucide-react";

interface ResourceAllocationProps {
  startDate: Date;
  endDate: Date;
  projects: any[];
  proposals: any[];
  firmId?: number;
}

export function ResourceAllocation({ startDate, endDate, projects, proposals, firmId }: ResourceAllocationProps) {
  // Fetch professional roles for the firm
  const { data: roles } = useQuery({
    queryKey: ['/api/professional-roles', firmId],
    enabled: !!firmId
  });
  
  // Normalize data for easier processing
  const normalizedProjects = useMemo(() => {
    return projects.map(project => ({
      id: project.id,
      title: project.name,
      startDate: new Date(project.startDate || project.createdAt),
      endDate: project.endDate ? new Date(project.endDate) : addDays(new Date(project.startDate || project.createdAt), 30),
      status: project.status,
      hours: parseFloat(project.estimatedHours || '0'),
      professionalRoleId: project.professionalRoleId,
      clientName: project.clientName,
      type: 'project',
      coefficient: 1.0, // Confirmed projects count 100%
    }));
  }, [projects]);
  
  const normalizedProposals = useMemo(() => {
    return proposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      startDate: new Date(proposal.estimatedStartDate || proposal.createdAt),
      endDate: proposal.estimatedEndDate ? new Date(proposal.estimatedEndDate) : addDays(new Date(proposal.estimatedStartDate || proposal.createdAt), 30),
      status: proposal.status,
      hours: parseFloat(proposal.estimatedHours || '0'),
      professionalRoleId: proposal.professionalRoleId,
      clientName: proposal.clientName,
      type: 'proposal',
      // Proposals are weighted by their status
      coefficient: proposal.status === 'accepted' ? 0.9 :
                   proposal.status === 'sent' ? 0.6 :
                   proposal.status === 'draft' ? 0.3 : 0.5,
    }));
  }, [proposals]);
  
  // Combine projects and proposals
  const allItems = useMemo(() => {
    return [...normalizedProjects, ...normalizedProposals];
  }, [normalizedProjects, normalizedProposals]);
  
  // Calculate total duration in days
  const totalDays = useMemo(() => {
    return differenceInDays(endDate, startDate) + 1;
  }, [startDate, endDate]);
  
  // Calculate allocation by role
  const roleAllocations = useMemo(() => {
    if (!roles) return [];
    
    const allocations = roles.map(role => {
      // Get all items for this role
      const roleItems = allItems.filter(item => item.professionalRoleId === role.id);
      
      // Calculate total hours for this role
      const totalHours = roleItems.reduce((sum, item) => sum + (item.hours * item.coefficient), 0);
      
      // Calculate weighted hours by month
      const monthlyHours: Record<string, number> = {};
      
      // Initialize months
      let currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const monthKey = format(currentDate, 'yyyy-MM');
        monthlyHours[monthKey] = 0;
        currentDate = new Date(currentDate);
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Calculate hours per month
      roleItems.forEach(item => {
        const itemStartDate = new Date(Math.max(item.startDate.getTime(), startDate.getTime()));
        const itemEndDate = item.endDate 
          ? new Date(Math.min(item.endDate.getTime(), endDate.getTime()))
          : new Date(Math.min(addDays(item.startDate, 30).getTime(), endDate.getTime()));
        
        const itemDurationDays = differenceInDays(itemEndDate, itemStartDate) + 1;
        const dailyHours = (item.hours * item.coefficient) / itemDurationDays;
        
        // Distribute hours across days
        let day = new Date(itemStartDate);
        while (day <= itemEndDate) {
          const monthKey = format(day, 'yyyy-MM');
          monthlyHours[monthKey] = (monthlyHours[monthKey] || 0) + dailyHours;
          day = addDays(day, 1);
        }
      });
      
      // Calculate capacity
      // Top tier capacity is the ideal amount of hours this role should work
      const workDaysPerMonth = 20; // Average number of work days per month
      const hoursPerDay = 8; // Standard workday hours
      
      // Calculate capacity for each tier assuming the role model splits work:
      // - Top tier: Partner/Senior staff (30% allocation)
      // - Mid tier: Manager/Experienced staff (50% allocation)
      // - Low tier: Junior staff (100% allocation)
      const capacity = {
        topTier: Math.round(role.count * workDaysPerMonth * hoursPerDay * 0.3), // 30% of time for top tier staff
        midTier: Math.round(role.count * workDaysPerMonth * hoursPerDay * 0.5), // 50% of time for mid tier staff
        lowTier: Math.round(role.count * workDaysPerMonth * hoursPerDay * 1.0), // 100% of time for low tier staff
      };
      
      return {
        id: role.id,
        name: role.name,
        count: role.count || 1,
        totalHours,
        monthlyHours,
        capacity,
        utilization: totalHours / (capacity.topTier + capacity.midTier + capacity.lowTier),
        items: roleItems,
      };
    });
    
    return allocations.sort((a, b) => b.utilization - a.utilization);
  }, [roles, allItems, startDate, endDate]);
  
  // Get months in the range
  const months = useMemo(() => {
    const result: string[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = format(currentDate, 'yyyy-MM');
      if (!result.includes(monthKey)) {
        result.push(monthKey);
      }
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return result;
  }, [startDate, endDate]);
  
  // Calculate total allocation across all roles
  const overallAllocation = useMemo(() => {
    const totalAllocated = roleAllocations.reduce((sum, role) => sum + role.totalHours, 0);
    const totalCapacity = roleAllocations.reduce((sum, role) => {
      return sum + role.capacity.topTier + role.capacity.midTier + role.capacity.lowTier;
    }, 0);
    
    return {
      totalAllocated,
      totalCapacity,
      utilization: totalCapacity > 0 ? totalAllocated / totalCapacity : 0,
      byMonth: months.reduce((acc, month) => {
        const monthlyAllocated = roleAllocations.reduce((sum, role) => {
          return sum + (role.monthlyHours[month] || 0);
        }, 0);
        
        // Approximate monthly capacity (total capacity / number of months)
        const monthlyCapacity = totalCapacity / months.length;
        
        acc[month] = {
          allocated: monthlyAllocated,
          capacity: monthlyCapacity,
          utilization: monthlyCapacity > 0 ? monthlyAllocated / monthlyCapacity : 0
        };
        return acc;
      }, {} as Record<string, { allocated: number; capacity: number; utilization: number }>)
    };
  }, [roleAllocations, months]);

  return (
    <div className="space-y-6">
      {/* Overview card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resource Allocation Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Total Allocation</div>
              <div className="text-2xl font-semibold mb-2">
                {Math.round(overallAllocation.totalAllocated)} hrs
              </div>
              <div className="flex items-center text-sm">
                <div className="flex-1">of {Math.round(overallAllocation.totalCapacity)} hrs capacity</div>
                <Badge variant={
                  overallAllocation.utilization > 0.9 ? "destructive" : 
                  overallAllocation.utilization > 0.7 ? "default" : 
                  "secondary"
                }>
                  {Math.round(overallAllocation.utilization * 100)}%
                </Badge>
              </div>
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Busiest Month</div>
              {months.length > 0 ? (
                <>
                  {(() => {
                    // Find the month with highest utilization
                    const busiestMonth = Object.entries(overallAllocation.byMonth).reduce(
                      (busiest, [month, data]) => 
                        !busiest || data.utilization > overallAllocation.byMonth[busiest].utilization 
                          ? month 
                          : busiest, 
                      ""
                    );
                    
                    const utilization = overallAllocation.byMonth[busiestMonth]?.utilization || 0;
                    
                    return (
                      <>
                        <div className="text-2xl font-semibold mb-1">
                          {format(new Date(busiestMonth + "-01"), "MMMM yyyy")}
                        </div>
                        <div className="flex items-center text-sm gap-2">
                          <Badge variant={
                            utilization > 0.9 ? "destructive" : 
                            utilization > 0.7 ? "default" : 
                            "secondary"
                          }>
                            {Math.round(utilization * 100)}%
                          </Badge>
                          <div>utilization rate</div>
                        </div>
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="text-sm text-muted-foreground">No data available</div>
              )}
            </div>
            
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Role Allocation</div>
              <div className="text-2xl font-semibold mb-2">
                {roleAllocations.length} roles
              </div>
              <div className="text-sm">
                {roleAllocations.filter(r => r.utilization > 0.9).length > 0 ? (
                  <div className="flex items-center gap-1 text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> 
                    {roleAllocations.filter(r => r.utilization > 0.9).length} roles overallocated
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-3.5 w-3.5" /> All roles within capacity
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {overallAllocation.utilization > 0.9 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Over-allocation Warning</AlertTitle>
              <AlertDescription>
                Resources are overallocated at {Math.round(overallAllocation.utilization * 100)}% of capacity. 
                Consider reducing workload, increasing capacity, or extending project timelines.
              </AlertDescription>
            </Alert>
          )}
          
          {overallAllocation.utilization < 0.5 && roleAllocations.length > 0 && (
            <Alert className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Capacity Available</AlertTitle>
              <AlertDescription>
                Resources are utilized at only {Math.round(overallAllocation.utilization * 100)}% of capacity. 
                You have room to take on additional projects or proposals.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Month by month allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {months.map(month => {
              const data = overallAllocation.byMonth[month];
              const utilization = data?.utilization || 0;
              const formattedMonth = format(new Date(month + "-01"), "MMMM yyyy");
              
              return (
                <div key={month} className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{formattedMonth}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {Math.round(data?.allocated || 0)} / {Math.round(data?.capacity || 0)} hrs
                      </span>
                      <Badge variant={
                        utilization > 0.9 ? "destructive" : 
                        utilization > 0.7 ? "default" : 
                        "secondary"
                      }>
                        {Math.round(utilization * 100)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress 
                    value={utilization * 100} 
                    className={`h-2 ${utilization > 0.9 ? 'bg-red-200' : ''}`} 
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Role allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="utilization">
            <TabsList className="mb-4">
              <TabsTrigger value="utilization">Utilization</TabsTrigger>
              <TabsTrigger value="projects">Project Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="utilization" className="space-y-6">
              {roleAllocations.length > 0 ? (
                roleAllocations.map(role => {
                  const utilization = role.utilization;
                  const utilizationPercent = Math.round(utilization * 100);
                  const isPotentialIssue = utilization > 0.9 || utilization < 0.4;
                  
                  return (
                    <div key={role.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{role.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.count} staff members
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {Math.round(role.totalHours)} / {Math.round(role.capacity.topTier + role.capacity.midTier + role.capacity.lowTier)} hrs
                          </span>
                          <Badge variant={
                            utilization > 0.9 ? "destructive" : 
                            utilization > 0.7 ? "default" : 
                            "secondary"
                          }>
                            {utilizationPercent}%
                          </Badge>
                        </div>
                      </div>
                      
                      <Progress 
                        value={utilizationPercent} 
                        className={`h-2 ${utilization > 0.9 ? 'bg-red-200' : 'bg-primary/20'}`} 
                      />
                      
                      {isPotentialIssue && (
                        <div className={`text-xs ${utilization > 0.9 ? 'text-destructive' : 'text-amber-600'} flex items-center gap-1`}>
                          {utilization > 0.9 ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" />
                              <span>Overallocated by {utilizationPercent - 100}% - consider reducing workload or adding staff</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3" />
                              <span>Underutilized at {utilizationPercent}% - capacity available for additional projects</span>
                            </>
                          )}
                        </div>
                      )}
                      
                      {/* Monthly breakdown */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-2">
                        {months.map(month => {
                          const monthlyHours = role.monthlyHours[month] || 0;
                          // Monthly capacity is the total capacity divided by the number of months
                          const monthlyCapacity = (role.capacity.topTier + role.capacity.midTier + role.capacity.lowTier) / months.length;
                          const monthUtilization = monthlyCapacity > 0 ? monthlyHours / monthlyCapacity : 0;
                          
                          return (
                            <div key={month} className="bg-muted/30 p-2 rounded text-xs">
                              <div className="text-muted-foreground">{format(new Date(month + "-01"), "MMM yyyy")}</div>
                              <div className="flex justify-between mt-1">
                                <span>{Math.round(monthlyHours)} hrs</span>
                                <Badge variant="outline" className="text-[10px] h-4 px-1">
                                  {Math.round(monthUtilization * 100)}%
                                </Badge>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No roles defined for the selected firm
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="projects">
              {roleAllocations.length > 0 ? (
                <div className="space-y-8">
                  {roleAllocations.map(role => (
                    <div key={role.id} className="space-y-3">
                      <h3 className="font-medium text-lg">{role.name}</h3>
                      
                      {role.items.length > 0 ? (
                        <div className="space-y-3">
                          {role.items.map(item => (
                            <div key={`${item.type}-${item.id}`} className="flex items-center p-3 rounded-lg border">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.title}</span>
                                  <Badge variant="outline" className="capitalize">{item.type}</Badge>
                                  {item.coefficient < 1 && (
                                    <Badge variant="secondary">
                                      {Math.round(item.coefficient * 100)}% probability
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                                  <span>{item.clientName}</span>
                                  <span>•</span>
                                  <span>{Math.round(item.hours * item.coefficient)} weighted hours</span>
                                  <span>•</span>
                                  <span className="capitalize">{item.status}</span>
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm font-medium">{Math.round(item.hours)} actual hours</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(item.startDate, "MMM d")} - {item.endDate ? format(item.endDate, "MMM d") : "ongoing"}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-muted-foreground text-sm p-4 bg-muted/20 rounded-lg">
                          No projects or proposals assigned to this role
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No roles defined for the selected firm
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}