import { useState, useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProposalSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import ClientSelect from "@/components/time-tracking/ClientSelect";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

// Extend the insert schema with additional validation
const proposalFormSchema = insertProposalSchema.extend({
  clientId: z.number({
    required_error: "Client is required",
  }),
  title: z.string().min(3, "Title is required").max(100, "Title is too long"),
  content: z.string().min(10, "Content is required").max(2000, "Content is too long"),
  estimatedHours: z.coerce.number().min(0.1, "Hours must be greater than 0").optional(),
  estimatedCost: z.coerce.number().min(0, "Cost cannot be negative").optional(),
  expiryDate: z.date().optional(),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;

interface ProposalFormProps {
  onComplete: () => void;
}

const ProposalForm = ({ onComplete }: ProposalFormProps) => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      userId: user?.id,
      clientId: undefined,
      title: "",
      content: "",
      estimatedHours: undefined,
      estimatedCost: undefined,
      status: "draft",
      expiryDate: undefined,
    },
  });
  
  const createProposalMutation = useMutation({
    mutationFn: async (values: ProposalFormValues) => {
      return apiRequest("POST", "/api/proposals", values);
    },
    onSuccess: () => {
      toast({
        title: "Proposal Created",
        description: "Your proposal has been created successfully.",
      });
      
      // Reset form and invalidate queries
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/proposals"] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create proposal: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ProposalFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create a proposal.",
        variant: "destructive",
      });
      return;
    }
    
    createProposalMutation.mutate({
      ...values,
      userId: user.id,
      // Format the date for API submission if it exists
      expiryDate: values.expiryDate ? values.expiryDate.toISOString() : undefined,
    });
  };
  
  const handleClientChange = (clientId: number) => {
    setSelectedClientId(clientId);
    form.setValue("clientId", clientId);
  };
  
  const statusOptions = [
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
  ];
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="clientId"
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proposal Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter proposal title"
                    {...field}
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
                    step="0.5"
                    placeholder="0.0"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="estimatedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Cost ($)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
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
          
          <FormField
            control={form.control}
            name="expiryDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expiry Date</FormLabel>
                <FormControl>
                  <Calendar
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proposal Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter proposal details..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onComplete}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createProposalMutation.isPending}
          >
            {createProposalMutation.isPending ? "Creating..." : "Create Proposal"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProposalForm;
