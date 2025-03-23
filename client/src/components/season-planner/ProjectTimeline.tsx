import { useMemo } from 'react';
import { addDays, differenceInDays, format, isBefore } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

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
  // Calculate timeline scale
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  // Format data for timeline display
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [];
    
    // Add projects
    projects.forEach(project => {
      // Skip projects without start or end dates
      if (!project.startDate) return;
      
      const projectEndDate = project.endDate ? new Date(project.endDate) : 
        addDays(new Date(project.startDate), 
          Math.ceil(parseFloat(project.estimatedHours || '0') / 8)); // Assume 8 hours/day
      
      items.push({
        id: project.id,
        title: project.name,
        startDate: new Date(project.startDate),
        endDate: projectEndDate,
        type: 'project',
        status: project.status || 'active',
        hours: parseFloat(project.estimatedHours || '0'),
        clientName: project.clientCompanyName || 'Unknown Client',
        color: '#4338ca' // indigo
      });
    });
    
    // Add proposals (only if they have estimated start dates)
    proposals.forEach(proposal => {
      if (!proposal.estimatedStartDate) return;
      
      const proposalEndDate = proposal.estimatedEndDate ? new Date(proposal.estimatedEndDate) : 
        addDays(new Date(proposal.estimatedStartDate), 
          Math.ceil(parseFloat(proposal.estimatedHours || '0') / 8)); // Assume 8 hours/day
      
      items.push({
        id: proposal.id,
        title: proposal.title,
        startDate: new Date(proposal.estimatedStartDate),
        endDate: proposalEndDate,
        type: 'proposal',
        status: proposal.status || 'pending',
        hours: parseFloat(proposal.estimatedHours || '0'),
        clientName: proposal.clientCompanyName || 'Unknown Client',
        color: '#059669' // emerald
      });
    });
    
    // Sort by start date
    return items.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }, [projects, proposals]);

  // Calculate position and width for timeline items
  const positionedItems = useMemo(() => {
    return timelineItems.map(item => {
      const itemStartDay = Math.max(0, differenceInDays(item.startDate, startDate));
      const itemEndDay = item.endDate 
        ? Math.min(totalDays, differenceInDays(item.endDate, startDate))
        : itemStartDay + 1;
      
      const startPercent = (itemStartDay / totalDays) * 100;
      const widthPercent = ((itemEndDay - itemStartDay) / totalDays) * 100;
      const isPast = isBefore(item.endDate || item.startDate, new Date());
      
      return {
        ...item,
        startPercent,
        widthPercent,
        isPast
      };
    });
  }, [timelineItems, startDate, totalDays]);

  // Generate month labels for the timeline
  const monthLabels = useMemo(() => {
    const labels = [];
    let currentDate = new Date(startDate);
    const endDateValue = endDate.getTime();
    
    while (currentDate.getTime() <= endDateValue) {
      const month = currentDate.getMonth();
      const firstOfMonth = new Date(currentDate.getFullYear(), month, 1);
      
      // Only add if this is a new month
      if (currentDate.getDate() === 1 || labels.length === 0) {
        const daysSinceStart = differenceInDays(firstOfMonth, startDate);
        const positionPercent = (daysSinceStart / totalDays) * 100;
        
        labels.push({
          month: format(currentDate, 'MMM'),
          position: Math.max(0, positionPercent)
        });
      }
      
      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return labels;
  }, [startDate, endDate, totalDays]);

  // Group timeline items by client for better organization
  const clientGroups = useMemo(() => {
    const groups: { [key: string]: typeof positionedItems } = {};
    
    positionedItems.forEach(item => {
      if (!groups[item.clientName]) {
        groups[item.clientName] = [];
      }
      groups[item.clientName].push(item);
    });
    
    return Object.entries(groups);
  }, [positionedItems]);

  return (
    <Card>
      <CardContent className="p-4">
        <h2 className="text-xl font-semibold mb-4">Project Timeline</h2>
        
        {/* Month labels */}
        <div className="relative h-8 mb-2 border-b">
          {monthLabels.map((label, i) => (
            <div 
              key={i}
              className="absolute top-0 text-xs font-medium"
              style={{ left: `${label.position}%` }}
            >
              {label.month}
            </div>
          ))}
        </div>
        
        {clientGroups.length > 0 ? (
          <div className="space-y-8">
            {clientGroups.map(([clientName, items], groupIndex) => (
              <div key={groupIndex} className="space-y-2">
                <h3 className="font-medium text-sm">{clientName}</h3>
                
                <div className="relative">
                  {/* Timeline grid lines */}
                  <div className="absolute inset-0 grid grid-cols-12 gap-0 pointer-events-none">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div key={i} className="h-full border-l border-gray-200" />
                    ))}
                  </div>
                  
                  {/* Timeline items */}
                  <div className="relative space-y-2 py-1">
                    {items.map((item) => (
                      <TooltipProvider key={`${item.type}-${item.id}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={`
                                absolute h-8 rounded-md text-xs flex items-center font-medium text-white px-2 cursor-pointer
                                ${item.isPast ? 'opacity-60' : 'opacity-100'}
                              `}
                              style={{ 
                                left: `${item.startPercent}%`, 
                                width: `${Math.max(3, item.widthPercent)}%`,
                                backgroundColor: item.color
                              }}
                            >
                              <span className="truncate">{item.title}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div className="font-medium">{item.title}</div>
                              <div className="text-xs">
                                <div>{item.clientName}</div>
                                <div>
                                  {format(item.startDate, 'MMM d')} - 
                                  {item.endDate ? format(item.endDate, ' MMM d') : ' (1 day)'}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge 
                                    variant={item.type === 'project' ? 'default' : 'outline'}
                                    className="text-[10px] h-4"
                                  >
                                    {item.type}
                                  </Badge>
                                  <Badge 
                                    variant="secondary"
                                    className="text-[10px] h-4 capitalize"
                                  >
                                    {item.status}
                                  </Badge>
                                </div>
                                <div className="mt-1">{item.hours} hours</div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No projects or proposals with dates in the selected time range
          </div>
        )}
      </CardContent>
    </Card>
  );
}