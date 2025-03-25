import { useState, useContext, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTimeEstimateSchema, type Service, type ProfessionalRole } from "@shared/schema";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
// Creating a copy of these components in the time-analytics directory
import ClientSelect from "../time-tracking/ClientSelect";
import ProjectSelect from "../time-tracking/ProjectSelect";
import ServiceSelect from "../time-tracking/ServiceSelect";
import ProfessionalRoleSelect from "../time-tracking/ProfessionalRoleSelect";
import TierSelect from "../time-tracking/TierSelect";
import { apiRequest } from "@/lib/queryClient";

// Extend the insert schema with additional validation
const timeEntryFormSchema = insertTimeEstimateSchema.extend({
  estimatedHours: z.coerce.number().min(0.1, "Hours must be greater than 0").max(24, "Hours cannot exceed 24"),
  description: z.string().min(3, "Description is required").max(500, "Description is too long"),
  // These fields may not be required in the DB schema but we'll include them for our form
  professionalRoleId: z.number().optional(),
  tier: z.string().optional(),
  hourlyRate: z.coerce.number().optional(),
});

type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>;

const TimeAnalyticsForm = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("mid");
  const [calculatedRate, setCalculatedRate] = useState<number | null>(null);
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);
  
  // Get the selected service data
  const { data: serviceData } = useQuery({
    queryKey: selectedServiceId ? ["/api/services", selectedServiceId] : ["/api/services", "none"],
    enabled: !!selectedServiceId,
  });

  // Get the selected professional role data
  const { data: roleData } = useQuery({
    queryKey: selectedRoleId ? ["/api/professional-roles", selectedRoleId] : ["/api/professional-roles", "none"],
    enabled: !!selectedRoleId,
  });
  
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      createdById: user?.id,
      clientCompanyId: undefined,
      projectId: undefined,
      serviceId: undefined,
      professionalRoleId: undefined,
      tier: "mid",
      estimatedHours: undefined,
      hourlyRate: undefined,
      description: "",
      status: "planned",
      firmId: 1, // Set default firm ID for testing
    },
  });
  
  // Calculate the rate and cost whenever relevant inputs change
  useEffect(() => {
    if (roleData && selectedTier) {
      let rate = 0;
      
      // Calculate rate based on tier
      if (selectedTier === "top") {
        rate = Number(roleData.topTierRate);
      } else if (selectedTier === "mid") {
        rate = Number(roleData.topTierRate) * (Number(roleData.midTierRatePercent) / 100);
      } else if (selectedTier === "low") {
        rate = Number(roleData.topTierRate) * (Number(roleData.lowTierRatePercent) / 100);
      }
      
      setCalculatedRate(rate);
      form.setValue("hourlyRate", rate);
      
      // Calculate estimated cost if we have hours
      const hours = form.getValues("estimatedHours");
      if (hours) {
        const cost = rate * hours;
        setEstimatedCost(cost);
        form.setValue("estimatedCost", String(cost));
      }
    }
  }, [roleData, selectedTier, form.watch("estimatedHours")]);
  
  // Update cost when hours change
  useEffect(() => {
    const hours = form.watch("estimatedHours");
    if (calculatedRate !== null && hours) {
      const cost = calculatedRate * hours;
      setEstimatedCost(cost);
      form.setValue("estimatedCost", String(cost));
    }
  }, [form.watch("estimatedHours"), calculatedRate]);
  
  // Set defaults from service when a service is selected
  useEffect(() => {
    if (serviceData) {
      // If service has defaults, set them
      if (serviceData.defaultRoleId) {
        form.setValue("professionalRoleId", serviceData.defaultRoleId);
        setSelectedRoleId(serviceData.defaultRoleId);
      }
      
      if (serviceData.defaultTier) {
        form.setValue("tier", serviceData.defaultTier);
        setSelectedTier(serviceData.defaultTier);
      }
      
      if (serviceData.estimatedHours) {
        form.setValue("estimatedHours", Number(serviceData.estimatedHours));
      }
    }
  }, [serviceData]);
  
  const createTimeEstimateMutation = useMutation({
    mutationFn: async (values: TimeEntryFormValues) => {
      // Include the calculated estimatedCost
      if (estimatedCost !== null) {
        values.estimatedCost = String(estimatedCost);
      }
      return apiRequest("POST", "/api/time-estimates", values);
    },
    onSuccess: () => {
      toast({
        title: "Time Estimate Created",
        description: "Your time estimate has been recorded successfully.",
      });
      
      // Reset form and invalidate queries
      form.reset();
      setSelectedClientId(null);
      setSelectedServiceId(null);
      setSelectedRoleId(null);
      setSelectedTier("mid");
      setCalculatedRate(null);
      setEstimatedCost(null);
      queryClient.invalidateQueries({ queryKey: ["/api/time-estimates"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create time estimate: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: TimeEntryFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a time estimate.",
        variant: "destructive",
      });
      return;
    }
    
    createTimeEstimateMutation.mutate({
      ...values,
      createdById: user.id,
    });
  };
  
  const handleClientChange = (clientId: number) => {
    setSelectedClientId(clientId);
    form.setValue("clientCompanyId", clientId);
    // Clear project when client changes
    form.setValue("projectId", undefined);
  };

  const handleServiceChange = (serviceId: number) => {
    setSelectedServiceId(serviceId);
    form.setValue("serviceId", serviceId);
  };

  const handleRoleChange = (roleId: number) => {
    setSelectedRoleId(roleId);
    form.setValue("professionalRoleId", roleId);
  };

  const handleTierChange = (tier: string) => {
    setSelectedTier(tier);
    form.setValue("tier", tier);
  };
  
  const statusOptions = [
    { value: "planned", label: "Planned" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "billed", label: "Billed" },
  ];
  
  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="clientCompanyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <ClientSelect
                      value={field.value}
                      onChange={handleClientChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project</FormLabel>
                  <FormControl>
                    <ProjectSelect
                      value={field.value}
                      onChange={field.onChange}
                      clientId={selectedClientId}
                      disabled={!selectedClientId}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <FormControl>
                    <ServiceSelect
                      value={field.value}
                      onChange={handleServiceChange}
                      firmId={form.getValues("firmId")}
                    />
                  </FormControl>
                  <FormDescription>
                    Select a service to auto-fill default values
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="professionalRoleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Role</FormLabel>
                  <FormControl>
                    <ProfessionalRoleSelect
                      value={field.value}
                      onChange={handleRoleChange}
                      firmId={form.getValues("firmId")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Billing Tier</FormLabel>
                  <FormControl>
                    <TierSelect
                      value={field.value || "mid"}
                      onChange={handleTierChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.25"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Readonly display of calculated rates */}
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate (Calculated)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      readOnly
                      value={calculatedRate !== null ? calculatedRate.toFixed(2) : ""}
                      className="bg-muted"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the work to be performed..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Display calculated estimate summary */}
          {estimatedCost !== null && calculatedRate !== null && (
            <Card className="bg-muted/50 mb-4">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Estimate Summary</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">Professional Role:</div>
                  <div className="text-sm font-medium">{roleData?.name || 'Not selected'}</div>
                  
                  <div className="text-sm">Tier Level:</div>
                  <div className="text-sm font-medium capitalize">{selectedTier}-tier</div>
                  
                  <div className="text-sm">Hourly Rate:</div>
                  <div className="text-sm font-medium">${calculatedRate.toFixed(2)}</div>
                  
                  <div className="text-sm">Estimated Hours:</div>
                  <div className="text-sm font-medium">{form.watch("estimatedHours") || 0}</div>
                  
                  <div className="text-sm font-semibold">Total Estimated Cost:</div>
                  <div className="text-sm font-bold">${estimatedCost.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Button 
            type="submit" 
            className="w-full md:w-auto" 
            disabled={createTimeEstimateMutation.isPending}
          >
            {createTimeEstimateMutation.isPending ? "Saving..." : "Save Estimate"}
          </Button>
        </form>
      </Form>
    </>
  );
};

export default TimeAnalyticsForm;