import { useMemo } from "react";
import { format, addDays, differenceInDays, isAfter, isBefore, isToday } from "date-fns";
import { ArrowRight, Calendar, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface TimelineItem {
  id: number;
  title: string;
  startDate: Date;
  endDate: Date | null;
  type: 'project' | 'proposal';
  status: string;
  hours: number;
  clientName: string;
  color: string;
}

interface ProjectTimelineProps {
  startDate: Date;
  endDate: Date;
  projects: any[];
  proposals: any[];
}

export function ProjectTimeline({ startDate, endDate, projects, proposals }: ProjectTimelineProps) {
  const [navigate] = useLocation();
  
  // Calculate total days in range
  const daysInRange = differenceInDays(endDate, startDate) + 1;
  
  // Prepare timeline items from projects and proposals
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    
    // Add projects to timeline
    projects.forEach(project => {
      if (!project.startDate) return;
      
      const projectStartDate = new Date(project.startDate);
      const projectEndDate = project.endDate ? new Date(project.endDate) : addDays(projectStartDate, 30);
      
      // Only include if the project falls within our date range
      if (
        (isAfter(projectStartDate, startDate) || isBefore(projectStartDate, endDate)) ||
        (isAfter(projectEndDate, startDate) || isBefore(projectEndDate, endDate))
      ) {
        items.push({
          id: project.id,
          title: project.name,
          startDate: projectStartDate,
          endDate: projectEndDate,
          type: 'project',
          status: project.status || 'planned',
          hours: parseFloat(project.estimatedHours || '0'),
          clientName: project.clientName || 'No client',
          color: '#0ea5e9' // blue
        });
      }
    });
    
    // Add proposals to timeline
    proposals.forEach(proposal => {
      if (!proposal.estimatedStartDate) return;
      
      const proposalStartDate = new Date(proposal.estimatedStartDate);
      const proposalEndDate = proposal.estimatedEndDate 
        ? new Date(proposal.estimatedEndDate) 
        : addDays(proposalStartDate, 30);
      
      // Only include if the proposal falls within our date range
      if (
        (isAfter(proposalStartDate, startDate) || isBefore(proposalStartDate, endDate)) ||
        (isAfter(proposalEndDate, startDate) || isBefore(proposalEndDate, endDate))
      ) {
        items.push({
          id: proposal.id,
          title: proposal.title,
          startDate: proposalStartDate,
          endDate: proposalEndDate,
          type: 'proposal',
          status: proposal.status || 'draft',
          hours: parseFloat(proposal.estimatedHours || '0'),
          clientName: proposal.clientName || 'No client',
          color: '#8b5cf6' // purple
        });
      }
    });
    
    // Sort by start date
    return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [projects, proposals, startDate, endDate]);
  
  // Group timeline items by month
  const itemsByMonth = useMemo(() => {
    const result: { month: string; items: TimelineItem[] }[] = [];
    const monthMap = new Map<string, TimelineItem[]>();
    
    timelineItems.forEach(item => {
      const monthKey = format(item.startDate, 'MMMM yyyy');
      
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, []);
      }
      
      monthMap.get(monthKey)?.push(item);
    });
    
    // Convert map to array
    monthMap.forEach((items, month) => {
      result.push({ month, items });
    });
    
    return result;
  }, [timelineItems]);
  
  // Calculate position and width for timeline items
  const calculateItemStyle = (item: TimelineItem) => {
    // Calculate start position relative to the timeline
    const startDiff = Math.max(0, differenceInDays(item.startDate, startDate));
    const startPercent = (startDiff / daysInRange) * 100;
    
    // Calculate width based on duration
    const endDate = item.endDate || addDays(item.startDate, 14); // Default to 2 weeks if no end date
    const itemDuration = Math.min(
      differenceInDays(endDate, item.startDate) + 1,
      daysInRange - startDiff // Cap at the end of our timeline
    );
    const widthPercent = (itemDuration / daysInRange) * 100;
    
    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`,
      backgroundColor: `${item.color}20`, // Light version of the color
      borderColor: item.color
    };
  };
  
  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };
  
  return (
    <div className="space-y-6">
      {/* Timeline visualization */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Project & Proposal Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Date markers */}
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{format(startDate, 'MMM d, yyyy')}</span>
              <span>{format(endDate, 'MMM d, yyyy')}</span>
            </div>
            
            {/* Timeline container */}
            <div className="relative border rounded-lg p-4 mb-4">
              {/* Timeline ruler */}
              <div className="absolute left-0 right-0 h-1 bg-muted top-1/2 transform -translate-y-1/2"></div>
              
              {/* Today marker */}
              {isAfter(new Date(), startDate) && isBefore(new Date(), endDate) && (
                <div 
                  className="absolute top-0 bottom-0 w-px bg-primary z-10"
                  style={{ 
                    left: `${(differenceInDays(new Date(), startDate) / daysInRange) * 100}%`,
                  }}
                >
                  <div className="absolute top-0 -translate-x-1/2 -translate-y-full text-xs text-primary font-medium">
                    Today
                  </div>
                </div>
              )}
              
              {/* Timeline items */}
              {timelineItems.map((item, index) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="absolute transform -translate-y-1/2 h-10 rounded-md border border-solid flex items-center pl-2 pr-1 py-1 cursor-pointer transition-all hover:shadow-md"
                  style={calculateItemStyle(item)}
                  onClick={() => navigate(`/${item.type}s/${item.id}`)}
                >
                  <div className="w-full overflow-hidden">
                    <div className="flex items-center gap-1 truncate">
                      {item.type === 'project' ? (
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                      ) : (
                        <Check className="h-3 w-3 flex-shrink-0" />
                      )}
                      
                      <span className="text-xs font-medium truncate">{item.title}</span>
                      
                      <div className="flex-shrink-0">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge 
                                variant={
                                  item.status === 'completed' ? 'default' :
                                  item.status === 'in_progress' ? 'default' :
                                  item.status === 'draft' ? 'secondary' :
                                  'outline'
                                }
                                className="text-[10px] h-4 px-1 capitalize"
                              >
                                {item.status}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Status: {item.status}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.clientName}</span>
                      <span>{item.hours} hrs</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Timeline overview by month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Timeline Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {itemsByMonth.length > 0 ? (
            <div className="space-y-8">
              {itemsByMonth.map(({ month, items }) => (
                <div key={month} className="space-y-3">
                  <h3 className="text-md font-medium">{month}</h3>
                  
                  <div className="space-y-3">
                    {items.map(item => (
                      <div 
                        key={`${item.id}-${item.type}`}
                        className="flex items-center space-x-3"
                      >
                        <div 
                          className="flex-shrink-0 rounded-full p-1.5"
                          style={{ backgroundColor: `${item.color}20` }}
                        >
                          {item.type === 'project' ? (
                            <Calendar className="h-4 w-4" style={{ color: item.color }} />
                          ) : (
                            <Check className="h-4 w-4" style={{ color: item.color }} />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">
                                {item.title}
                              </span>
                              <Badge 
                                variant="outline" 
                                className="text-[10px] h-4 px-1 capitalize"
                              >
                                {item.status}
                              </Badge>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {item.hours} hrs
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                            <span>{item.clientName}</span>
                            <span className="h-1 w-1 rounded-full bg-muted"></span>
                            <span>
                              {format(item.startDate, 'MMM d')}
                              <ArrowRight className="inline-block h-3 w-3 mx-0.5" />
                              {item.endDate && format(item.endDate, 'MMM d')}
                            </span>
                          </div>
                          
                          <Progress
                            value={
                              item.status === 'completed' ? 100 :
                              item.status === 'in_progress' ? 50 :
                              item.status === 'pending' ? 10 :
                              0
                            }
                            className="h-1.5"
                          />
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0"
                          onClick={() => navigate(`/${item.type}s/${item.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No projects or proposals in the selected date range
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}