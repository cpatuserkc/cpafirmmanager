import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps
} from "recharts";
import { StaffUtilizationData } from "@/hooks/use-analytics-data";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffUtilizationChartProps {
  data?: StaffUtilizationData[];
  isLoading: boolean;
}

export function StaffUtilizationChart({ data = [], isLoading }: StaffUtilizationChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Utilization by Role</CardTitle>
          <CardDescription>Capacity planning across professional tiers</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(role => ({
    name: role.roleName,
    "Top Tier Hours": role.topTierHours,
    "Top Tier Capacity": role.topTierCapacity,
    "Mid Tier Hours": role.midTierHours,
    "Mid Tier Capacity": role.midTierCapacity,
    "Low Tier Hours": role.lowTierHours,
    "Low Tier Capacity": role.lowTierCapacity,
    "Revenue": role.projectedRevenue
  }));

  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      const role = data.find(r => r.roleName === label);
      if (!role) return null;
      
      const topTierUtilization = role.topTierHours / (role.topTierCapacity || 1) * 100;
      const midTierUtilization = role.midTierHours / (role.midTierCapacity || 1) * 100;
      const lowTierUtilization = role.lowTierHours / (role.lowTierCapacity || 1) * 100;
      
      return (
        <div className="bg-white p-4 rounded-md shadow-md border">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-gray-600">Revenue: ${role.projectedRevenue.toLocaleString()}</p>
          <div className="mt-2">
            <p>Top Tier: {topTierUtilization.toFixed(1)}% utilized</p>
            <p>Mid Tier: {midTierUtilization.toFixed(1)}% utilized</p>
            <p>Low Tier: {lowTierUtilization.toFixed(1)}% utilized</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Utilization by Role</CardTitle>
        <CardDescription>Capacity planning across professional tiers</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="Top Tier Hours" stackId="hours" fill="#2563eb" />
            <Bar yAxisId="left" dataKey="Mid Tier Hours" stackId="hours" fill="#3b82f6" />
            <Bar yAxisId="left" dataKey="Low Tier Hours" stackId="hours" fill="#93c5fd" />
            <Bar yAxisId="left" dataKey="Top Tier Capacity" fill="#dc2626" opacity={0.7} />
            <Bar yAxisId="left" dataKey="Mid Tier Capacity" fill="#ef4444" opacity={0.7} />
            <Bar yAxisId="left" dataKey="Low Tier Capacity" fill="#fca5a5" opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}