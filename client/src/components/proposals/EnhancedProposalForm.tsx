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
    { id: "requirements", label: "Requirements" },
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
          <TabsList className="grid grid-cols-5 mb-4">
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
          
          {/* Step 4: Requirements */}
          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle>Required Information</CardTitle>
                <CardDescription>
                  Document requirements and additional context for the engagement
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
                    <h3 className="text-sm font-medium mb-2 text-amber-800">Required Tax Documents</h3>
                    <p className="text-sm text-amber-700 mb-4">
                      Request the following documents from the client to expedite the service process.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input type="checkbox" id="prior-year-return" className="h-4 w-4 mr-2" />
                        <label htmlFor="prior-year-return" className="text-sm">Most recently filed tax return</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="w2-forms" className="h-4 w-4 mr-2" />
                        <label htmlFor="w2-forms" className="text-sm">W-2 forms for all employment income</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="1099-forms" className="h-4 w-4 mr-2" />
                        <label htmlFor="1099-forms" className="text-sm">1099 forms for self-employment/contract work</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="investment-statements" className="h-4 w-4 mr-2" />
                        <label htmlFor="investment-statements" className="text-sm">Investment statements (1099-B, 1099-DIV, etc.)</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="mortgage-statements" className="h-4 w-4 mr-2" />
                        <label htmlFor="mortgage-statements" className="text-sm">Mortgage interest and property tax statements</label>
                      </div>
                      <div className="flex items-center">
                        <input type="checkbox" id="charitable-contributions" className="h-4 w-4 mr-2" />
                        <label htmlFor="charitable-contributions" className="text-sm">Charitable contribution receipts</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Context Questions</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="life-changes" className="text-sm font-medium">Life Changes Since Last Filing</label>
                        <select id="life-changes" className="w-full p-2 border rounded-md">
                          <option value="">Select any applicable changes</option>
                          <option value="marriage">Marriage</option>
                          <option value="divorce">Divorce</option>
                          <option value="child">New child/dependent</option>
                          <option value="home-purchase">Home purchase</option>
                          <option value="retirement">Retirement</option>
                          <option value="business">Started/ended business</option>
                          <option value="moved">Moved to new state</option>
                          <option value="none">No significant changes</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="income-changes" className="text-sm font-medium">Income Changes</label>
                        <select id="income-changes" className="w-full p-2 border rounded-md">
                          <option value="">Select any significant income changes</option>
                          <option value="increased">Significant income increase (more than 20%)</option>
                          <option value="decreased">Significant income decrease (more than 20%)</option>
                          <option value="new-sources">New income sources</option>
                          <option value="foreign">Foreign income</option>
                          <option value="crypto">Cryptocurrency transactions</option>
                          <option value="rental">New rental income</option>
                          <option value="none">No significant changes</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="complexity-score" className="text-sm font-medium">Filing Complexity Score (1-10)</label>
                        <div className="flex items-center">
                          <input 
                            type="range" 
                            id="complexity-score" 
                            min="1" 
                            max="10" 
                            step="1" 
                            defaultValue="5"
                            className="w-full" 
                          />
                          <span className="ml-2 min-w-[30px]" id="complexity-display">5</span>
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">
                          Rate estimated complexity (1 = Simple return, 10 = Highly complex)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">File Attachments</h3>
                    <div className="border-2 border-dashed border-neutral-300 rounded-md p-6 text-center">
                      <div className="flex flex-col items-center space-y-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-400">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                          <polyline points="17 8 12 3 7 8"></polyline>
                          <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <p className="text-sm text-neutral-500">Drag and drop files here, or click to browse</p>
                        <button type="button" className="text-sm text-primary hover:underline">Browse files</button>
                      </div>
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png" multiple />
                    </div>
                    <p className="text-xs text-neutral-600">
                      Accepted file formats: PDF, Word, Excel, JPG, PNG (Max 10MB per file)
                    </p>
                    <div id="file-list" className="space-y-2">
                      {/* Sample attached file preview */}
                      <div className="flex justify-between items-center p-2 border border-neutral-200 rounded bg-neutral-50">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500 mr-2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                          </svg>
                          <span className="text-sm truncate max-w-xs">2023_Tax_Documents.pdf</span>
                        </div>
                        <button type="button" className="text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Sample PDFs from attached assets */}
                      <div className="flex justify-between items-center p-2 border border-neutral-200 rounded bg-neutral-50">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <span className="text-sm truncate max-w-xs">Adams Family Proposal 02-25-25.pdf</span>
                        </div>
                        <button type="button" className="text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-center p-2 border border-neutral-200 rounded bg-neutral-50">
                        <div className="flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 mr-2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                          </svg>
                          <span className="text-sm truncate max-w-xs">D. White Proposal 02-24-25.pdf</span>
                        </div>
                        <button type="button" className="text-red-500 hover:text-red-700">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Required Documents Checklist</h3>
                    <div>
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Individual Tax Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="tax-returns" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="tax-returns" className="text-sm">Prior year tax returns (last 3 years)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="w2-forms" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="w2-forms" className="text-sm">W-2 forms (all employers)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="1099-forms" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="1099-forms" className="text-sm">1099 forms (all sources)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="k1-forms" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="k1-forms" className="text-sm">K-1 forms (partnerships/S-corps)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="business-financials" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="business-financials" className="text-sm">Business financials (if applicable)</label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="charitable-contributions" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="charitable-contributions" className="text-sm">Charitable contribution receipts</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="mortgage-interest" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="mortgage-interest" className="text-sm">Mortgage interest statements</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="property-tax" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="property-tax" className="text-sm">Property tax statements</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="investment-statements" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="investment-statements" className="text-sm">Investment statements (1099-DIV, 1099-INT)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="education-expenses" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="education-expenses" className="text-sm">Education expenses (1098-T, 1098-E)</label>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-neutral-700 mb-2">Business Tax Documents</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="business-tax-returns" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="business-tax-returns" className="text-sm">Prior year business tax returns</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="financial-statements" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="financial-statements" className="text-sm">Financial statements (P&L, Balance Sheet)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="general-ledger" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="general-ledger" className="text-sm">General ledger</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="fixed-assets" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="fixed-assets" className="text-sm">Fixed asset schedule</label>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="payroll-reports" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="payroll-reports" className="text-sm">Payroll reports (941s, W-2s, W-3)</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="1099-misc" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="1099-misc" className="text-sm">1099-MISC/NEC reports</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="corporate-docs" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="corporate-docs" className="text-sm">Corporate/Partnership documents</label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <input type="checkbox" id="inventory" className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                              <label htmlFor="inventory" className="text-sm">Inventory records (if applicable)</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Additional Notes</h3>
                    <textarea 
                      className="w-full p-3 border rounded-md min-h-[150px]" 
                      placeholder="Enter any additional context, notes, or special requirements for this engagement..."
                    ></textarea>
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
          
          {/* Step 5: Preview */}
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
                      {form.getValues("clientCompanyId") ? `Client #${form.getValues("clientCompanyId")}` : "Unknown client"}
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
                            {service.serviceId ? `Service #${service.serviceId}` : "Unnamed Service"}
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