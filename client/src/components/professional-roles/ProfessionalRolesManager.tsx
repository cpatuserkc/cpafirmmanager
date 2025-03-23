import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { ProfessionalRole, insertProfessionalRoleSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2, Plus, Check, X, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useContext } from "react";
import { AuthContext } from "@/App";

// Form schema for professional role with validation
const professionalRoleFormSchema = insertProfessionalRoleSchema.extend({
  topTierRate: z.string().min(1, "Top tier rate is required"),
  midTierRatePercent: z.string().min(1, "Mid tier rate percent is required"),
  lowTierRatePercent: z.string().min(1, "Low tier rate percent is required"),
});

type ProfessionalRoleFormValues = z.infer<typeof professionalRoleFormSchema>;

export function ProfessionalRolesManager() {
  const { user } = useContext(AuthContext);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<ProfessionalRole | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the firms the user belongs to
  const { data: firms, isLoading: firmsLoading } = useQuery({
    queryKey: ['/api/firms', user?.id],
    queryFn: getQueryFn<any[]>({ on401: "throw" }),
    enabled: !!user,
  });

  const [selectedFirmId, setSelectedFirmId] = useState<number | null>(null);

  // Once firms are loaded, select the first one by default
  if (firms && firms.length > 0 && !selectedFirmId) {
    setSelectedFirmId(firms[0].id);
  }

  // Get professional roles for the selected firm
  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['/api/professional-roles', selectedFirmId],
    queryFn: getQueryFn<ProfessionalRole[]>({ on401: "throw" }),
    enabled: !!selectedFirmId,
  });

  // Form for creating/editing professional roles
  const form = useForm<ProfessionalRoleFormValues>({
    resolver: zodResolver(professionalRoleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      topTierRate: "150",
      midTierRatePercent: "75",
      lowTierRatePercent: "50",
      firmId: selectedFirmId || 0,
      createdById: user?.id || 0,
    },
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (values: ProfessionalRoleFormValues) => {
      const formattedValues = {
        ...values,
        firmId: selectedFirmId,
        createdById: user?.id,
      };
      return apiRequest('/api/professional-roles', {
        method: 'POST',
        data: formattedValues,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-roles', selectedFirmId] });
      toast({
        title: "Success",
        description: "Professional role has been created.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create professional role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async (values: ProfessionalRoleFormValues & { id: number }) => {
      const { id, ...updateData } = values;
      return apiRequest(`/api/professional-roles/${id}`, {
        method: 'PUT',
        data: updateData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-roles', selectedFirmId] });
      toast({
        title: "Success",
        description: "Professional role has been updated.",
      });
      setIsDialogOpen(false);
      setEditingRole(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update professional role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/professional-roles/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-roles', selectedFirmId] });
      toast({
        title: "Success",
        description: "Professional role has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete professional role. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: ProfessionalRoleFormValues) => {
    if (editingRole) {
      updateRoleMutation.mutate({ ...values, id: editingRole.id });
    } else {
      createRoleMutation.mutate(values);
    }
  };

  // Edit role handler
  const handleEditRole = (role: ProfessionalRole) => {
    setEditingRole(role);
    form.reset({
      name: role.name,
      description: role.description || "",
      topTierRate: role.topTierRate.toString(),
      midTierRatePercent: role.midTierRatePercent.toString(),
      lowTierRatePercent: role.lowTierRatePercent.toString(),
      firmId: role.firmId,
      createdById: role.createdById,
    });
    setIsDialogOpen(true);
  };

  // Delete role handler
  const handleDeleteRole = (id: number) => {
    if (confirm("Are you sure you want to delete this professional role? This cannot be undone.")) {
      deleteRoleMutation.mutate(id);
    }
  };

  // Calculate the mid and low tier rates based on percentages
  const calculateTierRate = (baseRate: number, percent: number) => {
    return ((baseRate * percent) / 100).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Professional Roles Manager</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRole ? "Edit Professional Role" : "Create New Professional Role"}</DialogTitle>
              <DialogDescription>
                Define a professional role with customized billing rates for each tier.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tax Specialist" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of the professional role (e.g., "Accountant", "Tax Specialist", "Auditor")
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input placeholder="Handles individual and business tax filings" {...field} />
                      </FormControl>
                      <FormDescription>
                        Brief description of the role's responsibilities
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="topTierRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Top Tier Rate ($/hr)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="150" {...field} />
                      </FormControl>
                      <FormDescription>
                        Hourly rate for top tier (most experienced) professionals
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="midTierRatePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mid Tier Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="75" {...field} />
                        </FormControl>
                        <FormDescription>
                          Percentage of top tier rate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lowTierRatePercent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Low Tier Rate (%)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50" {...field} />
                        </FormControl>
                        <FormDescription>
                          Percentage of top tier rate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>
                    {editingRole ? "Update Role" : "Create Role"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Firm selector */}
      {firms && firms.length > 0 && (
        <div className="mb-6">
          <FormLabel>Select Firm</FormLabel>
          <div className="flex space-x-2 mt-2">
            {firms.map((firm) => (
              <Button
                key={firm.id}
                variant={selectedFirmId === firm.id ? "default" : "outline"}
                onClick={() => setSelectedFirmId(firm.id)}
              >
                {firm.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {rolesLoading && <p>Loading professional roles...</p>}

      {roles && roles.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <h3 className="text-lg font-medium">No professional roles defined yet</h3>
          <p className="text-sm text-gray-500 mt-2">
            Create your first professional role to start building service offerings with tiered billing rates.
          </p>
          <Button className="mt-4" onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Role
          </Button>
        </div>
      )}

      {roles && roles.length > 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Professional Roles</CardTitle>
              <CardDescription>Manage your firm's professional roles and billing rates</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Top Tier Rate</TableHead>
                    <TableHead>Mid Tier Rate</TableHead>
                    <TableHead>Low Tier Rate</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => {
                    const topRate = parseFloat(role.topTierRate.toString());
                    const midPercent = parseFloat(role.midTierRatePercent.toString());
                    const lowPercent = parseFloat(role.lowTierRatePercent.toString());
                    
                    return (
                      <TableRow key={role.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{role.name}</div>
                            {role.description && (
                              <div className="text-sm text-gray-500">{role.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>${topRate.toFixed(2)}/hr</TableCell>
                        <TableCell>
                          ${calculateTierRate(topRate, midPercent)}/hr
                          <Badge variant="outline" className="ml-2">
                            <Percent className="h-3 w-3 mr-1" />
                            {midPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${calculateTierRate(topRate, lowPercent)}/hr
                          <Badge variant="outline" className="ml-2">
                            <Percent className="h-3 w-3 mr-1" />
                            {lowPercent}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditRole(role)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRole(role.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Role Rate Tiers Explained</CardTitle>
              <CardDescription>Understanding our three-tier billing model</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-primary mb-2">Top Tier</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Senior professionals with extensive experience and specialized expertise.
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Complex advisory services</li>
                      <li>High-level planning</li>
                      <li>Expert technical knowledge</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-primary mb-2">Mid Tier</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Experienced professionals with solid knowledge and practical skills.
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Standard compliance work</li>
                      <li>Client management</li>
                      <li>Implementation of solutions</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-primary mb-2">Low Tier</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Junior staff or trainees handling routine, standardized tasks.
                    </p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Data entry and processing</li>
                      <li>Document preparation</li>
                      <li>Routine administrative work</li>
                    </ul>
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-2">How It Benefits Your Firm</h3>
                  <p className="text-sm text-gray-600">
                    This tiered approach allows you to optimize staffing costs while maintaining quality. 
                    Senior staff can focus on complex, high-value work while routine tasks are handled 
                    efficiently by junior staff at appropriate rates. You can adjust the percentage 
                    of each tier based on your firm's specific experience and market rates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}