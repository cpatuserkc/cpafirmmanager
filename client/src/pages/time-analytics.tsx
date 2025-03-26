import { useState, useEffect, useContext } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TimeAnalyticsForm from "@/components/time-analytics/TimeAnalyticsForm";
import TimeAnalyticsDashboard from "@/components/time-analytics/TimeAnalyticsDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AuthContext } from "@/App";
import { Clock, Calendar, Filter, BarChart } from "lucide-react";
import { TimeEstimate } from "@shared/schema";

const TimeAnalytics = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("track");

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ["/api/time-estimates", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/time-estimates?assignedToId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch time estimates");
      return res.json();
    },
    enabled: !!user,
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "billed":
        return "bg-green-100 text-success";
      case "pending":
        return "bg-yellow-100 text-warning";
      case "in_progress":
        return "bg-blue-100 text-primary";
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
          <h1 className="text-2xl font-heading font-bold">Time Analytics</h1>
          <div className="flex items-center space-x-2">
            <Clock className="text-neutral-500" />
            <span className="text-neutral-600">
              {format(new Date(), "MMMM d, yyyy")}
            </span>
          </div>
        </div>

        <Tabs defaultValue="track" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="track">Create Estimate</TabsTrigger>
            <TabsTrigger value="history">Time Estimates</TabsTrigger>
            <TabsTrigger value="reports">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="track">
            <Card>
              <CardHeader>
                <CardTitle>Create Time Estimate</CardTitle>
              </CardHeader>
              <CardContent>
                <TimeAnalyticsForm />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Time Estimates History</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date Range
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full font-mono text-sm">
                    <thead>
                      <tr className="border-b border-neutral-200">
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Client</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Project</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Date</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Hours</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Description</th>
                        <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        // Loading skeleton
                        Array(5).fill(0).map((_, index) => (
                          <tr key={index} className="border-b border-neutral-200">
                            <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-12" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-40" /></td>
                            <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>
                          </tr>
                        ))
                      ) : timeEntries && timeEntries.length > 0 ? (
                        timeEntries.map((entry: TimeEstimate) => (
                          <tr key={entry.id} className="border-b border-neutral-200 hover:bg-neutral-100">
                            <td className="py-3 px-2">Client {entry.clientCompanyId}</td>
                            <td className="py-3 px-2">Project {entry.projectId}</td>
                            <td className="py-3 px-2">{format(new Date(entry.createdAt), "MMM dd, yyyy")}</td>
                            <td className="py-3 px-2">{Number(entry.estimatedHours).toFixed(2)}</td>
                            <td className="py-3 px-2">
                              {entry.description ? entry.description.slice(0, 30) + (entry.description.length > 30 ? '...' : '') : '-'}
                            </td>
                            <td className="py-3 px-2">
                              <span className={`${getStatusBadgeClass(entry.status)} px-2 py-1 rounded-full text-xs`}>
                                {entry.status.charAt(0).toUpperCase() + entry.status.slice(1).replace("_", " ")}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr className="border-b border-neutral-200">
                          <td colSpan={6} className="py-4 text-center text-neutral-500">
                            No time estimates found. Create a new time estimate to get started!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Time Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-8 text-center text-neutral-600">
                  <BarChart className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard Coming Soon</h3>
                  <p>Advanced time analytics and forecasting features are currently in development.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TimeAnalytics;