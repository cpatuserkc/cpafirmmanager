import { useContext } from "react";
import { AuthContext } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { TimeEntry } from "@shared/schema";

const TimeEntryTable = () => {
  const { user } = useContext(AuthContext);
  
  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ["/api/time-entries", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/time-entries?userId=${user.id}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch time entries");
      return res.json();
    },
    enabled: !!user
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
  
  return (
    <Card className="bg-neutral-50 border border-neutral-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-neutral-700 font-heading text-lg">Recent Time Entries</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full font-mono text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Client</th>
                <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Project</th>
                <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Date</th>
                <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Hours</th>
                <th className="text-left py-3 px-2 text-neutral-600 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array(4).fill(0).map((_, index) => (
                  <tr key={index} className="border-b border-neutral-200">
                    <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-12" /></td>
                    <td className="py-3 px-2"><Skeleton className="h-4 w-16" /></td>
                  </tr>
                ))
              ) : timeEntries && timeEntries.length > 0 ? (
                timeEntries.map((entry: TimeEntry) => (
                  <tr key={entry.id} className="border-b border-neutral-200 hover:bg-neutral-100">
                    <td className="py-3 px-2">Client {entry.clientId}</td>
                    <td className="py-3 px-2">Project {entry.projectId}</td>
                    <td className="py-3 px-2">{format(new Date(entry.date), "MMM dd, yyyy")}</td>
                    <td className="py-3 px-2">{Number(entry.hours).toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <span className={`${getStatusBadgeClass(entry.status)} px-2 py-1 rounded-full text-xs`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1).replace("_", " ")}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="border-b border-neutral-200">
                  <td colSpan={5} className="py-4 text-center text-neutral-500">
                    No time entries found. Start tracking your time!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="text-right mt-4">
          <a href="/time-tracking" className="text-primary hover:text-primary-dark text-sm font-semibold">
            View All Time Entries →
          </a>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeEntryTable;
