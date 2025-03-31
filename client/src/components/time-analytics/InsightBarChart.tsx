import { useState, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Card, CardContent } from "@/components/ui/card";
import { Chart as ChartJS, ChartData, ChartOptions } from 'chart.js';

interface InsightCardProps {
  title: string;
  value: string;
  valuePrefix?: string;
  valueSuffix?: string;
  description: string;
  type: 'revenue' | 'hours' | 'utilization' | 'variance';
  detailsKeys: string[];
  [key: string]: any;
}

interface InsightBarChartProps {
  data: ChartData<'bar'>;
  height?: number;
  width?: number;
  options?: ChartOptions<'bar'>;
  insightGenerator: (
    index: number, 
    datasetIndex: number, 
    label: string, 
    value: number
  ) => InsightCardProps;
}

export const InsightBarChart = ({ 
  data, 
  height = 400, 
  width, 
  options = {},
  insightGenerator,
}: InsightBarChartProps) => {
  const [selectedBar, setSelectedBar] = useState<{
    index: number;
    datasetIndex: number;
    value: number;
    label: string;
  } | null>(null);
  
  const chartRef = useRef<ChartJS>(null);
  
  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      tooltip: {
        enabled: true,
        position: 'nearest',
      },
      legend: {
        position: 'top',
      },
    },
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const { datasetIndex, index } = elements[0];
        const value = data.datasets[datasetIndex].data[index] as number;
        const label = data.labels?.[index]?.toString() || '';
        
        setSelectedBar({ datasetIndex, index, value, label });
      }
    },
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Generate insight for the selected bar
  const insight = selectedBar 
    ? insightGenerator(
        selectedBar.index, 
        selectedBar.datasetIndex, 
        selectedBar.label, 
        selectedBar.value
      ) 
    : null;

  // Determine color based on insight type
  const getInsightColor = (type: string, value: number | string): string => {
    if (type === 'revenue') return 'bg-green-50 border-green-200';
    if (type === 'hours') return 'bg-blue-50 border-blue-200';
    if (type === 'utilization') {
      return Number(value) >= 85 
        ? 'bg-green-50 border-green-200' 
        : Number(value) >= 70 
          ? 'bg-yellow-50 border-yellow-200' 
          : 'bg-red-50 border-red-200';
    }
    if (type === 'variance') {
      return Number(value) <= 5 
        ? 'bg-green-50 border-green-200'
        : Number(value) <= 15 
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-red-50 border-red-200';
    }
    return 'bg-gray-50 border-gray-200';
  };

  return (
    <div className="relative w-full h-full">
      <div style={{ height: `${height}px`, width: width ? `${width}px` : '100%' }}>
        <Bar ref={chartRef} data={data} options={mergedOptions} />
      </div>
      
      {insight && (
        <div className="absolute top-16 right-4 w-64">
          <Card className={`border ${getInsightColor(insight.type, insight.value)} shadow-sm`}>
            <CardContent className="p-4">
              <h4 className="font-medium text-sm">{insight.title}</h4>
              <p className="text-xl font-bold mt-1 mb-2">
                {insight.valuePrefix}{insight.value}{insight.valueSuffix}
              </p>
              <p className="text-xs text-muted-foreground mb-3">{insight.description}</p>
              
              <div className="space-y-1 text-xs border-t pt-2">
                {insight.detailsKeys.map(key => (
                  <div key={key} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                    </span>
                    <span className="font-medium">{insight[key]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};