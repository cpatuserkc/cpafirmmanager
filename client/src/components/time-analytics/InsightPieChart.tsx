import { useState, useRef } from 'react';
import { Pie } from 'react-chartjs-2';
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

interface InsightPieChartProps {
  data: ChartData<'pie'>;
  height?: number;
  width?: number;
  options?: ChartOptions<'pie'>;
  insightGenerator: (
    index: number,
    label: string,
    value: number
  ) => InsightCardProps;
}

export const InsightPieChart = ({
  data,
  height = 400,
  width = 400,
  options = {},
  insightGenerator,
}: InsightPieChartProps) => {
  const [selectedSegment, setSelectedSegment] = useState<{
    index: number;
    value: number;
    label: string;
  } | null>(null);

  const chartRef = useRef<ChartJS>(null);

  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: true,
      },
      legend: {
        position: 'right',
        align: 'center',
      },
    },
    onClick: (event, elements) => {
      if (elements && elements.length > 0) {
        const { index } = elements[0];
        const value = data.datasets[0].data[index] as number;
        const label = data.labels?.[index]?.toString() || '';

        setSelectedSegment({ index, value, label });
      }
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // Generate insight for the selected segment
  const insight = selectedSegment
    ? insightGenerator(
        selectedSegment.index,
        selectedSegment.label,
        selectedSegment.value
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
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 h-full">
      <div style={{ height: `${height}px`, width: `${width}px` }}>
        <Pie ref={chartRef} data={data} options={mergedOptions} />
      </div>

      {insight ? (
        <div className="w-full lg:w-1/3">
          <Card className={`border ${getInsightColor(insight.type, insight.value)} shadow-sm`}>
            <CardContent className="p-4">
              <h4 className="font-medium text-lg">{insight.title}</h4>
              <p className="text-2xl font-bold mt-1 mb-2">
                {insight.valuePrefix}{insight.value}{insight.valueSuffix}
              </p>
              <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

              <div className="space-y-2 text-sm border-t pt-3">
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
      ) : (
        <div className="w-full lg:w-1/3">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-muted-foreground">
                Click on a segment in the chart to see detailed information
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};