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
  TooltipProps,
  Cell
} from "recharts";
import { ServiceProfitabilityData } from "@/hooks/use-analytics-data";
import { Skeleton } from "@/components/ui/skeleton";

interface ServiceProfitabilityChartProps {
  data?: ServiceProfitabilityData[];
  isLoading: boolean;
}

export function ServiceProfitabilityChart({ data = [], isLoading }: ServiceProfitabilityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Profitability</CardTitle>
          <CardDescription>Revenue, cost, and profit margin by service</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  // Sort by profitability (profit margin) descending
  const sortedData = [...data].sort((a, b) => b.profitMargin - a.profitMargin);
  
  // Calculate colors based on profit margin
  const getMarginColor = (margin: number) => {
    if (margin >= 0.4) return "#10b981"; // good margin (green)
    if (margin >= 0.2) return "#f59e0b"; // ok margin (amber)
    return "#ef4444"; // poor margin (red)
  };
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      const service = data.find(s => s.serviceName === label);
      if (!service) return null;
      
      return (
        <div className="bg-white p-4 rounded-md shadow-md border">
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-gray-500">{service.category}</p>
          <div className="mt-2">
            <p className="text-sm">Revenue: ${service.revenue.toLocaleString()}</p>
            <p className="text-sm">Cost: ${service.cost.toLocaleString()}</p>
            <p className="text-sm">Hours: {service.hours.toLocaleString()}</p>
            <p className="text-sm">Effective Rate: ${service.effectiveRate.toLocaleString()}/hr</p>
          </div>
          <p className="text-sm font-medium mt-1">Profit Margin: {(service.profitMargin * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Profitability</CardTitle>
        <CardDescription>Analyze profit margins across your service offerings</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sortedData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
            layout="vertical"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
            <YAxis dataKey="serviceName" type="category" width={120} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="profitMargin" name="Profit Margin" radius={[0, 4, 4, 0]}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getMarginColor(entry.profitMargin)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}