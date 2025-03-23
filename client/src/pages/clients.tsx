import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, UserPlus, Phone, Mail, MapPin, Briefcase } from "lucide-react";
import { AuthContext } from "@/App";
import { Client } from "@shared/schema";
import ClientForm from "@/components/clients/ClientForm";

const Clients = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/clients?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    enabled: !!user,
  });

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-heading font-bold">Client Management</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : (
              <>
                <UserPlus className="mr-2 h-4 w-4" /> Add New Client
              </>
            )}
          </Button>
        </div>

        {showForm ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Add New Client</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientForm onComplete={() => setShowForm(false)} />
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array(3).fill(0).map((_, index) => (
              <Card key={index} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                      <Skeleton className="h-4 w-36" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="flex items-center">
                      <Skeleton className="h-4 w-4 mr-2 rounded-full" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-end">
                    <Skeleton className="h-9 w-16 mr-2" />
                    <Skeleton className="h-9 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : clients && clients.length > 0 ? (
            clients.map((client: Client) => (
              <Card key={client.id} className="bg-white">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-heading font-bold text-lg text-neutral-800">{client.name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs ${client.isActive ? 'bg-green-100 text-success' : 'bg-neutral-200 text-neutral-700'}`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm text-neutral-600">
                    {client.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.industry && (
                      <div className="flex items-center">
                        <Briefcase className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{client.industry}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                        <span>{client.address}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-neutral-200 flex justify-end space-x-2">
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
              <h3 className="text-lg font-semibold mb-2">No Clients Found</h3>
              <p className="text-neutral-600 mb-6">You haven't added any clients yet.</p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add Your First Client
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
