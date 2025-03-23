import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  TooltipProps,
  Area,
  AreaChart,
  ReferenceLine
} from "recharts";
import { RevenueForecastData } from "@/hooks/use-analytics-data";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueForecastChartProps {
  data?: RevenueForecastData[];
  isLoading: boolean;
}

export function RevenueForecastChart({ data = [], isLoading }: RevenueForecastChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Forecast</CardTitle>
          <CardDescription>Projected vs. confirmed revenue by period</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <Skeleton className="w-full h-full" />
        </CardContent>
      </Card>
    );
  }

  // Group data by period and calculate total projections and confirmations
  const aggregatedData: { [key: string]: { period: string, projected: number, confirmed: number } } = {};
  
  data.forEach(item => {
    if (!aggregatedData[item.period]) {
      aggregatedData[item.period] = {
        period: item.period,
        projected: 0,
        confirmed: 0
      };
    }
    
    aggregatedData[item.period].projected += item.projected;
    aggregatedData[item.period].confirmed += item.confirmed;
  });
  
  const chartData = Object.values(aggregatedData);
  
  // Add predicted total for analysis
  const chartDataWithTotal = chartData.map(item => ({
    ...item,
    total: item.projected + item.confirmed
  }));

  // Calculate target line (average of total)
  const targetLine = chartDataWithTotal.reduce((sum, item) => sum + item.total, 0) / 
                    (chartDataWithTotal.length || 1);

  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-md shadow-md border">
          <p className="font-semibold">{label}</p>
          <p className="text-sm text-gray-600">Confirmed: ${payload[0].value.toLocaleString()}</p>
          <p className="text-sm text-gray-600">Projected: ${payload[1].value.toLocaleString()}</p>
          <p className="text-sm font-medium mt-1">Total: ${(payload[0].value + payload[1].value).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Forecast</CardTitle>
        <CardDescription>Projected vs. confirmed revenue by period</CardDescription>
      </CardHeader>
      <CardContent className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartDataWithTotal}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={targetLine} label="Target" stroke="#ff7300" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="confirmed" stackId="1" stroke="#4f46e5" fill="#c7d2fe" />
            <Area type="monotone" dataKey="projected" stackId="1" stroke="#8b5cf6" fill="#ddd6fe" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}