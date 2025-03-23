import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trash2, Plus, Minus } from "lucide-react";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import ProfessionalRoleSelect from "@/components/time-tracking/ProfessionalRoleSelect";

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
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  
  // Query for services
  const { data: services = [] } = useQuery({
    queryKey: ['/api/services', firmId],
    enabled: !!firmId,
  });
  
  // Query for professional role details when a role is selected
  const { data: roleDetails } = useQuery({
    queryKey: ['/api/professional-roles', value.professionalRoleId],
    queryFn: async () => {
      if (!value.professionalRoleId) return null;
      const res = await fetch(`/api/professional-roles/${value.professionalRoleId}`);
      if (!res.ok) throw new Error('Failed to fetch role details');
      return res.json();
    },
    enabled: !!value.professionalRoleId,
  });
  
  // Set role details when loaded
  useEffect(() => {
    if (roleDetails) {
      setSelectedRole(roleDetails);
    }
  }, [roleDetails]);
  
  // When service or role changes, get default values
  useEffect(() => {
    if (value.serviceId && services.length > 0) {
      const selectedService = services.find((s: any) => s.id === value.serviceId);
      
      if (selectedService) {
        // If service has default role & user hasn't selected one yet
        if (selectedService.defaultRoleId && !value.professionalRoleId) {
          updateField('professionalRoleId', selectedService.defaultRoleId);
        }
        
        // If service has default tier & user hasn't selected one yet
        if (selectedService.defaultTier && (!value.tier || value.tier === 'mid')) {
          updateField('tier', selectedService.defaultTier);
        }
        
        // If service has estimated hours & user hasn't entered any yet
        if (selectedService.estimatedHours && !value.estimatedHours) {
          updateField('estimatedHours', parseFloat(selectedService.estimatedHours));
        }
        
        // If service has jurisdictions set, use those
        if (selectedService.jurisdictionFederal !== null && !value.jurisdictionFederal) {
          updateField('jurisdictionFederal', selectedService.jurisdictionFederal);
        }
        
        if (selectedService.jurisdictionState && !value.jurisdictionState) {
          updateField('jurisdictionState', selectedService.jurisdictionState);
        }
      }
    }
  }, [value.serviceId, services]);
  
  // Calculate rate based on role and tier
  useEffect(() => {
    if (selectedRole && value.tier) {
      let rate = 0;
      
      // Get base rate
      const topTierRate = parseFloat(selectedRole.topTierRate || 0);
      
      if (value.tier === 'top') {
        rate = topTierRate;
      } else if (value.tier === 'mid') {
        const midPercent = parseFloat(selectedRole.midTierRatePercent || 0) / 100;
        rate = topTierRate * midPercent;
      } else if (value.tier === 'low') {
        const lowPercent = parseFloat(selectedRole.lowTierRatePercent || 0) / 100;
        rate = topTierRate * lowPercent;
      }
      
      // Update the rate
      updateField('rate', rate);
    }
  }, [selectedRole, value.tier]);
  
  // Calculate estimated cost when relevant values change
  useEffect(() => {
    const hours = value.estimatedHours || 0;
    const quantity = value.quantity || 1;
    const rate = value.rate || 0;
    
    const cost = hours * quantity * rate;
    setEstimatedCost(cost);
  }, [value.estimatedHours, value.quantity, value.rate]);
  
  const updateField = (field: string, fieldValue: any) => {
    onChange(index, { ...value, [field]: fieldValue });
  };
  
  // Handle professional role change
  const handleRoleChange = (roleId: number) => {
    updateField('professionalRoleId', roleId);
  };
  
  return (
    <Card className="mb-4">
      <CardContent className="pt-4">
        <div className="flex justify-between items-start mb-4">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Service Selection */}
              <div>
                <Label htmlFor={`service-${index}`}>Service</Label>
                <Select
                  value={value.serviceId?.toString() || ""}
                  onValueChange={(val) => updateField('serviceId', val ? parseInt(val) : null)}
                >
                  <SelectTrigger id={`service-${index}`} className="w-full">
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
              
              {/* Professional Role Selection */}
              <div>
                <Label htmlFor={`role-${index}`}>Professional Role</Label>
                <ProfessionalRoleSelect
                  value={value.professionalRoleId || undefined}
                  onChange={handleRoleChange}
                  firmId={firmId}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Tier Selection */}
              <div>
                <Label htmlFor={`tier-${index}`}>Rate Tier</Label>
                <Select
                  value={value.tier}
                  onValueChange={(val) => updateField('tier', val)}
                >
                  <SelectTrigger id={`tier-${index}`} className="w-full">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top Tier</SelectItem>
                    <SelectItem value="mid">Mid Tier</SelectItem>
                    <SelectItem value="low">Low Tier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Quantity */}
              <div>
                <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                <div className="flex">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-r-none"
                    onClick={() => {
                      if (value.quantity > 1) {
                        updateField('quantity', value.quantity - 1);
                      }
                    }}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min="1"
                    step="1"
                    value={value.quantity}
                    onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                    className="rounded-none text-center"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-l-none"
                    onClick={() => updateField('quantity', (value.quantity || 0) + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Hours */}
              <div>
                <Label htmlFor={`hours-${index}`}>Est. Hours</Label>
                <Input
                  id={`hours-${index}`}
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={value.estimatedHours || ''}
                  onChange={(e) => updateField('estimatedHours', parseFloat(e.target.value) || 0)}
                  placeholder="0.0"
                />
              </div>
              
              {/* Rate & Cost */}
              <div>
                <Label htmlFor={`rate-${index}`}>Hourly Rate</Label>
                <div className="grid grid-cols-1 gap-1">
                  <Input
                    id={`rate-${index}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={value.rate || ''}
                    onChange={(e) => updateField('rate', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                  <div className="text-xs text-right text-muted-foreground">
                    Est. Cost: ${estimatedCost.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="mb-4">
              <Label htmlFor={`description-${index}`}>Description</Label>
              <Input
                id={`description-${index}`}
                value={value.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of the service"
              />
            </div>
            
            {/* Tax Jurisdictions */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`federal-${index}`}
                  checked={value.jurisdictionFederal}
                  onCheckedChange={(checked) => 
                    updateField('jurisdictionFederal', checked === true)
                  }
                />
                <Label htmlFor={`federal-${index}`} className="text-sm">
                  Federal Tax Work
                </Label>
              </div>
              
              <div>
                <Label htmlFor={`state-${index}`} className="text-sm mb-1 block">
                  State (if applicable)
                </Label>
                <Input
                  id={`state-${index}`}
                  className="h-8 w-20"
                  value={value.jurisdictionState || ''}
                  onChange={(e) => updateField('jurisdictionState', e.target.value)}
                  placeholder="NY"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(index)}
                  className="ml-2 text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remove service</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}