import { useState, useContext, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertProposalSchema, insertProposalServiceSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, PlusCircle, ArrowRight, ArrowLeft, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { apiRequest } from "@/lib/queryClient";
import ClientSelect from "@/components/time-tracking/ClientSelect";
import ContactSelect from "@/components/clients/ContactSelect";
import ProposalServiceItem from "./ProposalServiceItem";

// Extend the insert schema with additional validation
const proposalFormSchema = insertProposalSchema.extend({
  clientCompanyId: z.number({
    required_error: "Client company is required",
  }),
  contactId: z.number({
    required_error: "Primary contact is required",
  }),
  title: z.string().min(3, "Title is required").max(100, "Title is too long"),
  content: z.string().min(10, "Content is required").max(10000, "Content is too long"),
  estimatedStartDate: z.date().optional(),
  estimatedEndDate: z.date().optional(),
  estimatedHours: z.coerce.number().min(0.1, "Hours must be greater than 0").optional(),
  estimatedCost: z.coerce.number().min(0, "Cost cannot be negative").optional(),
  expiryDate: z.date().optional(),
});

// Basic schema for the proposal service
const proposalServiceSchema = z.object({
  serviceId: z.number().nullable(),
  professionalRoleId: z.number().nullable(),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  description: z.string().optional(),
  estimatedHours: z.number().min(0.1, "Hours must be greater than 0"),
  tier: z.string(),
  rate: z.number().nullable(),
  jurisdictionFederal: z.boolean(),
  jurisdictionState: z.string().nullable(),
});

type ProposalFormValues = z.infer<typeof proposalFormSchema>;
type ProposalServiceValues = z.infer<typeof proposalServiceSchema>;

interface EnhancedProposalFormProps {
  onComplete: () => void;
}

const defaultService: ProposalServiceValues = {
  serviceId: null,
  professionalRoleId: null,
  quantity: 1,
  description: "",
  estimatedHours: 1,
  tier: "mid",
  rate: null,
  jurisdictionFederal: false,
  jurisdictionState: null,
};

export default function EnhancedProposalForm({ onComplete }: EnhancedProposalFormProps) {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [proposalServices, setProposalServices] = useState<ProposalServiceValues[]>([defaultService]);
  const [activeTab, setActiveTab] = useState("details");
  const [totalCost, setTotalCost] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  
  const steps = [
    { id: "details", label: "Basic Details" },
    { id: "services", label: "Services" },
    { id: "timeline", label: "Timeline" },
    { id: "preview", label: "Preview" },
  ];
  
  // Form for the proposal details
  const form = useForm<ProposalFormValues>({
    resolver: zodResolver(proposalFormSchema),
    defaultValues: {
      firmId: user?.firmId,
      createdById: user?.id,
      clientCompanyId: undefined,
      contactId: undefined,
      title: "",
      content: "",
      estimatedHours: undefined,
      estimatedCost: undefined,
      status: "draft",
      expiryDate: undefined,
      estimatedStartDate: new Date(),
      estimatedEndDate: undefined,
    },
  });
  
  // Get client companies
  const { data: clientCompanies = [] } = useQuery({
    queryKey: ['/api/client-companies', user?.firmId],
    enabled: !!user?.firmId,
  });
  
  // Calculate total costs and hours
  useEffect(() => {
    let costSum = 0;
    let hoursSum = 0;
    
    proposalServices.forEach(service => {
      const quantity = service.quantity || 1;
      const hours = service.estimatedHours || 0;
      const rate = service.rate || 0;
      
      hoursSum += hours * quantity;
      costSum += hours * quantity * rate;
    });
    
    setTotalHours(hoursSum);
    setTotalCost(costSum);
    
    // Update the main form with the calculated totals
    form.setValue('estimatedHours', hoursSum);
    form.setValue('estimatedCost', costSum);
  }, [proposalServices]);
  
  // Mutation for creating a proposal and its services
  const createProposalMutation = useMutation({
    mutationFn: async (values: ProposalFormValues) => {
      // First create the proposal
      const proposal = await apiRequest("POST", "/api/proposals", values);
      
      // Then create the proposal services
      if (proposal && proposal.id) {
        const proposalId = proposal.id;
        
        // Add each service to the proposal
        for (const service of proposalServices) {
          if (service.serviceId) {
            await apiRequest("POST", "/api/proposal-services", {
              proposalId,
              serviceId: service.serviceId,
              professionalRoleId: service.professionalRoleId,
              tier: service.tier,
              quantity: service.quantity,
              rate: service.rate,
              description: service.description,
              estimatedHours: service.estimatedHours,
              estimatedCost: service.estimatedHours * service.quantity * (service.rate || 0),
              jurisdictionFederal: service.jurisdictionFederal,
              jurisdictionState: service.jurisdictionState,
            });
          }
        }
        
        return proposal;
      }
      
      throw new Error("Failed to create proposal");
    },
    onSuccess: () => {
      toast({
        title: "Proposal Created",
        description: "Your proposal has been created successfully.",
      });
      
      // Reset form and invalidate queries
      form.reset();
      setProposalServices([defaultService]);
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
    
    // Validate that we have at least one service with all required fields
    const validServices = proposalServices.filter(
      service => service.serviceId && service.professionalRoleId && service.rate
    );
    
    if (validServices.length === 0) {
      toast({
        title: "Services Required",
        description: "Please add at least one service with a role and rate.",
        variant: "destructive",
      });
      setCurrentStep(1); // Go to services step
      return;
    }
    
    createProposalMutation.mutate({
      ...values,
      firmId: user.firmId,
      createdById: user.id,
      // Format the dates for API submission
      expiryDate: values.expiryDate ? values.expiryDate.toISOString() : undefined,
      estimatedStartDate: values.estimatedStartDate ? values.estimatedStartDate.toISOString() : undefined,
      estimatedEndDate: values.estimatedEndDate ? values.estimatedEndDate.toISOString() : undefined,
    });
  };
  
  const handleClientChange = (clientId: number) => {
    setSelectedClientId(clientId);
    form.setValue("clientCompanyId", clientId);
  };
  
  const handleContactChange = (contactId: number) => {
    form.setValue("contactId", contactId);
  };
  
  // Handle adding a new service
  const addService = () => {
    setProposalServices([...proposalServices, { ...defaultService }]);
  };
  
  // Handle updating a service
  const updateService = (index: number, updatedService: ProposalServiceValues) => {
    const newServices = [...proposalServices];
    newServices[index] = updatedService;
    setProposalServices(newServices);
  };
  
  // Handle removing a service
  const removeService = (index: number) => {
    setProposalServices(proposalServices.filter((_, i) => i !== index));
  };
  
  // Navigate between steps
  const goToNextStep = () => {
    // Validate current step before proceeding
    if (currentStep === 0) {
      // Validate basic details
      const fieldsToValidate = ["clientCompanyId", "contactId", "title", "content"];
      const isValid = fieldsToValidate.every(field => form.getValues(field));
      
      if (!isValid) {
        form.trigger(fieldsToValidate as any);
        return;
      }
    }
    
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setActiveTab(steps[currentStep + 1].id);
    }
  };
  
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setActiveTab(steps[currentStep - 1].id);
    }
  };
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentStep(steps.findIndex(step => step.id === value));
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            {steps.map((step, index) => (
              <TabsTrigger 
                key={step.id} 
                value={step.id}
                disabled={createProposalMutation.isPending}
                className={index <= currentStep ? "" : "opacity-70"}
              >
                {step.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Step 1: Basic Details */}
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Details</CardTitle>
                <CardDescription>Enter the basic information for this proposal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="clientCompanyId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client Company</FormLabel>
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
                    name="contactId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact</FormLabel>
                        <FormControl>
                          <ContactSelect
                            value={field.value}
                            onChange={handleContactChange}
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
                    name="expiryDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Expiry Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                          placeholder="Enter proposal details, scope of work, terms, etc..."
                          className="min-h-[200px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onComplete}
                >
                  Cancel
                </Button>
                <Button 
                  type="button" 
                  onClick={goToNextStep}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Step 2: Services */}
          <TabsContent value="services">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Services</CardTitle>
                <CardDescription>
                  Add the services that will be part of this proposal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {proposalServices.map((service, index) => (
                  <ProposalServiceItem
                    key={index}
                    index={index}
                    firmId={user?.firmId}
                    value={service}
                    onChange={updateService}
                    onRemove={removeService}
                  />
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={addService}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Another Service
                </Button>
                
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg mt-4">
                  <div>
                    <p className="text-sm font-medium">Total Hours:</p>
                    <p className="text-xl font-bold">{totalHours.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Total Estimated Cost:</p>
                    <p className="text-xl font-bold">${totalCost.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button 
                  type="button" 
                  onClick={goToNextStep}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Step 3: Timeline */}
          <TabsContent value="timeline">
            <Card>
              <CardHeader>
                <CardTitle>Project Timeline</CardTitle>
                <CardDescription>
                  Set the estimated timeline for this project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="estimatedStartDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Estimated Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="estimatedEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Estimated End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => 
                                form.getValues("estimatedStartDate") &&
                                date < form.getValues("estimatedStartDate")!
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="text-sm font-medium mb-2">Timeline Summary</h3>
                  <p className="text-sm text-muted-foreground">
                    This project involves {totalHours.toFixed(1)} hours of work{" "}
                    {form.getValues("estimatedStartDate") && form.getValues("estimatedEndDate") ? (
                      <>
                        over approximately {
                          Math.ceil(
                            (form.getValues("estimatedEndDate")!.getTime() - 
                             form.getValues("estimatedStartDate")!.getTime()) / 
                            (1000 * 60 * 60 * 24)
                          )
                        } days
                      </>
                    ) : ""}
                    .
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button 
                  type="button" 
                  onClick={goToNextStep}
                >
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Step 4: Preview */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Proposal Preview</CardTitle>
                <CardDescription>
                  Review your proposal before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-1">Title</h3>
                    <p className="text-lg font-bold">{form.getValues("title")}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Client</h3>
                    <p>
                      {clientCompanies.find((c: any) => c.id === form.getValues("clientCompanyId"))?.name || "Unknown client"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Timeline</h3>
                    <p>
                      {form.getValues("estimatedStartDate") ? 
                        format(form.getValues("estimatedStartDate")!, "MMM d, yyyy") : "No start date"} - 
                      {form.getValues("estimatedEndDate") ? 
                        format(form.getValues("estimatedEndDate")!, "MMM d, yyyy") : "No end date"}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-1">Expiry Date</h3>
                    <p>
                      {form.getValues("expiryDate") ? 
                        format(form.getValues("expiryDate")!, "MMM d, yyyy") : "No expiry date"}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Services</h3>
                  <div className="border rounded-md divide-y">
                    {proposalServices.map((service, index) => (
                      <div key={index} className="p-3 flex justify-between">
                        <div>
                          <p className="font-medium">
                            {services.find((s: any) => s.id === service.serviceId)?.name || "Unnamed Service"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {service.description || "No description"} • {service.estimatedHours} hrs × {service.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(service.estimatedHours * service.quantity * (service.rate || 0)).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">${service.rate}/hr ({service.tier} tier)</p>
                        </div>
                      </div>
                    ))}
                    <div className="p-3 flex justify-between font-bold">
                      <div>Total</div>
                      <div>${totalCost.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-1">Content</h3>
                  <div className="border rounded-md p-3 whitespace-pre-wrap">
                    {form.getValues("content")}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={goToPreviousStep}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProposalMutation.isPending}
                >
                  {createProposalMutation.isPending ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Create Proposal
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
}