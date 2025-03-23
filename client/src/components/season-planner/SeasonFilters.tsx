import { useState, useMemo } from "react";
import { format, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SeasonFiltersState } from "@/pages/season-planner";

interface SeasonFiltersProps {
  filters: SeasonFiltersState;
  onFilterChange: (filters: Partial<SeasonFiltersState>) => void;
  firms: any[]; // Replace with proper type
}

export function SeasonFilters({ filters, onFilterChange, firms }: SeasonFiltersProps) {
  const [showFiltersCard, setShowFiltersCard] = useState(false);
  
  // Fetch professional roles and service categories for filters
  const { data: professionalRoles = [] } = useQuery({
    queryKey: ['/api/professional-roles', filters.firmId],
    enabled: !!filters.firmId
  });
  
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services', filters.firmId],
    enabled: !!filters.firmId
  });
  
  // Extract unique service categories
  const serviceCategories = useMemo(() => {
    if (!services || !Array.isArray(services)) return [];
    const categories = new Set(services.map(service => service.category));
    return [...categories];
  }, [services]);
  
  // Preset date ranges
  const datePresets = [
    { id: "current_month", label: "Current Month", value: "current_month" },
    { id: "next_3_months", label: "Next 3 Months", value: "next_3_months" },
    { id: "next_6_months", label: "Next 6 Months", value: "next_6_months" },
    { id: "tax_season_spring", label: "Tax Season (Spring)", value: "tax_season_spring" },
    { id: "tax_season_fall", label: "Tax Season (Fall)", value: "tax_season_fall" },
    { id: "custom", label: "Custom Range", value: "custom" }
  ];
  
  // Function to apply date preset
  const applyDatePreset = (preset: string) => {
    const now = new Date();
    let startDate = now;
    let endDate = now;
    
    switch(preset) {
      case "current_month":
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case "next_3_months":
        startDate = startOfMonth(now);
        endDate = endOfMonth(addMonths(now, 2));
        break;
      case "next_6_months":
        startDate = startOfMonth(now);
        endDate = endOfMonth(addMonths(now, 5));
        break;
      case "tax_season_spring":
        startDate = new Date(now.getFullYear(), 0, 15); // Jan 15
        endDate = new Date(now.getFullYear(), 3, 15); // Apr 15
        break;
      case "tax_season_fall":
        startDate = new Date(now.getFullYear(), 7, 15); // Aug 15
        endDate = new Date(now.getFullYear(), 9, 15); // Oct 15
        break;
      default:
        // Keep current dates for custom
        return;
    }
    
    onFilterChange({ startDate, endDate });
  };
  
  return (
    <div className="space-y-4">
      {/* Quick filter bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">Season Planner</h3>
          <Badge variant="outline" className="font-normal">
            {format(filters.startDate, 'MMM d, yyyy')} - {format(filters.endDate, 'MMM d, yyyy')}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select
            value={filters.firmId?.toString() || ""}
            onValueChange={(value) => onFilterChange({ firmId: value ? parseInt(value) : undefined })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a firm" />
            </SelectTrigger>
            <SelectContent>
              {firms.map(firm => (
                <SelectItem key={firm.id} value={firm.id.toString()}>
                  {firm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Tabs 
            defaultValue="next_3_months" 
            className="w-[220px]" 
            onValueChange={applyDatePreset}
          >
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="current_month">Month</TabsTrigger>
              <TabsTrigger value="next_3_months">Quarter</TabsTrigger>
              <TabsTrigger value="next_6_months">6 Months</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex gap-2 items-center pl-3 pr-3">
                <CalendarIcon className="h-4 w-4" />
                <span className="sr-only md:not-sr-only">Date Range</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="flex">
                <div className="p-2 border-r">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => date && onFilterChange({ startDate: date })}
                    disabled={(date) => date > filters.endDate}
                  />
                </div>
                <div className="p-2">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => date && onFilterChange({ endDate: date })}
                    disabled={(date) => date < filters.startDate}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            className="flex gap-2 items-center" 
            onClick={() => setShowFiltersCard(!showFiltersCard)}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
        </div>
      </div>
      
      {/* Detailed filters card */}
      {showFiltersCard && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Professional Roles</h4>
                  <div className="space-y-2">
                    {professionalRoles && professionalRoles.length > 0 ? (
                      professionalRoles.map((role: any) => (
                        <div key={role.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`role-${role.id}`} 
                            checked={filters.professionalRoleIds.includes(role.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onFilterChange({ 
                                  professionalRoleIds: [...filters.professionalRoleIds, role.id] 
                                });
                              } else {
                                onFilterChange({ 
                                  professionalRoleIds: filters.professionalRoleIds.filter(id => id !== role.id) 
                                });
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`role-${role.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {role.name}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No professional roles available
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Service Categories</h4>
                  <div className="space-y-2">
                    {serviceCategories.length > 0 ? (
                      serviceCategories.map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`category-${category}`} 
                            checked={filters.serviceCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                onFilterChange({ 
                                  serviceCategories: [...filters.serviceCategories, category] 
                                });
                              } else {
                                onFilterChange({ 
                                  serviceCategories: filters.serviceCategories.filter(c => c !== category) 
                                });
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`category-${category}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {category}
                          </Label>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        No service categories available
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Date Presets</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {datePresets.map(preset => (
                      <Button 
                        key={preset.id}
                        variant="outline"
                        className="justify-start font-normal"
                        onClick={() => applyDatePreset(preset.value)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Include Items</h4>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="include-projects"
                      checked={filters.includeProjects}
                      onCheckedChange={(checked) => onFilterChange({ includeProjects: checked })}
                    />
                    <Label htmlFor="include-projects">Projects</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="include-proposals"
                      checked={filters.includeProposals}
                      onCheckedChange={(checked) => onFilterChange({ includeProposals: checked })}
                    />
                    <Label htmlFor="include-proposals">Proposals</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="include-deadlines"
                      checked={filters.includeDeadlines}
                      onCheckedChange={(checked) => onFilterChange({ includeDeadlines: checked })}
                    />
                    <Label htmlFor="include-deadlines">Deadlines</Label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => onFilterChange({
                  professionalRoleIds: [],
                  serviceCategories: [],
                  includeProjects: true,
                  includeProposals: true,
                  includeDeadlines: true
                })}
              >
                Reset Filters
              </Button>
              
              <Button
                onClick={() => setShowFiltersCard(false)}
              >
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}