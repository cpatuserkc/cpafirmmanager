import { useMemo, useState } from "react";
import { format, isSameMonth, isToday, parseISO, isSameDay, addDays } from "date-fns";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarEvent {
  id: number;
  title: string;
  startDate: Date;
  endDate?: Date;
  type: 'project' | 'proposal' | 'deadline';
  status?: string;
  hours?: number;
  clientName?: string;
  color?: string;
}

interface SeasonCalendarProps {
  startDate: Date;
  endDate: Date;
  projects: any[];
  proposals: any[];
  deadlines: any[];
}

export function SeasonCalendar({ startDate, endDate, projects, proposals, deadlines }: SeasonCalendarProps) {
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null);
  
  // Get the months to display
  const months = useMemo(() => {
    const result = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      result.push(new Date(currentDate));
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }
    
    return result;
  }, [startDate, endDate]);
  
  // Generate calendar data
  const calendarData = useMemo(() => {
    return months.map(month => {
      const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
      const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const startDay = monthStart.getDay(); // 0-6, 0 is Sunday
      
      const days = [];
      
      // Add empty cells for days before the first of the month
      for (let i = 0; i < startDay; i++) {
        days.push({ date: null, events: [] });
      }
      
      // Add days in the month
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const date = new Date(month.getFullYear(), month.getMonth(), day);
        days.push({
          date,
          events: getEventsForDay(date)
        });
      }
      
      return {
        month,
        days
      };
    });
  }, [months, projects, proposals, deadlines]);
  
  // Generate days for a specific month
  function generateDaysForMonth(monthStart: Date, monthEnd: Date) {
    const startDay = monthStart.getDay(); // 0-6, 0 is Sunday
    const days = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Add days in the month
    for (let day = 1; day <= monthEnd.getDate(); day++) {
      days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
    }
    
    return days;
  }
  
  // Check if a date is within tax season
  function isTaxSeason(date: Date) {
    // Tax season: January 1 - April 15, August 15 - October 15
    const month = date.getMonth(); // 0-11
    const day = date.getDate();
    
    if ((month === 0 || month === 1 || month === 2) || (month === 3 && day <= 15)) {
      return true; // January - April 15
    }
    
    if ((month === 7 && day >= 15) || month === 8 || (month === 9 && day <= 15)) {
      return true; // August 15 - October 15
    }
    
    return false;
  }
  
  // Get events for a specific day
  function getEventsForDay(date: Date) {
    const events: CalendarEvent[] = [];
    
    // Add projects
    projects.forEach((project) => {
      if (!project.startDate) return;
      
      const projectStartDate = new Date(project.startDate);
      const projectEndDate = project.endDate ? new Date(project.endDate) : addDays(projectStartDate, 30);
      
      if (
        isSameDay(date, projectStartDate) || 
        isSameDay(date, projectEndDate) || 
        (date > projectStartDate && date < projectEndDate)
      ) {
        const isStartOrEnd = isSameDay(date, projectStartDate) || isSameDay(date, projectEndDate);
        
        events.push({
          id: project.id,
          title: project.name,
          startDate: projectStartDate,
          endDate: projectEndDate,
          type: 'project',
          status: project.status,
          hours: project.estimatedHours,
          clientName: project.clientName,
          color: '#0ea5e9' // blue
        });
      }
    });
    
    // Add proposals
    proposals.forEach((proposal) => {
      if (!proposal.estimatedStartDate) return;
      
      const proposalStartDate = new Date(proposal.estimatedStartDate);
      const proposalEndDate = proposal.estimatedEndDate 
        ? new Date(proposal.estimatedEndDate) 
        : addDays(proposalStartDate, 30);
      
      if (
        isSameDay(date, proposalStartDate) || 
        isSameDay(date, proposalEndDate) || 
        (date > proposalStartDate && date < proposalEndDate)
      ) {
        const isStartOrEnd = isSameDay(date, proposalStartDate) || isSameDay(date, proposalEndDate);
        
        events.push({
          id: proposal.id,
          title: proposal.title,
          startDate: proposalStartDate,
          endDate: proposalEndDate,
          type: 'proposal',
          status: proposal.status,
          hours: proposal.estimatedHours,
          clientName: proposal.clientCompanyName,
          color: '#8b5cf6' // purple
        });
      }
    });
    
    // Add deadlines
    deadlines.forEach((deadline) => {
      if (!deadline.dueDate) return;
      
      const deadlineDate = new Date(deadline.dueDate);
      
      if (isSameDay(date, deadlineDate)) {
        events.push({
          id: deadline.id,
          title: deadline.title,
          startDate: deadlineDate,
          type: 'deadline',
          clientName: deadline.clientCompanyName,
          color: '#ef4444' // red
        });
      }
    });
    
    return events;
  }
  
  return (
    <div className="space-y-6">
      {/* Calendar view */}
      {calendarData.map(({ month, days }) => (
        <Card key={month.toString()} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">
              {format(month, 'MMMM yyyy')}
              {isTaxSeason(month) && (
                <Badge variant="default" className="ml-2 text-xs">Tax Season</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-muted-foreground p-1"
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                if (!day.date) {
                  return <div key={`empty-${i}`} className="aspect-square" />;
                }
                
                const date = day.date;
                const isHighlighted = highlightedDate ? isSameDay(date, highlightedDate) : false;
                const isTaxSeasonDay = isTaxSeason(date);
                
                return (
                  <div 
                    key={date.toString()}
                    className={`
                      relative aspect-square p-1 border rounded-md overflow-hidden flex flex-col
                      ${isToday(date) ? 'border-primary' : 'border-border'}
                      ${isHighlighted ? 'bg-accent' : ''}
                      ${isTaxSeasonDay ? 'bg-yellow-50 dark:bg-yellow-950/10' : ''}
                    `}
                    onMouseEnter={() => setHighlightedDate(date)}
                    onMouseLeave={() => setHighlightedDate(null)}
                  >
                    <div className="text-xs font-medium">
                      {format(date, 'd')}
                    </div>
                    
                    <div className="flex flex-col gap-0.5 mt-0.5 overflow-hidden flex-1">
                      {day.events.map((event, index) => (
                        <TooltipProvider key={`${event.type}-${event.id}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className={`
                                  text-xs truncate rounded px-1 flex items-center
                                  ${event.type === 'deadline' ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' : 
                                    event.type === 'project' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 
                                    'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'}
                                `}
                                style={{ fontSize: '0.65rem' }}
                              >
                                <span className="truncate flex-1">
                                  {event.title}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" align="start" className="max-w-[250px]">
                              <div className="space-y-1.5">
                                <div className="font-medium">{event.title}</div>
                                {event.status && (
                                  <div className="flex items-center gap-1">
                                    <span>
                                      {format(event.startDate, 'MMM d')} - 
                                      {event.endDate && format(event.endDate, ' MMM d')}
                                    </span>
                                    <Badge variant={
                                      event.status === 'completed' ? 'default' :
                                      event.status === 'pending' ? 'secondary' : 
                                      'outline'
                                    } className="ml-2 text-[10px]">
                                      {event.status}
                                    </Badge>
                                  </div>
                                )}
                                {event.clientName && (
                                  <div className="text-xs text-muted-foreground">{event.clientName}</div>
                                )}
                                {event.hours ? (
                                  <div className="text-xs">{event.hours} hours</div>
                                ) : event.type === 'deadline' && (
                                  <div className="text-xs flex items-center gap-1 text-red-500">
                                    <AlertCircle className="h-3 w-3" />
                                    <span>Due on {format(event.startDate, 'MMM d, yyyy')}</span>
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}