import { useContext } from "react";
import { AuthContext } from "@/App";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, differenceInDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Deadline } from "@shared/schema";

const UpcomingDeadlines = () => {
  const { user } = useContext(AuthContext);
  
  const { data: deadlines, isLoading } = useQuery({
    queryKey: ["/api/deadlines", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const res = await fetch(`/api/deadlines?userId=${user.id}&upcoming=true&limit=3`);
      if (!res.ok) throw new Error("Failed to fetch deadlines");
      return res.json();
    },
    enabled: !!user
  });
  
  // Function to determine the badge style based on days remaining
  const getDeadlineBadge = (dueDate: string) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    
    if (days <= 3) {
      return {
        class: "bg-red-100 text-danger",
        text: `${days} day${days !== 1 ? 's' : ''}`,
      };
    } else if (days <= 7) {
      return {
        class: "bg-yellow-100 text-warning",
        text: `${days} day${days !== 1 ? 's' : ''}`,
      };
    } else {
      return {
        class: "bg-green-100 text-success",
        text: `${days} day${days !== 1 ? 's' : ''}`,
      };
    }
  };
  
  return (
    <Card className="bg-neutral-50 border border-neutral-200 mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-neutral-700 font-heading text-lg">Upcoming Deadlines</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeletons
            Array(2).fill(0).map((_, index) => (
              <div key={index} className="bg-white border border-neutral-200 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : deadlines && deadlines.length > 0 ? (
            deadlines.map((deadline: Deadline) => {
              const badge = getDeadlineBadge(deadline.dueDate.toString());
              
              return (
                <div key={deadline.id} className="bg-white border border-neutral-200 p-3 rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-neutral-700">{deadline.title}</span>
                    <span className={`${badge.class} px-2 py-1 rounded-full text-xs`}>
                      {badge.text}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600">
                    Due: {format(new Date(deadline.dueDate), "MMMM d, yyyy")}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-neutral-200 p-4 rounded-lg text-center text-neutral-500">
              No upcoming deadlines.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingDeadlines;
