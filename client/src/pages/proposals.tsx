import { useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { FileText, Plus } from "lucide-react";
import { AuthContext } from "@/App";
import { Proposal } from "@shared/schema";
import ProposalForm from "@/components/proposals/ProposalForm";

const Proposals = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: proposals, isLoading } = useQuery({
    queryKey: ["/api/proposals", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/proposals?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
    enabled: !!user,
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-success";
      case "sent":
        return "bg-blue-100 text-primary";
      case "draft":
        return "bg-neutral-200 text-neutral-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-neutral-100 text-neutral-600";
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-heading font-bold">Proposals & Estimates</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : (
              <>
                <Plus className="mr-2 h-4 w-4" /> Create Proposal
              </>
            )}
          </Button>
        </div>

        {showForm ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Create New Proposal</CardTitle>
            </CardHeader>
            <CardContent>
              <ProposalForm onComplete={() => setShowForm(false)} />
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="active">
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active Proposals</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Card>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full font-mono text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Title</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Client</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Created</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Est. Hours</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Est. Cost</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Status</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        // Loading skeleton
                        Array(3).fill(0).map((_, index) => (
                          <tr key={index} className="border-b border-neutral-200">
                            <td className="py-3 px-2"><Skeleton className="h-4 w-32" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-12" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                          </tr>
                        ))
                      ) : proposals && proposals.length > 0 ? (
                        proposals
                          .filter((p: Proposal) => p.status !== 'draft')
                          .map((proposal: Proposal) => (
                            <tr key={proposal.id} className="border-b border-neutral-200 hover:bg-neutral-100">
                              <td className="py-3 px-2 font-semibold">{proposal.title}</td>
                              <td className="py-3 px-2">Client {proposal.clientId}</td>
                              <td className="py-3 px-2">{format(new Date(proposal.createdAt), "MMM dd, yyyy")}</td>
                              <td className="py-3 px-2">{Number(proposal.estimatedHours).toFixed(1)}</td>
                              <td className="py-3 px-2">${Number(proposal.estimatedCost).toLocaleString()}</td>
                              <td className="py-3 px-2">
                                <span className={`${getStatusBadgeClass(proposal.status)} px-2 py-1 rounded-full text-xs`}>
                                  {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">Edit</Button>
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr className="border-b border-neutral-200">
                          <td colSpan={7} className="py-4 text-center text-neutral-500">
                            No active proposals found. Create your first proposal!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="draft">
            <Card>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full font-mono text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Title</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Client</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Created</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Est. Hours</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Est. Cost</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr className="border-b border-neutral-200">
                          <td colSpan={6} className="py-4 text-center">
                            <Skeleton className="h-4 w-32 mx-auto" />
                          </td>
                        </tr>
                      ) : proposals && proposals.filter((p: Proposal) => p.status === 'draft').length > 0 ? (
                        proposals
                          .filter((p: Proposal) => p.status === 'draft')
                          .map((proposal: Proposal) => (
                            <tr key={proposal.id} className="border-b border-neutral-200 hover:bg-neutral-100">
                              <td className="py-3 px-2 font-semibold">{proposal.title}</td>
                              <td className="py-3 px-2">Client {proposal.clientId}</td>
                              <td className="py-3 px-2">{format(new Date(proposal.createdAt), "MMM dd, yyyy")}</td>
                              <td className="py-3 px-2">{Number(proposal.estimatedHours || 0).toFixed(1)}</td>
                              <td className="py-3 px-2">${Number(proposal.estimatedCost || 0).toLocaleString()}</td>
                              <td className="py-3 px-2">
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm">Edit</Button>
                                  <Button variant="outline" size="sm">Delete</Button>
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr className="border-b border-neutral-200">
                          <td colSpan={6} className="py-4 text-center text-neutral-500">
                            No draft proposals found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="archived">
            <Card>
              <CardContent className="p-6 text-center py-12">
                <FileText className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
                <h3 className="text-lg font-semibold mb-2">No Archived Proposals</h3>
                <p className="text-neutral-600">
                  Proposals that are completed or expired will appear here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Proposals;
