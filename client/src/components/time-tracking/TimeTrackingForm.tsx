import { useState, useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTimeEstimateSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import ClientSelect from "./ClientSelect";
import ProjectSelect from "./ProjectSelect";
import { apiRequest } from "@/lib/queryClient";

// Extend the insert schema with additional validation
const timeEntryFormSchema = insertTimeEstimateSchema.extend({
  estimatedHours: z.coerce.number().min(0.1, "Hours must be greater than 0").max(24, "Hours cannot exceed 24"),
  description: z.string().min(3, "Description is required").max(500, "Description is too long"),
});

type TimeEntryFormValues = z.infer<typeof timeEntryFormSchema>;

const TimeTrackingForm = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  const form = useForm<TimeEntryFormValues>({
    resolver: zodResolver(timeEntryFormSchema),
    defaultValues: {
      createdById: user?.id,
      clientCompanyId: undefined,
      projectId: undefined,
      estimatedHours: undefined,
      description: "",
      status: "planned",
      firmId: 1, // Set default firm ID for testing
    },
  });
  
  const createTimeEstimateMutation = useMutation({
    mutationFn: async (values: TimeEntryFormValues) => {
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
        description: "Please log in to track time.",
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
  
  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "billed", label: "Billed" },
    { value: "in_progress", label: "In Progress" },
  ];
  
  return (
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
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the work performed..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full md:w-auto" 
          disabled={createTimeEntryMutation.isPending}
        >
          {createTimeEntryMutation.isPending ? "Recording..." : "Record Time"}
        </Button>
      </form>
    </Form>
  );
};

export default TimeTrackingForm;
