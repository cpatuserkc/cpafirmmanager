import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { SeasonCalendar } from "@/components/season-planner/SeasonCalendar";
import { ResourceAllocation } from "@/components/season-planner/ResourceAllocation";
import { ProjectTimeline } from "@/components/season-planner/ProjectTimeline";
import { SeasonFilters } from "@/components/season-planner/SeasonFilters";
import { apiRequest } from "@/lib/queryClient";

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
  const [activeTab, setActiveTab] = useState("calendar");
  
  // Set default dates - start with current month, end 6 months later
  const today = new Date();
  const sixMonthsLater = new Date();
  sixMonthsLater.setMonth(today.getMonth() + 6);
  
  const [filters, setFilters] = useState<SeasonFiltersState>({
    firmId: user?.id,
    startDate: today,
    endDate: sixMonthsLater,
    professionalRoleIds: [],
    serviceCategories: [],
    includeProposals: true,
    includeProjects: true,
    includeDeadlines: true
  });

  const { data: firms } = useQuery({
    queryKey: ['/api/firms'],
    enabled: !!user
  });

  const { data: seasonData, isLoading } = useQuery({
    queryKey: ['/api/season-planner', filters],
    queryFn: async () => {
      return apiRequest('/api/season-planner', {
        method: 'POST',
        data: filters
      });
    },
    enabled: !!user
  });

  const { data: optimizationSuggestions } = useQuery({
    queryKey: ['/api/season-planner/optimize', filters],
    queryFn: async () => {
      return apiRequest('/api/season-planner/optimize', {
        method: 'POST',
        data: filters
      });
    },
    enabled: !!user && !!seasonData
  });

  const handleFilterChange = (newFilters: Partial<SeasonFiltersState>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Season Planner</h1>
          <p className="text-muted-foreground mt-1">
            Plan your tax seasons, optimize resources, and balance your workload
          </p>
        </div>
      </div>

      <SeasonFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        firms={firms || []}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          <TabsTrigger value="resources">Resource Allocation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Season Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              {seasonData && (
                <SeasonCalendar
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  projects={filters.includeProjects ? seasonData.projects : []}
                  proposals={filters.includeProposals ? seasonData.proposals : []}
                  deadlines={filters.includeDeadlines ? seasonData.deadlines : []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {seasonData && (
                <ProjectTimeline
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  projects={filters.includeProjects ? seasonData.projects : []}
                  proposals={filters.includeProposals ? seasonData.proposals : []}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Resource Allocation</CardTitle>
            </CardHeader>
            <CardContent>
              {seasonData && (
                <ResourceAllocation
                  startDate={filters.startDate}
                  endDate={filters.endDate}
                  projects={filters.includeProjects ? seasonData.projects : []}
                  proposals={filters.includeProposals ? seasonData.proposals : []}
                  firmId={filters.firmId}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {optimizationSuggestions && optimizationSuggestions.length > 0 && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle>Optimization Suggestions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {optimizationSuggestions.map((suggestion: string, index: number) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}