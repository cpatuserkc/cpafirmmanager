import { useContext } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertClientCompanySchema, insertContactSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/App";
import { apiRequest } from "@/lib/queryClient";

// Create a combined schema for client form that handles both contact and company info
const clientFormSchema = z.object({
  // Client company details
  name: z.string().min(2, "Company name is required").max(100, "Company name is too long"),
  industry: z.string().max(100, "Industry name is too long").optional(),
  ein: z.string().max(20, "EIN is too long").optional(),
  website: z.string().max(100, "Website URL is too long").optional(),
  
  // Contact details (primary contact)
  firstName: z.string().min(2, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(2, "Last name is required").max(50, "Last name is too long"),
  email: z.string().email("Invalid email address").or(z.string().length(0)).optional(),
  phone: z.string().max(20, "Phone number is too long").optional(),
  
  // Shared address fields
  address: z.string().max(200, "Address is too long").optional(),
  city: z.string().max(50, "City is too long").optional(),
  state: z.string().max(20, "State is too long").optional(),
  zipCode: z.string().max(20, "ZIP code is too long").optional(),
  
  notes: z.string().max(500, "Notes are too long").optional(),
  isActive: z.boolean().default(true),
  
  // References
  firmId: z.number().optional(),
  createdById: z.number().optional(),
});

type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  onComplete: () => void;
}

const ClientForm = ({ onComplete }: ClientFormProps) => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      industry: "",
      ein: "",
      website: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      notes: "",
      isActive: true,
      firmId: user?.firmId,
      createdById: user?.id,
    },
  });
  
  const createClientMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      return apiRequest("POST", "/api/clients", values);
    },
    onSuccess: () => {
      toast({
        title: "Client Created",
        description: "The client has been added successfully.",
      });
      
      // Reset form and invalidate queries
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      onComplete();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create client: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: ClientFormValues) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to add a client.",
        variant: "destructive",
      });
      return;
    }
    
    // Make sure required IDs are set
    createClientMutation.mutate({
      ...values,
      firmId: values.firmId || user.firmId,
      createdById: values.createdById || user.id,
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="p-4 bg-blue-50 rounded-lg mb-4">
          <h3 className="font-semibold text-lg mb-2">Company Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input placeholder="Manufacturing, Retail, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="ein"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>EIN</FormLabel>
                  <FormControl>
                    <Input placeholder="XX-XXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="www.example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg mb-4">
          <h3 className="font-semibold text-lg mb-2">Primary Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name*</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <h3 className="font-semibold text-lg mb-2">Location & Additional Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this client..."
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Client</FormLabel>
                <div className="text-sm text-neutral-500">
                  Mark this client as active in your client list
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
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
            disabled={createClientMutation.isPending}
          >
            {createClientMutation.isPending ? "Adding..." : "Add Client"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ClientForm;
