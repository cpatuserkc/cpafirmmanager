import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { SeasonFiltersState } from '@/pages/season-planner';
import { Slider } from '@/components/ui/slider';

interface SeasonFiltersProps {
  filters: SeasonFiltersState;
  onFilterChange: (filters: Partial<SeasonFiltersState>) => void;
  firms: any[]; // Replace with proper type
}

export function SeasonFilters({ filters, onFilterChange, firms }: SeasonFiltersProps) {
  const [priceAdjustment, setPriceAdjustment] = useState(0); // -50% to +50%
  
  // Fetch professional roles
  const { data: roles = [] } = useQuery({
    queryKey: ['/api/professional-roles', filters.firmId],
    queryFn: async () => {
      if (!filters.firmId) return [];
      const response = await fetch(`/api/professional-roles?firmId=${filters.firmId}`);
      if (!response.ok) throw new Error('Failed to fetch professional roles');
      return response.json();
    },
    enabled: !!filters.firmId,
  });

  // Fetch service categories
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services', filters.firmId],
    queryFn: async () => {
      if (!filters.firmId) return [];
      const response = await fetch(`/api/services?firmId=${filters.firmId}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    enabled: !!filters.firmId,
  });

  // Extract unique service categories
  const serviceCategories = [...new Set(services.map((service: any) => service.category))];

  // Handle price adjustment changes
  const handlePriceAdjustment = async () => {
    try {
      const response = await fetch('/api/pricing/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firmId: filters.firmId,
          adjustmentPercent: priceAdjustment,
          startDate: filters.startDate,
          endDate: filters.endDate,
          serviceCategories: filters.serviceCategories.length > 0 ? filters.serviceCategories : undefined,
          professionalRoleIds: filters.professionalRoleIds.length > 0 ? filters.professionalRoleIds : undefined,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to adjust pricing');
      
      // Reset the slider after successful adjustment
      setPriceAdjustment(0);
      
      // Show success message (handled by parent component)
    } catch (error) {
      console.error('Error adjusting pricing:', error);
      // Show error message (handled by parent component)
    }
  };

  const toggleRole = (roleId: number) => {
    const newRoles = filters.professionalRoleIds.includes(roleId)
      ? filters.professionalRoleIds.filter(id => id !== roleId)
      : [...filters.professionalRoleIds, roleId];
    
    onFilterChange({ professionalRoleIds: newRoles });
  };

  const toggleCategory = (category: string) => {
    const newCategories = filters.serviceCategories.includes(category)
      ? filters.serviceCategories.filter(c => c !== category)
      : [...filters.serviceCategories, category];
    
    onFilterChange({ serviceCategories: newCategories });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Firm Selection */}
        <div className="space-y-2">
          <Label htmlFor="firm-select">Firm</Label>
          <Select 
            value={filters.firmId?.toString()} 
            onValueChange={(value) => onFilterChange({ firmId: parseInt(value) })}
          >
            <SelectTrigger id="firm-select">
              <SelectValue placeholder="Select a firm" />
            </SelectTrigger>
            <SelectContent>
              {firms.map((firm) => (
                <SelectItem key={firm.id} value={firm.id.toString()}>
                  {firm.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? format(filters.startDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.startDate}
                onSelect={(date) => date && onFilterChange({ startDate: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.endDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.endDate ? format(filters.endDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={filters.endDate}
                onSelect={(date) => date && onFilterChange({ endDate: date })}
                initialFocus
                disabled={(date) => date < filters.startDate}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {/* Professional Roles Selection */}
        <div className="space-y-2">
          <Label>Professional Roles</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {roles.map((role: any) => (
              <div key={role.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={filters.professionalRoleIds.includes(role.id)}
                  onCheckedChange={() => toggleRole(role.id)}
                />
                <Label
                  htmlFor={`role-${role.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {role.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Service Categories Selection */}
        <div className="space-y-2">
          <Label>Service Categories</Label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            {serviceCategories.map((category: string) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={filters.serviceCategories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checkboxes for what to include */}
      <div className="flex flex-wrap gap-6 mt-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-projects"
            checked={filters.includeProjects}
            onCheckedChange={(checked) => 
              onFilterChange({ includeProjects: checked as boolean })
            }
          />
          <Label htmlFor="include-projects">Projects</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-proposals"
            checked={filters.includeProposals}
            onCheckedChange={(checked) => 
              onFilterChange({ includeProposals: checked as boolean })
            }
          />
          <Label htmlFor="include-proposals">Proposals</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="include-deadlines"
            checked={filters.includeDeadlines}
            onCheckedChange={(checked) => 
              onFilterChange({ includeDeadlines: checked as boolean })
            }
          />
          <Label htmlFor="include-deadlines">Deadlines</Label>
        </div>
      </div>

      {/* Dynamic Pricing Adjustment */}
      <div className="mt-6 p-4 border rounded-md">
        <h3 className="font-medium mb-2">Dynamic Pricing Adjustment</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Adjust rates based on capacity - increase during high demand, decrease to fill staff hours.
        </p>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>-50%</span>
              <span className="font-medium">
                {priceAdjustment > 0 ? `+${priceAdjustment}%` : `${priceAdjustment}%`}
              </span>
              <span>+50%</span>
            </div>
            <Slider
              value={[priceAdjustment]}
              min={-50}
              max={50}
              step={1}
              onValueChange={(value) => setPriceAdjustment(value[0])}
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              onClick={handlePriceAdjustment}
              disabled={priceAdjustment === 0}
              variant={priceAdjustment > 0 ? "default" : "outline"}
            >
              Apply Price Adjustment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}