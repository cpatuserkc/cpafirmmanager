import { useState, useEffect, useMemo } from 'react';
import { addDays, format, isSameDay, isWithinInterval, startOfMonth, endOfMonth, getDay, startOfWeek, addWeeks, isSameMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [currentMonth, setCurrentMonth] = useState(new Date(startDate));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayEvents, setDayEvents] = useState<CalendarEvent[]>([]);

  // Transform data into calendar events
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];
    
    // Add projects
    projects.forEach(project => {
      events.push({
        id: project.id,
        title: project.name,
        startDate: new Date(project.startDate || new Date()),
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        type: 'project',
        status: project.status,
        hours: parseFloat(project.estimatedHours || '0'),
        clientName: project.clientCompanyName,
        color: '#4338ca' // indigo
      });
    });
    
    // Add proposals
    proposals.forEach(proposal => {
      events.push({
        id: proposal.id,
        title: proposal.title,
        startDate: new Date(proposal.createdAt || new Date()),
        endDate: proposal.expiryDate ? new Date(proposal.expiryDate) : undefined,
        type: 'proposal',
        status: proposal.status,
        hours: parseFloat(proposal.estimatedHours || '0'),
        clientName: proposal.clientCompanyName,
        color: '#059669' // emerald
      });
    });
    
    // Add deadlines
    deadlines.forEach(deadline => {
      events.push({
        id: deadline.id,
        title: deadline.title,
        startDate: new Date(deadline.dueDate),
        type: 'deadline',
        status: deadline.isCompleted ? 'completed' : 'pending',
        color: '#dc2626' // red
      });
    });
    
    return events;
  }, [projects, proposals, deadlines]);

  // Check if a date is within the tax season
  const isTaxSeason = (date: Date) => {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Primary tax season: Jan 15 - April 15
    if ((month === 0 && day >= 15) || month === 1 || month === 2 || (month === 3 && day <= 15)) {
      return true;
    }
    
    // Extension season: August 1 - October 15
    if ((month === 7 && day >= 1) || month === 8 || (month === 9 && day <= 15)) {
      return true;
    }
    
    return false;
  };

  // Get events for a specific day
  useEffect(() => {
    if (selectedDay) {
      const events = calendarEvents.filter(event => {
        if (event.endDate) {
          return isWithinInterval(selectedDay, { start: event.startDate, end: event.endDate });
        }
        return isSameDay(selectedDay, event.startDate);
      });
      setDayEvents(events);
    } else {
      setDayEvents([]);
    }
  }, [selectedDay, calendarEvents]);

  // Generate calendar days for the current month view
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    
    const days = [];
    let day = startDate;
    
    for (let i = 0; i < 42; i++) {
      // Get events for this day
      const dayEventsCount = calendarEvents.filter(event => {
        if (event.endDate) {
          return isWithinInterval(day, { start: event.startDate, end: event.endDate });
        }
        return isSameDay(day, event.startDate);
      }).length;

      // Calculate utilization for this day (placeholder for actual logic)
      // In real implementation, should be calculated based on capacity and scheduled hours
      const dayProjects = calendarEvents.filter(event => {
        if (event.type === 'project' && event.endDate) {
          return isWithinInterval(day, { start: event.startDate, end: event.endDate });
        }
        return event.type === 'project' && isSameDay(day, event.startDate);
      });
      
      const totalHours = dayProjects.reduce((sum, project) => sum + (project.hours || 0), 0);
      const utilization = Math.min(totalHours / 80, 1); // Assuming 80 hours capacity for demonstration
      
      days.push({
        date: day,
        isCurrentMonth: isSameMonth(day, monthStart),
        events: dayEventsCount,
        isTaxSeason: isTaxSeason(day),
        utilization
      });
      
      day = addDays(day, 1);
    }
    
    return days;
  }, [currentMonth, calendarEvents]);

  // Navigate to previous/next month
  const prevMonth = () => setCurrentMonth(addDays(startOfMonth(currentMonth), -1));
  const nextMonth = () => setCurrentMonth(addDays(endOfMonth(currentMonth), 1));

  return (
    <Card>
      <CardContent className="p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-px mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center font-medium text-sm py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-muted">
          {calendarDays.map((day, i) => (
            <TooltipProvider key={i}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={`
                      relative h-24 p-1 bg-card
                      ${!day.isCurrentMonth ? 'text-muted-foreground' : ''}
                      ${isSameDay(day.date, new Date()) ? 'border-2 border-primary' : ''}
                      ${day.isTaxSeason ? 'bg-amber-50 dark:bg-amber-950/20' : ''}
                      ${selectedDay && isSameDay(day.date, selectedDay) ? 'ring-2 ring-primary' : ''}
                      cursor-pointer hover:bg-muted/50
                    `}
                    onClick={() => setSelectedDay(day.date)}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium">{format(day.date, 'd')}</span>
                      {day.events > 0 && (
                        <span className="text-xs rounded-full bg-primary text-primary-foreground px-1.5 py-0.5">
                          {day.events}
                        </span>
                      )}
                    </div>
                    
                    {/* Utilization indicator */}
                    {day.utilization > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${
                            day.utilization > 0.8 ? 'bg-red-500' : 
                            day.utilization > 0.5 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${day.utilization * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{format(day.date, 'EEEE, MMMM d, yyyy')}</p>
                    {day.isTaxSeason && <p className="text-amber-500 dark:text-amber-400">Tax Season</p>}
                    <p>
                      Utilization: {Math.round(day.utilization * 100)}%
                      {day.utilization > 0.8 ? ' (Overbooked)' : 
                       day.utilization > 0.5 ? ' (Busy)' : ' (Available)'}
                    </p>
                    {day.events > 0 ? (
                      <p>{day.events} scheduled item{day.events !== 1 ? 's' : ''}</p>
                    ) : (
                      <p>No scheduled items</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        
        {/* Selected Day Events */}
        {selectedDay && dayEvents.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="font-medium mb-2">
              {format(selectedDay, 'EEEE, MMMM d, yyyy')}
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <div 
                  key={`${event.id}-${event.type}`} 
                  className="p-2 rounded-md text-sm"
                  style={{ backgroundColor: `${event.color}15`, borderLeft: `3px solid ${event.color}` }}
                >
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>{event.clientName}</div>
                    {event.hours && <div>{event.hours} hours</div>}
                    {event.type === 'deadline' && (
                      <div className={`${event.status === 'completed' ? 'text-green-500' : 'text-red-500'}`}>
                        {event.status === 'completed' ? 'Completed' : 'Pending'}
                      </div>
                    )}
                    {(event.type === 'project' || event.type === 'proposal') && (
                      <div className="capitalize">{event.status}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tax Season Legend */}
        <div className="mt-4 border-t pt-4 flex gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"></div>
            <span>Tax Season</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500"></div>
            <span>&lt;50% Utilization</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-amber-500"></div>
            <span>50-80% Utilization</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500"></div>
            <span>&gt;80% Utilization</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}