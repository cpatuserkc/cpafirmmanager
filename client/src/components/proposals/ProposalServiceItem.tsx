import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent,
  CardFooter
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Briefcase, Clock, DollarSign } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface ProposalServiceItemProps {
  index: number;
  firmId?: number;
  value: {
    serviceId: number | null;
    professionalRoleId: number | null;
    quantity: number;
    description: string;
    estimatedHours: number;
    tier: string;
    rate: number | null;
    jurisdictionFederal: boolean;
    jurisdictionState: string | null;
  };
  onChange: (index: number, value: any) => void;
  onRemove: (index: number) => void;
}

export default function ProposalServiceItem({ 
  index, 
  firmId, 
  value, 
  onChange, 
  onRemove 
}: ProposalServiceItemProps) {
  const [localValue, setLocalValue] = useState(value);
  const [shouldUpdateParent, setShouldUpdateParent] = useState(false);
  
  // Update local value when parent value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Only update parent after initial render and when local value changes
  useEffect(() => {
    if (shouldUpdateParent) {
      onChange(index, localValue);
    } else {
      setShouldUpdateParent(true);
    }
  }, [localValue]);
  
  // Fetch services for the firm
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const res = await fetch(`/api/services?firmId=${firmId}`);
      if (!res.ok) throw new Error('Failed to fetch services');
      return res.json();
    },
    enabled: !!firmId,
  });
  
  // Fetch professional roles for the firm
  const { data: professionalRoles = [] } = useQuery({
    queryKey: ['/api/professional-roles', firmId],
    queryFn: async () => {
      if (!firmId) return [];
      const res = await fetch(`/api/professional-roles?firmId=${firmId}`);
      if (!res.ok) throw new Error('Failed to fetch professional roles');
      return res.json();
    },
    enabled: !!firmId,
  });
  
  // Get role hourly rates based on tier
  const getHourlyRate = (roleId: number | null, tier: string): number => {
    if (!roleId) return 0;
    
    const role = professionalRoles.find((r: any) => r.id === roleId);
    if (!role) return 0;
    
    switch (tier) {
      case 'top':
        return role.topTierRate || 0;
      case 'mid':
        return role.midTierRate || 0;
      case 'low':
        return role.lowTierRate || 0;
      default:
        return 0;
    }
  };
  
  // Update rate when professional role or tier changes
  useEffect(() => {
    const hourlyRate = getHourlyRate(localValue.professionalRoleId, localValue.tier);
    if (hourlyRate > 0 && hourlyRate !== localValue.rate) {
      setLocalValue(prev => ({ ...prev, rate: hourlyRate }));
    }
  }, [localValue.professionalRoleId, localValue.tier]);
  
  // Handle service selection
  const handleServiceChange = (serviceId: string) => {
    const id = parseInt(serviceId);
    const selectedService = services.find((s: any) => s.id === id);
    
    setLocalValue(prev => ({
      ...prev,
      serviceId: id,
      description: selectedService?.description || prev.description,
      estimatedHours: selectedService?.defaultHours || prev.estimatedHours,
    }));
  };
  
  // Handle professional role selection
  const handleRoleChange = (roleId: string) => {
    const id = parseInt(roleId);
    const hourlyRate = getHourlyRate(id, localValue.tier);
    
    setLocalValue(prev => ({
      ...prev,
      professionalRoleId: id,
      rate: hourlyRate,
    }));
  };
  
  // Handle tier selection
  const handleTierChange = (tier: string) => {
    const hourlyRate = getHourlyRate(localValue.professionalRoleId, tier);
    
    setLocalValue(prev => ({
      ...prev,
      tier,
      rate: hourlyRate,
    }));
  };
  
  // Calculate total cost
  const totalCost = localValue.rate 
    ? localValue.quantity * localValue.estimatedHours * localValue.rate 
    : 0;
  
  return (
    <Card className="mb-4 border-neutral-200">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Service selection */}
          <div className="lg:col-span-6">
            <Label htmlFor={`service-${index}`}>Service</Label>
            <Select
              value={localValue.serviceId?.toString() || ""}
              onValueChange={handleServiceChange}
            >
              <SelectTrigger id={`service-${index}`}>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service: any) => (
                  <SelectItem key={service.id} value={service.id.toString()}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Professional role selection */}
          <div className="lg:col-span-3">
            <Label htmlFor={`role-${index}`}>Professional Role</Label>
            <Select
              value={localValue.professionalRoleId?.toString() || ""}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger id={`role-${index}`}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {professionalRoles.map((role: any) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Quantity */}
          <div className="lg:col-span-1">
            <Label htmlFor={`quantity-${index}`}>Qty</Label>
            <Input
              id={`quantity-${index}`}
              type="number"
              min="1"
              value={localValue.quantity}
              onChange={(e) => setLocalValue(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
            />
          </div>
          
          {/* Hours */}
          <div className="lg:col-span-2">
            <Label htmlFor={`hours-${index}`}>Hours</Label>
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-neutral-400 mr-2" />
              <Input
                id={`hours-${index}`}
                type="number"
                min="0.1"
                step="0.1"
                value={localValue.estimatedHours}
                onChange={(e) => setLocalValue(prev => ({ ...prev, estimatedHours: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* Description */}
          <div className="lg:col-span-8">
            <Label htmlFor={`description-${index}`}>Description</Label>
            <Textarea
              id={`description-${index}`}
              placeholder="Detailed description of the service"
              value={localValue.description || ""}
              onChange={(e) => setLocalValue(prev => ({ ...prev, description: e.target.value }))}
              className="h-20"
            />
          </div>
          
          {/* Right column */}
          <div className="lg:col-span-4 space-y-4">
            {/* Tier selection */}
            <div>
              <Label>Rate Tier</Label>
              <RadioGroup
                value={localValue.tier}
                onValueChange={handleTierChange}
                className="flex mt-2"
              >
                <div className="flex items-center space-x-2 mr-4">
                  <RadioGroupItem value="top" id={`tier-top-${index}`} />
                  <Label htmlFor={`tier-top-${index}`} className="font-normal">Top</Label>
                </div>
                <div className="flex items-center space-x-2 mr-4">
                  <RadioGroupItem value="mid" id={`tier-mid-${index}`} />
                  <Label htmlFor={`tier-mid-${index}`} className="font-normal">Mid</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id={`tier-low-${index}`} />
                  <Label htmlFor={`tier-low-${index}`} className="font-normal">Low</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* Rate */}
            <div>
              <Label htmlFor={`rate-${index}`}>Hourly Rate</Label>
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-neutral-400 mr-2" />
                <Input
                  id={`rate-${index}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={localValue.rate || ""}
                  onChange={(e) => setLocalValue(prev => ({ ...prev, rate: parseFloat(e.target.value) || null }))}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Jurisdiction section */}
        <div className="mt-4 border-t pt-4">
          <Label className="mb-2 block">Tax Jurisdiction</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`federal-${index}`}
                checked={localValue.jurisdictionFederal}
                onCheckedChange={(checked) => setLocalValue(prev => ({ ...prev, jurisdictionFederal: checked }))}
              />
              <Label htmlFor={`federal-${index}`} className="font-normal">Federal</Label>
            </div>
            
            <div>
              <Select
                value={localValue.jurisdictionState || ""}
                onValueChange={(value) => setLocalValue(prev => ({ ...prev, jurisdictionState: value || null }))}
              >
                <SelectTrigger id={`state-${index}`}>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
                    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
                    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
                  ].map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t flex justify-between bg-neutral-50 py-3">
        <div className="flex items-center">
          <Briefcase className="h-4 w-4 text-neutral-400 mr-2" />
          <span className="text-sm text-neutral-500">
            Total: <span className="font-semibold text-foreground">${totalCost.toFixed(2)}</span>
          </span>
        </div>
        
        <Button
          type="button"
          onClick={() => onRemove(index)}
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Remove
        </Button>
      </CardFooter>
    </Card>
  );
}