import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { format, startOfMonth, addMonths, endOfMonth, isBefore } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { SeasonFiltersState } from "@/pages/season-planner";

interface SeasonFiltersProps {
  filters: SeasonFiltersState;
  onFilterChange: (filters: Partial<SeasonFiltersState>) => void;
  firms: any[]; // Replace with proper type
}

export function SeasonFilters({ filters, onFilterChange, firms }: SeasonFiltersProps) {
  const [datePreset, setDatePreset] = useState<string>("tax-season");
  
  // Get professional roles
  const { data: professionalRoles = [] } = useQuery({
    queryKey: ['/api/professional-roles', filters.firmId],
    enabled: !!filters.firmId
  });
  
  // Get service categories
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services', filters.firmId],
    enabled: !!filters.firmId
  });
  
  // Extract unique categories from services
  const serviceCategories = services.length 
    ? [...new Set(services.map((s: any) => s.category))].filter(Boolean) 
    : [];
  
  // Handle preset date changes
  useEffect(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    if (datePreset === "tax-season") {
      // Tax season: January 1 to April 15
      if (currentMonth < 4) {
        // We're in tax season
        onFilterChange({
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 3, 15)
        });
      } else if (currentMonth > 9) {
        // Show next year's tax season
        onFilterChange({
          startDate: new Date(currentYear + 1, 0, 1),
          endDate: new Date(currentYear + 1, 3, 15)
        });
      } else {
        // Show previous tax season
        onFilterChange({
          startDate: new Date(currentYear, 0, 1),
          endDate: new Date(currentYear, 3, 15)
        });
      }
    } else if (datePreset === "next-30") {
      onFilterChange({
        startDate: now,
        endDate: addMonths(now, 1)
      });
    } else if (datePreset === "next-90") {
      onFilterChange({
        startDate: now,
        endDate: addMonths(now, 3)
      });
    } else if (datePreset === "next-6-months") {
      onFilterChange({
        startDate: now,
        endDate: addMonths(now, 6)
      });
    } else if (datePreset === "next-year") {
      onFilterChange({
        startDate: now,
        endDate: addMonths(now, 12)
      });
    } else if (datePreset === "extension-season") {
      // Extension season: August 1 to October 15
      if (currentMonth >= 7 && currentMonth < 10) {
        // We're in extension season
        onFilterChange({
          startDate: new Date(currentYear, 7, 1),
          endDate: new Date(currentYear, 9, 15)
        });
      } else if (currentMonth < 7) {
        // Show this year's extension season
        onFilterChange({
          startDate: new Date(currentYear, 7, 1),
          endDate: new Date(currentYear, 9, 15)
        });
      } else {
        // Show next year's extension season
        onFilterChange({
          startDate: new Date(currentYear + 1, 7, 1),
          endDate: new Date(currentYear + 1, 9, 15)
        });
      }
    }
  }, [datePreset]);
  
  // Role selection handling
  const handleRoleChange = (roleId: number, checked: boolean) => {
    let newRoleIds = [...filters.professionalRoleIds];
    
    if (checked) {
      newRoleIds.push(roleId);
    } else {
      newRoleIds = newRoleIds.filter(id => id !== roleId);
    }
    
    onFilterChange({ professionalRoleIds: newRoleIds });
  };
  
  // Service category selection handling
  const handleCategoryChange = (category: string, checked: boolean) => {
    let newCategories = [...filters.serviceCategories];
    
    if (checked) {
      newCategories.push(category);
    } else {
      newCategories = newCategories.filter(c => c !== category);
    }
    
    onFilterChange({ serviceCategories: newCategories });
  };
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Firm selection */}
          {firms.length > 1 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Firm</label>
              <Select 
                value={filters.firmId?.toString() || ""} 
                onValueChange={(val) => onFilterChange({ firmId: val ? parseInt(val) : undefined })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a firm" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Firms</SelectItem>
                  {firms.map((firm) => (
                    <SelectItem key={firm.id} value={firm.id.toString()}>
                      {firm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Date range selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <div className="flex flex-wrap gap-2">
              <Select value={datePreset} onValueChange={setDatePreset}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tax-season">Tax Season</SelectItem>
                  <SelectItem value="extension-season">Extension Season</SelectItem>
                  <SelectItem value="next-30">Next 30 Days</SelectItem>
                  <SelectItem value="next-90">Next 90 Days</SelectItem>
                  <SelectItem value="next-6-months">Next 6 Months</SelectItem>
                  <SelectItem value="next-year">Next Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-[120px]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(filters.startDate, "MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.startDate}
                      onSelect={(date) => {
                        if (date && isBefore(date, filters.endDate)) {
                          onFilterChange({ startDate: date });
                          setDatePreset("custom");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                
                <div className="flex items-center">to</div>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="justify-start text-left font-normal w-[120px]"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(filters.endDate, "MMM d")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filters.endDate}
                      onSelect={(date) => {
                        if (date && isBefore(filters.startDate, date)) {
                          onFilterChange({ endDate: date });
                          setDatePreset("custom");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          
          {/* View options */}
          <div className="space-y-4">
            <Separator />
            <label className="text-sm font-medium">Include</label>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="proposals"
                  checked={filters.includeProposals}
                  onCheckedChange={(checked) => onFilterChange({ includeProposals: checked })}
                />
                <label htmlFor="proposals" className="text-sm">Proposals</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="projects"
                  checked={filters.includeProjects}
                  onCheckedChange={(checked) => onFilterChange({ includeProjects: checked })}
                />
                <label htmlFor="projects" className="text-sm">Projects</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="deadlines"
                  checked={filters.includeDeadlines}
                  onCheckedChange={(checked) => onFilterChange({ includeDeadlines: checked })}
                />
                <label htmlFor="deadlines" className="text-sm">Deadlines</label>
              </div>
            </div>
          </div>
          
          {/* Professional Roles filter */}
          {professionalRoles.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Professional Roles</label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onFilterChange({ professionalRoleIds: [] })}
                >
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {professionalRoles.map((role: any) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={filters.professionalRoleIds.includes(role.id)}
                      onCheckedChange={(checked) => 
                        handleRoleChange(role.id, checked === true)
                      }
                    />
                    <label htmlFor={`role-${role.id}`} className="text-sm">
                      {role.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Service Categories filter */}
          {serviceCategories.length > 0 && (
            <div className="space-y-2">
              <Separator />
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Service Categories</label>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onFilterChange({ serviceCategories: [] })}
                >
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {serviceCategories.map((category: string) => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={filters.serviceCategories.includes(category)}
                      onCheckedChange={(checked) => 
                        handleCategoryChange(category, checked === true)
                      }
                    />
                    <label htmlFor={`category-${category}`} className="text-sm">
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}