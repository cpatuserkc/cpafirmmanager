import { useMemo } from "react";
import { differenceInDays, addDays, format, isSameDay, isWithinInterval } from "date-fns";
import { useLocation } from "wouter";
import { Calendar, Check, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [, navigate] = useLocation();
  
  // Convert all items to a unified format for the timeline
  const timelineItems: TimelineItem[] = useMemo(() => {
    const mappedProjects = projects.map(project => ({
      id: project.id,
      title: project.name,
      startDate: new Date(project.startDate || project.createdAt),
      endDate: project.endDate ? new Date(project.endDate) : addDays(new Date(project.startDate || project.createdAt), 30),
      type: 'project' as const,
      status: project.status,
      hours: parseFloat(project.estimatedHours || '0'),
      clientName: project.clientName,
      color: '#3b82f6' // blue
    }));
    
    const mappedProposals = proposals.map(proposal => ({
      id: proposal.id,
      title: proposal.title,
      startDate: new Date(proposal.estimatedStartDate || proposal.createdAt),
      endDate: proposal.estimatedEndDate ? new Date(proposal.estimatedEndDate) : addDays(new Date(proposal.estimatedStartDate || proposal.createdAt), 30),
      type: 'proposal' as const,
      status: proposal.status,
      hours: parseFloat(proposal.estimatedHours || '0'),
      clientName: proposal.clientName,
      color: '#10b981' // green
    }));
    
    return [...mappedProjects, ...mappedProposals];
  }, [projects, proposals]);
  
  // Sort items by start date
  const sortedItems = useMemo(() => {
    return [...timelineItems].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [timelineItems]);
  
  // Calculate the total duration in days
  const totalDays = useMemo(() => {
    return differenceInDays(endDate, startDate) + 1;
  }, [startDate, endDate]);
  
  // Group items by month
  const itemsByMonth = useMemo(() => {
    const groupedItems: { [key: string]: TimelineItem[] } = {};
    
    sortedItems.forEach(item => {
      const monthKey = format(item.startDate, 'yyyy-MM');
      if (!groupedItems[monthKey]) {
        groupedItems[monthKey] = [];
      }
      groupedItems[monthKey].push(item);
    });
    
    return Object.entries(groupedItems).map(([key, items]) => ({
      month: format(new Date(items[0].startDate), 'MMMM yyyy'),
      items
    }));
  }, [sortedItems]);
  
  // Calculate dates for visual markers in the timeline
  const dateMarkers = useMemo(() => {
    const markers = [];
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      if (currentDate.getDate() === 1 || isSameDay(currentDate, startDate)) {
        markers.push({
          date: new Date(currentDate),
          label: format(currentDate, 'MMM d')
        });
      }
      currentDate = addDays(currentDate, 1);
    }
    markers.push({
      date: new Date(endDate),
      label: format(endDate, 'MMM d')
    });
    return markers;
  }, [startDate, endDate]);
  
  // Calculate position and width for timeline items
  const calculateItemStyle = (item: TimelineItem) => {
    const itemStartDate = new Date(Math.max(item.startDate.getTime(), startDate.getTime()));
    const itemEndDate = item.endDate 
      ? new Date(Math.min(item.endDate.getTime(), endDate.getTime()))
      : new Date(Math.min(addDays(item.startDate, 30).getTime(), endDate.getTime()));
    
    const startOffset = differenceInDays(itemStartDate, startDate);
    const duration = differenceInDays(itemEndDate, itemStartDate) + 1;
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    
    return {
      left: `${leftPercent}%`,
      width: `${widthPercent}%`,
      backgroundColor: `${item.color}20`,
      borderLeft: `3px solid ${item.color}`
    };
  };
  
  // Function to determine if a date is today
  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };
  
  // Calculate where "today" marker should be positioned
  const todayMarkerPosition = useMemo(() => {
    const today = new Date();
    if (isWithinInterval(today, { start: startDate, end: endDate })) {
      const daysSinceStart = differenceInDays(today, startDate);
      return {
        left: `${(daysSinceStart / totalDays) * 100}%`,
        display: 'block'
      };
    }
    return { display: 'none' };
  }, [startDate, endDate, totalDays]);
  
  return (
    <div className="space-y-8">
      <div className="relative border rounded-lg p-4 bg-background">
        {/* Date markers */}
        <div className="flex justify-between mb-2 relative">
          {dateMarkers.map((marker, index) => (
            <span 
              key={index}
              className="text-xs text-muted-foreground absolute"
              style={{ 
                left: `${(differenceInDays(marker.date, startDate) / totalDays) * 100}%`,
                transform: index === 0 ? 'translateX(0)' : index === dateMarkers.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)'
              }}
            >
              {marker.label}
            </span>
          ))}
        </div>
        
        {/* Timeline ruler */}
        <div className="h-1 bg-muted mb-6 mt-6 relative">
          {/* Today marker */}
          <div 
            className="absolute top-0 w-0.5 h-[20px] bg-primary -translate-y-1/2"
            style={todayMarkerPosition}
          >
            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-xs font-medium text-primary">
              Today
            </span>
          </div>
        </div>
        
        {/* Timeline items */}
        <div className="space-y-6 mt-8">
          {sortedItems.map(item => (
            <div key={`${item.id}-${item.type}`} className="relative h-16 group">
              <div
                className="absolute h-14 rounded-md border overflow-hidden cursor-pointer"
                style={calculateItemStyle(item)}
                onClick={() => navigate(`/${item.type}s/${item.id}`)}
              >
                <div className="p-2 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate max-w-[150px] group-hover:max-w-full transition-all">
                        {item.title}
                      </span>
                      <Badge 
                        variant="outline" 
                        className="text-[10px] h-4 px-1 capitalize"
                      >
                        {item.type}
                      </Badge>
                    </div>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge 
                            variant={
                              item.status === 'completed' ? 'success' :
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
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.clientName}</span>
                    <span>{item.hours} hrs</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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