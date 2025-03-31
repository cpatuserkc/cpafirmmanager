import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProposalRecommendations } from "./ProposalRecommendations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle } from "lucide-react";
import { ProposalRecommendation } from "@/hooks/use-proposal-recommendations";

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  clientCompanyId: z.string().min(1, { message: "Please select a client" }),
  estimatedStartDate: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Client {
  id: number;
  name: string;
  industry?: string;
}

interface AIEnhancedProposalFormProps {
  clients: Client[];
  firmId: number;
  onSuccess?: () => void;
}

export function AIEnhancedProposalForm({ 
  clients, 
  firmId,
  onSuccess 
}: AIEnhancedProposalFormProps) {
  const { toast } = useToast();
  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [selectedClientIndustry, setSelectedClientIndustry] = useState<string>("");
  const [selectedServices, setSelectedServices] = useState<ProposalRecommendation[]>([]);

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      clientCompanyId: "",
      estimatedStartDate: new Date().toISOString().split("T")[0],
      estimatedEndDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
        .toISOString()
        .split("T")[0],
      notes: "",
    },
  });

  // Handle client selection change
  const handleClientChange = (value: string) => {
    const clientId = parseInt(value);
    setSelectedClientId(clientId);
    
    // Find the client's industry
    const client = clients.find(c => c.id === clientId);
    setSelectedClientIndustry(client?.industry || "");
    
    // Reset selected services when client changes
    setSelectedServices([]);
  };

  // Handle adding a service to the proposal
  const handleAddServiceToProposal = (recommendation: ProposalRecommendation) => {
    // Check if service is already added
    if (!selectedServices.some(s => s.serviceId === recommendation.serviceId)) {
      setSelectedServices([...selectedServices, recommendation]);
    } else {
      // Show toast if service is already added
      toast({
        title: "Service already added",
        description: "This service is already in your proposal",
        variant: "default",
      });
    }
  };

  // Handle removing a service from the proposal
  const handleRemoveService = (serviceId: number) => {
    setSelectedServices(selectedServices.filter(s => s.serviceId !== serviceId));
  };

  // Calculate total cost and hours
  const totalHours = selectedServices.reduce(
    (total, service) => total + service.recommendedHours,
    0
  );
  
  const totalCost = selectedServices.reduce(
    (total, service) => total + service.recommendedHours * service.recommendedRate,
    0
  );

  // Handle form submission
  const createProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/proposals", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create proposal");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/proposals"],
      });
      toast({
        title: "Success",
        description: "Your AI-enhanced proposal has been created",
      });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (selectedServices.length === 0) {
      toast({
        title: "No services selected",
        description: "Please add at least one service to your proposal",
        variant: "destructive",
      });
      return;
    }

    try {
      // Prepare the proposal data
      const proposalData = {
        ...data,
        clientCompanyId: parseInt(data.clientCompanyId),
        firmId,
        status: "draft",
        estimatedHours: totalHours.toString(),
        estimatedCost: totalCost.toString(),
        createdById: 1, // This would come from the user context in a real app
        services: selectedServices.map(service => ({
          serviceId: service.serviceId,
          hours: service.recommendedHours,
          rate: service.recommendedRate,
          description: service.rationale,
        })),
      };

      // Submit the proposal
      createProposalMutation.mutate(proposalData);
    } catch (error) {
      console.error("Error creating proposal:", error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter proposal title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="clientCompanyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleClientChange(value);
                    }}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="estimatedStartDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedEndDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes for this proposal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Card>
              <CardHeader>
                <CardTitle>Selected Services</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedServices.length > 0 ? (
                  <div className="space-y-3">
                    {selectedServices.map((service) => (
                      <div
                        key={service.serviceId}
                        className="flex justify-between items-center p-3 border rounded-md"
                      >
                        <div>
                          <div className="font-medium">{service.serviceName}</div>
                          <div className="text-sm text-muted-foreground">
                            {service.recommendedHours} hrs @ ${service.recommendedRate}/hr
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge>
                            ${service.recommendedHours * service.recommendedRate}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveService(service.serviceId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-between pt-3 border-t mt-3">
                      <div className="font-semibold">Total</div>
                      <div className="font-semibold">${totalCost.toFixed(2)}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No services added yet</p>
                    <p className="text-sm mt-1">
                      Select a client and add services from the recommendations
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              disabled={createProposalMutation.isPending}
            >
              {createProposalMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Proposal
                </>
              ) : (
                "Create Proposal"
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>AI Service Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedClientId > 0 ? (
              <ProposalRecommendations
                clientId={selectedClientId}
                firmId={firmId}
                industry={selectedClientIndustry}
                onSelectService={handleAddServiceToProposal}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Select a client to see AI recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}