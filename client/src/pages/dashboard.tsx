import { useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import DashboardStats from "@/components/dashboard/DashboardStats";
import TimeEntryTable from "@/components/dashboard/TimeEntryTable";
import QuickActions from "@/components/dashboard/QuickActions";
import UpcomingDeadlines from "@/components/dashboard/UpcomingDeadlines";
import { AuthContext } from "@/App";

const Dashboard = () => {
  const { user, isAuthenticated } = useContext(AuthContext);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-100 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-heading font-bold mb-6">Welcome, {user?.firstName || "User"}</h1>
        
        <DashboardStats />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TimeEntryTable />
          </div>
          
          <div>
            <QuickActions />
            <UpcomingDeadlines />
          </div>
        </div>
        
        <Card className="mt-8 bg-white">
          <CardContent className="p-6">
            <h2 className="text-xl font-heading font-bold mb-4">Recent Activity</h2>
            <div className="bg-neutral-50 p-4 rounded-md text-center text-neutral-600">
              Your recent activity will appear here as you use the platform.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
