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
  ReferenceLine,
  TooltipProps
} from "recharts";
import { ClientProfitabilityData } from "@/hooks/use-analytics-data";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientProfitabilityChartProps {
  data?: ClientProfitabilityData[];
  isLoading: boolean;
}

export function ClientProfitabilityChart({ data = [], isLoading }: ClientProfitabilityChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Client Profitability</CardTitle>
          <CardDescription>Revenue, cost, and profit margin by client</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  // Sort data by profit margin descending
  const sortedData = [...data].sort((a, b) => b.profitMargin - a.profitMargin);
  
  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      const clientData = data.find(c => c.clientName === label);
      if (!clientData) return null;
      
      return (
        <div className="bg-white p-4 rounded-md shadow-md border">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-gray-600">Revenue: ${clientData.revenue.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Cost: ${clientData.cost.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Profit: ${clientData.profit.toLocaleString()}</p>
          <p className="text-sm font-medium mt-1">Profit Margin: {(clientData.profitMargin * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  // Calculate average profit margin for reference line
  const avgProfitMargin = data.reduce((sum, client) => sum + client.profitMargin, 0) / 
                         (data.length || 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Profitability</CardTitle>
        <CardDescription>Revenue, cost, and profit margin by client</CardDescription>
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
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="clientName" />
            <YAxis yAxisId="left" orientation="left" />
            <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tickFormatter={(value) => `${(value * 100).toFixed(0)}%`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenue" />
            <Bar yAxisId="left" dataKey="cost" fill="#ef4444" name="Cost" />
            <Bar yAxisId="right" dataKey="profitMargin" fill="#10b981" name="Profit Margin" />
            <ReferenceLine yAxisId="right" y={avgProfitMargin} label="Avg Margin" stroke="#f59e0b" strokeDasharray="3 3" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}