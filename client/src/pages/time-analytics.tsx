import { TimeAnalyticsDashboard } from "@/components/time-analytics/TimeAnalyticsDashboard";

export default function TimeAnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Time Analytics</h1>
        <p className="text-muted-foreground mt-2">
          Analyze time allocation, project efficiency, and budget performance
        </p>
      </div>
      
      <TimeAnalyticsDashboard />
    </div>
  );
}