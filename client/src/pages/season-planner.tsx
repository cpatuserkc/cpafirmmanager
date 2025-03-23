import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/App";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SeasonCalendar } from "@/components/season-planner/SeasonCalendar";
import { ResourceAllocation } from "@/components/season-planner/ResourceAllocation";
import { ProjectTimeline } from "@/components/season-planner/ProjectTimeline";
import { SeasonFilters } from "@/components/season-planner/SeasonFilters";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";

export interface SeasonFiltersState {
  firmId?: number;
  startDate: Date;
  endDate: Date;
  professionalRoleIds: number[];
  serviceCategories: string[];
  includeProposals: boolean;
  includeProjects: boolean;
  includeDeadlines: boolean;
}

export default function SeasonPlannerPage() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState("calendar");
  const [filters, setFilters] = useState<SeasonFiltersState>({
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // Default to 3 months view
    professionalRoleIds: [],
    serviceCategories: [],
    includeProposals: true,
    includeProjects: true,
    includeDeadlines: true,
  });

  // Fetch the user's firms
  const { data: userFirms, isLoading: firmsLoading } = useQuery({
    queryKey: ['/api/firms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`/api/firms?userId=${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch firms');
      return response.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    // Set the first firm as default if available
    if (userFirms && userFirms.length > 0 && !filters.firmId) {
      setFilters(prev => ({ ...prev, firmId: userFirms[0].id }));
    }
  }, [userFirms]);

  // Fetch season data based on filters
  const { data: seasonData, isLoading: seasonLoading } = useQuery({
    queryKey: ['/api/season-planner', filters],
    queryFn: async () => {
      if (!filters.firmId) return { projects: [], proposals: [], deadlines: [] };
      
      const params = new URLSearchParams();
      params.append('firmId', String(filters.firmId));
      params.append('startDate', filters.startDate.toISOString());
      params.append('endDate', filters.endDate.toISOString());
      
      if (filters.professionalRoleIds.length > 0) {
        filters.professionalRoleIds.forEach(id => 
          params.append('roleIds', String(id))
        );
      }
      
      if (filters.serviceCategories.length > 0) {
        filters.serviceCategories.forEach(category => 
          params.append('categories', category)
        );
      }
      
      params.append('includeProposals', String(filters.includeProposals));
      params.append('includeProjects', String(filters.includeProjects));
      params.append('includeDeadlines', String(filters.includeDeadlines));
      
      const response = await fetch(`/api/season-planner?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch season planner data');
      return response.json();
    },
    enabled: !!filters.firmId,
  });

  const handleFilterChange = (newFilters: Partial<SeasonFiltersState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleGeneratePlan = async () => {
    try {
      const response = await fetch('/api/season-planner/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          firmId: filters.firmId,
          startDate: filters.startDate,
          endDate: filters.endDate,
          // Add other necessary parameters
        }),
      });
      
      if (!response.ok) throw new Error('Failed to generate plan');
      
      const result = await response.json();
      toast({
        title: 'Plan Generated',
        description: 'The season plan has been generated successfully.',
      });
      
      // Refresh the data
      // This will trigger the useQuery to refetch with updated data
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate the season plan.',
        variant: 'destructive',
      });
    }
  };

  if (firmsLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plot Your Season</h1>
          <p className="text-muted-foreground">
            Plan your projects, allocate resources, and visualize your upcoming work.
          </p>
        </div>
        <Button onClick={handleGeneratePlan}>Generate Optimal Plan</Button>
      </div>

      <Card className="mb-6">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">Season Parameters</CardTitle>
          <CardDescription>
            Adjust the date range, filter by roles or services, and select what to include in your plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SeasonFilters 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            firms={userFirms || []}
          />
        </CardContent>
      </Card>

      <Tabs value={activeView} onValueChange={setActiveView} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="timeline">Project Timeline</TabsTrigger>
          <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-0">
          {seasonLoading ? (
            <LoadingSpinner />
          ) : (
            <SeasonCalendar 
              startDate={filters.startDate}
              endDate={filters.endDate}
              projects={seasonData?.projects || []}
              proposals={filters.includeProposals ? (seasonData?.proposals || []) : []}
              deadlines={filters.includeDeadlines ? (seasonData?.deadlines || []) : []}
            />
          )}
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-0">
          {seasonLoading ? (
            <LoadingSpinner />
          ) : (
            <ProjectTimeline 
              startDate={filters.startDate}
              endDate={filters.endDate}
              projects={seasonData?.projects || []}
              proposals={filters.includeProposals ? (seasonData?.proposals || []) : []}
            />
          )}
        </TabsContent>
        
        <TabsContent value="resources" className="mt-0">
          {seasonLoading ? (
            <LoadingSpinner />
          ) : (
            <ResourceAllocation 
              startDate={filters.startDate}
              endDate={filters.endDate}
              projects={seasonData?.projects || []}
              proposals={filters.includeProposals ? (seasonData?.proposals || []) : []}
              firmId={filters.firmId}
            />
          )}
        </TabsContent>
      </Tabs>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Optimization Suggestions</CardTitle>
          <CardDescription>
            Recommendations to optimize your staffing and project scheduling
          </CardDescription>
        </CardHeader>
        <CardContent>
          {seasonLoading ? (
            <LoadingSpinner />
          ) : seasonData && seasonData.suggestions ? (
            <div className="space-y-4">
              {seasonData.suggestions.map((suggestion: any, index: number) => (
                <div key={index} className="p-4 border rounded-md">
                  <h3 className="font-medium">{suggestion.title}</h3>
                  <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                  {suggestion.actionable && (
                    <Button size="sm" variant="outline" className="mt-2">Apply</Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No optimization suggestions available. Generate a plan to see recommendations.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}