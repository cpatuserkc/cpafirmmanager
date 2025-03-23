import { useContext } from "react";
import { AuthContext } from "@/App";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardStats = () => {
  const { user } = useContext(AuthContext);
  
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ["/api/clients", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Only fetch clients if the user is logged in
      const res = await fetch(`/api/clients?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    enabled: !!user,
  });
  
  const { data: timeEntries, isLoading: timeEntriesLoading } = useQuery({
    queryKey: ["/api/time-entries", user?.id],
    queryFn: async () => {
      if (!user) return null;
      // Only fetch time entries if the user is logged in
      const res = await fetch(`/api/time-entries?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch time entries");
      return res.json();
    },
    enabled: !!user,
  });
  
  // Calculate total billable hours this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyHours = timeEntries?.reduce((total: number, entry: any) => {
    const entryDate = new Date(entry.date);
    if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
      return total + Number(entry.hours);
    }
    return total;
  }, 0) || 0;
  
  // Mock data for revenue (would be calculated from real data in a production app)
  const monthlyRevenue = monthlyHours * 125; // Assuming $125 per hour
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Active Clients */}
      <Card className="bg-neutral-50 border border-neutral-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-neutral-600 font-semibold">Active Clients</h4>
            <span className="bg-green-100 text-success px-2 py-1 rounded text-xs font-semibold">
              +{clients?.length > 0 ? Math.floor(clients.length * 0.1) : 0} this month
            </span>
          </div>
          <div className="flex items-end">
            {clientsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <span className="text-3xl font-heading font-bold text-neutral-800">
                  {clients?.length || 0}
                </span>
                <span className="text-green-500 text-sm ml-2 font-semibold flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  12%
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Billable Hours */}
      <Card className="bg-neutral-50 border border-neutral-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-neutral-600 font-semibold">Billable Hours (Month)</h4>
            <span className="bg-green-100 text-success px-2 py-1 rounded text-xs font-semibold">
              On track
            </span>
          </div>
          <div className="flex items-end">
            {timeEntriesLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <span className="text-3xl font-heading font-bold text-neutral-800">
                  {monthlyHours.toFixed(0)}
                </span>
                <span className="text-green-500 text-sm ml-2 font-semibold flex items-center">
                  <TrendingUp size={16} className="mr-1" />
                  8%
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Revenue */}
      <Card className="bg-neutral-50 border border-neutral-200">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-neutral-600 font-semibold">Revenue (Month)</h4>
            <span className="bg-yellow-100 text-warning px-2 py-1 rounded text-xs font-semibold">
              -5% goal
            </span>
          </div>
          <div className="flex items-end">
            {timeEntriesLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <span className="text-3xl font-heading font-bold text-neutral-800">
                  ${monthlyRevenue.toLocaleString()}
                </span>
                <span className="text-red-500 text-sm ml-2 font-semibold flex items-center">
                  <TrendingDown size={16} className="mr-1" />
                  5%
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardStats;
