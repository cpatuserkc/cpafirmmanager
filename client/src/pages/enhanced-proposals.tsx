import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Settings, Eye, Brain, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

// Import the AI Proposal form
interface AIEnhancedProposalFormProps {
  clients: any[];
  firmId: number;
  onSuccess?: () => void;
}

const AIEnhancedProposalForm: React.FC<AIEnhancedProposalFormProps> = (props) => {
  // This is a placeholder that would be implemented fully
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Creating a new AI-enhanced proposal...
      </p>
    </div>
  );
};

interface Proposal {
  id: number;
  title: string;
  estimatedCost: string;
  estimatedHours: string;
  status: string;
  createdAt: string;
  clientCompanyName?: string;
}

export default function EnhancedProposalsPage() {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [selectedTab, setSelectedTab] = useState("all");
  const firmId = 1; // Default firm ID, would be dynamic in full implementation

  // Query for approved proposals
  const { data: proposals, isLoading, error, refetch } = useQuery<Proposal[]>({
    queryKey: ["/api/proposals", { firmId }],
    enabled: !!user,
  });

  // Query for clients for the proposal form
  const { data: clients } = useQuery({
    queryKey: ["/api/client-companies", { firmId }],
    enabled: !!user && isCreatingProposal,
  });

  // Handle proposal creation success
  const handleProposalCreated = () => {
    setIsCreatingProposal(false);
    toast({
      title: "Success",
      description: "Your proposal has been created successfully.",
    });
    refetch();
  };

  // Filter proposals based on selected tab
  const filteredProposals = proposals?.filter((proposal) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "draft") return proposal.status === "draft";
    if (selectedTab === "pending") return proposal.status === "pending";
    if (selectedTab === "approved") return proposal.status === "approved";
    if (selectedTab === "rejected") return proposal.status === "rejected";
    return true;
  });

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error Loading Proposals</CardTitle>
            <CardDescription>
              There was an error loading your proposals. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Enhanced Proposals</h1>
          <p className="text-muted-foreground mt-1">
            Create intelligent proposals with AI-powered recommendations
          </p>
        </div>
        <Dialog open={isCreatingProposal} onOpenChange={setIsCreatingProposal}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New AI Proposal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create AI-Enhanced Proposal
              </DialogTitle>
            </DialogHeader>
            {clients ? (
              <AIEnhancedProposalForm
                clients={clients}
                firmId={firmId}
                onSuccess={handleProposalCreated}
              />
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Proposal Intelligence
            </CardTitle>
            <CardDescription>
              Our AI analyzes your historical proposals, client data, and industry benchmarks
              to provide intelligent recommendations for your proposals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Client-Specific Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Get service and pricing recommendations tailored to each client based on their history and industry.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Industry Benchmarks</h3>
                <p className="text-sm text-muted-foreground">
                  Compare your proposal rates and scope against industry benchmarks to remain competitive.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">Proposal Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Upload external proposals to analyze their content and extract valuable insights.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">All Proposals</TabsTrigger>
            <TabsTrigger value="draft">Drafts</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value={selectedTab} className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedTab === "all"
                  ? "All Proposals"
                  : `${selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1)} Proposals`}
              </CardTitle>
              <CardDescription>
                {selectedTab === "all"
                  ? "View and manage all your AI-enhanced proposals"
                  : `View and manage your ${selectedTab} proposals`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : filteredProposals && filteredProposals.length > 0 ? (
                <div className="space-y-4">
                  {filteredProposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1 mb-4 md:mb-0">
                        <div className="flex items-center">
                          <FileText className="h-5 w-5 text-primary mr-2" />
                          <h3 className="font-medium">{proposal.title}</h3>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {proposal.clientCompanyName} • Created{" "}
                          {new Date(proposal.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 w-full md:w-auto">
                        <div className="flex items-center space-x-2 mr-4">
                          <span className="text-sm">
                            {proposal.estimatedHours} hrs
                          </span>
                          <span className="text-sm font-semibold">
                            ${proposal.estimatedCost}
                          </span>
                          <StatusBadge status={proposal.status} />
                        </div>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium text-lg mb-2">No Proposals Found</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {selectedTab === "all"
                      ? "You haven't created any AI-enhanced proposals yet. Create your first proposal to get started."
                      : `You don't have any ${selectedTab} proposals currently.`}
                  </p>
                  <Button onClick={() => setIsCreatingProposal(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create New Proposal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let variant:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "success"
    | null
    | undefined = "default";
  
  switch (status.toLowerCase()) {
    case "draft":
      variant = "secondary";
      break;
    case "pending":
      variant = "default";
      break;
    case "approved":
      variant = "success";
      break;
    case "rejected":
      variant = "destructive";
      break;
    default:
      variant = "outline";
  }

  return (
    <Badge variant={variant}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}