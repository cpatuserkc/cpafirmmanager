import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, FilterIcon } from "lucide-react";
import { AnalyticsFilters, TimePeriod } from "@/hooks/use-analytics-data";

interface FilterBarProps {
  filters: AnalyticsFilters;
  onFilterChange: (filters: AnalyticsFilters) => void;
  serviceCategories?: { id: string; name: string }[];
  professionalRoles?: { id: number; name: string }[];
}

export function FilterBar({ 
  filters, 
  onFilterChange, 
  serviceCategories = [], 
  professionalRoles = [] 
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(filters.startDate);
  const [endDate, setEndDate] = useState<Date | undefined>(filters.endDate);
  const [period, setPeriod] = useState<TimePeriod>(filters.period || "month");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    filters.serviceCategories || []
  );
  const [selectedRoles, setSelectedRoles] = useState<number[]>(
    filters.professionalRoles || []
  );

  const handleApplyFilters = () => {
    onFilterChange({
      ...filters,
      startDate,
      endDate,
      period,
      serviceCategories: selectedCategories.length ? selectedCategories : undefined,
      professionalRoles: selectedRoles.length ? selectedRoles : undefined,
    });
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
      <div className="flex-1">
        <h2 className="text-xl font-semibold">Analytics Dashboard</h2>
      </div>
      
      <div className="flex gap-2 items-center">
        <Select 
          value={period} 
          onValueChange={(value) => {
            setPeriod(value as TimePeriod);
            onFilterChange({
              ...filters,
              period: value as TimePeriod
            });
          }}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Time Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="quarter">Quarterly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <FilterIcon size={16} />
              <span>Filters</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "MMM d, yyyy") : "Start Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "MMM d, yyyy") : "End Date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {serviceCategories.length > 0 && (
                <div className="space-y-2">
                  <Label>Service Categories</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {professionalRoles.length > 0 && (
                <div className="space-y-2">
                  <Label>Professional Roles</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      {professionalRoles.map(role => (
                        <SelectItem key={role.id} value={role.id.toString()}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                className="w-full" 
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}