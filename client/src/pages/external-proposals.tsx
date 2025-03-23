import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";

export default function ExternalProposalsPage() {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState("pending");
  
  // Normally we'd get the user's firms and use a firm selector
  // For now we'll use a default firm ID of 1 (admin/marketing firm)
  const defaultFirmId = 1;
  
  // Use a state to track when to refresh the data
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { data: proposals, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/proposals", { source: "external" }, refreshTrigger],
    queryFn: async () => {
      const res = await fetch(`/api/proposals?firmId=${defaultFirmId}&source=external`);
      if (!res.ok) throw new Error("Failed to fetch proposals");
      return res.json();
    },
    enabled: !!user, // Only run if user is logged in
  });
  
  // Function to force a refresh of the data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error loading external proposals</div>;
  
  // Filter proposals by status
  const pendingProposals = proposals?.filter((p: any) => p.status === "pending_assignment") || [];
  const assignedProposals = proposals?.filter((p: any) => 
    p.status !== "pending_assignment" && p.status !== "rejected"
  ) || [];
  const rejectedProposals = proposals?.filter((p: any) => p.status === "rejected") || [];
  
  return (
    <div className="container p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">External Proposal Requests</h1>
        <p className="text-muted-foreground">
          Review and assign proposals submitted from external websites and client requests
        </p>
      </div>
      
      <Tabs defaultValue="pending" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="pending" className="relative">
            Pending Assignment
            {pendingProposals.length > 0 && (
              <Badge variant="destructive" className="ml-2 absolute right-2">
                {pendingProposals.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="assigned">Assigned</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <div className="grid grid-cols-1 gap-6">
            {pendingProposals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="flex flex-col items-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-2" />
                    <p>No pending external proposals waiting for assignment.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              pendingProposals.map((proposal: any) => (
                <ProposalRequestCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onStatusChange={refreshData}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="assigned">
          <div className="grid grid-cols-1 gap-6">
            {assignedProposals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>No assigned external proposals.</p>
                </CardContent>
              </Card>
            ) : (
              assignedProposals.map((proposal: any) => (
                <ProposalRequestCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onStatusChange={refreshData}
                />
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="rejected">
          <div className="grid grid-cols-1 gap-6">
            {rejectedProposals.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p>No rejected external proposals.</p>
                </CardContent>
              </Card>
            ) : (
              rejectedProposals.map((proposal: any) => (
                <ProposalRequestCard 
                  key={proposal.id} 
                  proposal={proposal} 
                  onStatusChange={refreshData}
                />
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface ProposalRequestCardProps {
  proposal: any;
  onStatusChange: () => void;
}

function ProposalRequestCard({ proposal, onStatusChange }: ProposalRequestCardProps) {
  // Parse the request details if needed
  const requestDetails = proposal.requestDetails ? 
    (typeof proposal.requestDetails === 'string' ? JSON.parse(proposal.requestDetails) : proposal.requestDetails) 
    : {};
    
  const clientName = requestDetails.clientName || proposal.title?.replace("New request from ", "") || "Unknown Client";
  const contactEmail = requestDetails.contactEmail || "No email provided";
  const contactPhone = requestDetails.contactPhone || "No phone provided";
  const message = requestDetails.message || proposal.content || "No message";
  
  // Link to proposal documents if they exist (based on client name)
  const proposalDocumentLink = (() => {
    if (clientName.includes("Adams Family")) {
      return "/attached_assets/Adams Family Proposal 02-25-25.pdf.pdf";
    } else if (clientName.includes("White Dental")) {
      return "/attached_assets/D. White Proposal 02-24-25.pdf.pdf";
    }
    return null;
  })();
  
  async function handleAssign() {
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "assigned",
        }),
      });
      
      if (!res.ok) throw new Error("Failed to assign proposal");
      onStatusChange();
    } catch (error) {
      console.error("Error assigning proposal:", error);
    }
  }
  
  async function handleReject() {
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "rejected",
        }),
      });
      
      if (!res.ok) throw new Error("Failed to reject proposal");
      onStatusChange();
    } catch (error) {
      console.error("Error rejecting proposal:", error);
    }
  }
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl mb-1">{clientName}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Submitted on {new Date(proposal.createdAt).toLocaleDateString()}
            </div>
          </div>
          <StatusBadge status={proposal.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Contact Information</h3>
              <div className="space-y-1">
                <p className="text-sm">Email: {contactEmail}</p>
                <p className="text-sm">Phone: {contactPhone}</p>
              </div>
            </div>
            
            {requestDetails.industry && (
              <div>
                <h3 className="text-sm font-medium mb-1">Business Information</h3>
                <div className="space-y-1">
                  <p className="text-sm">Industry: {requestDetails.industry}</p>
                  {requestDetails.website && (
                    <p className="text-sm">Website: {requestDetails.website}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-sm font-medium mb-2">Message</h3>
            <div className="p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
              {message}
            </div>
          </div>
          
          {proposalDocumentLink && (
            <div>
              <h3 className="text-sm font-medium mb-2">Generated Proposal Document</h3>
              <a 
                href={proposalDocumentLink} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors duration-200"
              >
                <FileText className="h-4 w-4" />
                <span>View Proposal Document</span>
              </a>
            </div>
          )}
          
          {proposal.status === "pending_assignment" && (
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={handleReject}>
                Reject
              </Button>
              <Button onClick={handleAssign}>
                Assign to Me
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending_assignment":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-amber-50 text-amber-700 border-amber-300">
          <Clock className="h-3 w-3" />
          <span>Pending Assignment</span>
        </Badge>
      );
    case "assigned":
    case "draft":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-300">
          <CheckCircle className="h-3 w-3" />
          <span>Assigned</span>
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-300">
          <AlertCircle className="h-3 w-3" />
          <span>Rejected</span>
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
  }
}