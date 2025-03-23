import { useMemo } from "react";
import { addDays, startOfMonth, endOfMonth, format, isSameDay, isWithinInterval, getDay, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertCircle, Calendar as CalendarIcon, Check, Clock } from "lucide-react";

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
  // Convert all items to a unified calendar event format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
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
    
    const mappedDeadlines = deadlines.map(deadline => ({
      id: deadline.id,
      title: deadline.title,
      startDate: new Date(deadline.dueDate),
      type: 'deadline' as const,
      status: deadline.isCompleted ? 'completed' : 'pending',
      clientName: deadline.clientName,
      color: '#f43f5e' // red
    }));
    
    return [...mappedProjects, ...mappedProposals, ...mappedDeadlines];
  }, [projects, proposals, deadlines]);
  
  // Generate months between start and end date
  const months = useMemo(() => {
    const result = [];
    let currentDate = new Date(startDate);
    currentDate.setDate(1); // Start at the beginning of the month
    
    while (currentDate <= endDate) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      result.push({
        title: format(currentDate, 'MMMM yyyy'),
        days: generateDaysForMonth(monthStart, monthEnd),
        startDate: monthStart,
        endDate: monthEnd
      });
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return result;
  }, [startDate, endDate]);
  
  // Helper function to generate days for a month
  function generateDaysForMonth(monthStart: Date, monthEnd: Date) {
    const days = [];
    let day = monthStart;
    
    // Calculate offset for the first day of the month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOffset = getDay(monthStart);
    
    // Add empty cells for days before the start of the month
    for (let i = 0; i < firstDayOffset; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }
    
    // Add actual days of the month
    while (day <= monthEnd) {
      days.push({ 
        date: new Date(day), 
        isCurrentMonth: true,
        isToday: isSameDay(day, new Date()),
        isTaxSeason: isTaxSeason(day)
      });
      day = addDays(day, 1);
    }
    
    return days;
  }
  
  // Function to determine if a date is in tax season
  function isTaxSeason(date: Date) {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Spring tax season: January 15 - April 15
    const isSpringTaxSeason = 
      (month === 0 && day >= 15) || // Jan 15+
      month === 1 ||                // All of Feb
      month === 2 ||                // All of Mar
      (month === 3 && day <= 15);   // Apr 1-15
    
    // Fall tax season: Aug 15 - Oct 15
    const isFallTaxSeason = 
      (month === 7 && day >= 15) || // Aug 15+
      month === 8 ||                // All of Sep
      (month === 9 && day <= 15);   // Oct 1-15
    
    return isSpringTaxSeason || isFallTaxSeason;
  }
  
  // Get events for a specific day
  function getEventsForDay(date: Date) {
    if (!date) return [];
    
    return calendarEvents.filter(event => {
      // For deadlines (which are single-day events)
      if (event.type === 'deadline') {
        return isSameDay(event.startDate, date);
      }
      
      // For projects and proposals (which span multiple days)
      if (event.endDate) {
        return isWithinInterval(date, { start: event.startDate, end: event.endDate });
      }
      
      return isSameDay(event.startDate, date);
    });
  }
  
  return (
    <div className="space-y-10">
      {months.map((month, monthIndex) => (
        <Card key={monthIndex} className="overflow-hidden">
          <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>{month.title}</span>
              <div className="flex items-center gap-3 text-sm font-normal">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                  <span>Projects</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                  <span>Proposals</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#f43f5e]"></div>
                  <span>Deadlines</span>
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                <div 
                  key={i} 
                  className="text-center py-2 font-medium text-sm border-b"
                >
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {month.days.map((day, dayIndex) => {
                // Skip rendering for null dates (empty cells)
                if (!day.date) {
                  return <div key={dayIndex} className="h-24 border-b border-r"></div>;
                }
                
                const events = getEventsForDay(day.date);
                const isWeekend = getDay(day.date) === 0 || getDay(day.date) === 6;
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`h-28 border-b border-r relative p-1 ${isWeekend ? 'bg-muted/10' : ''} ${day.isTaxSeason ? 'bg-amber-50/50' : ''} ${day.isToday ? 'bg-blue-50/50' : ''}`}
                  >
                    <div className="text-right text-sm mb-1">
                      <span className={day.isToday ? 'h-5 w-5 rounded-full bg-primary text-white inline-flex items-center justify-center' : ''}>
                        {format(day.date, 'd')}
                      </span>
                    </div>
                    
                    {day.isTaxSeason && (
                      <div className="absolute top-1 left-1">
                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                          Tax Season
                        </Badge>
                      </div>
                    )}
                    
                    <div className="overflow-y-auto max-h-[75px] space-y-1">
                      {events.map((event, eventIndex) => (
                        <TooltipProvider key={`${event.type}-${event.id}-${eventIndex}`}>
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div 
                                className={`text-xs p-1 rounded flex items-center gap-1 truncate ${
                                  isSameDay(event.startDate, day.date) ? 'border-l-2' : ''
                                }`}
                                style={{ 
                                  backgroundColor: `${event.color}10`,
                                  borderLeftColor: isSameDay(event.startDate, day.date) ? event.color : 'transparent' 
                                }}
                              >
                                {event.type === 'project' ? (
                                  <CalendarIcon className="h-3 w-3 flex-shrink-0" style={{ color: event.color }} />
                                ) : event.type === 'proposal' ? (
                                  <Check className="h-3 w-3 flex-shrink-0" style={{ color: event.color }} />
                                ) : (
                                  <Clock className="h-3 w-3 flex-shrink-0 text-red-500" />
                                )}
                                <span className="truncate">{event.title}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <div className="space-y-1.5">
                                <div className="font-medium">{event.title}</div>
                                {event.type !== 'deadline' && (
                                  <div className="text-xs flex justify-between">
                                    <span>
                                      {format(event.startDate, 'MMM d')} - 
                                      {event.endDate && format(event.endDate, ' MMM d')}
                                    </span>
                                    <Badge variant={
                                      event.status === 'completed' ? 'default' :
                                      event.status === 'pending' ? 'secondary' : 
                                      'warning'
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