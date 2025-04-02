import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart } from "@/components/ui/charts";
import { InsightProps } from './InsightBarChart';

interface InsightPieChartProps {
  data: {
    labels: string[];
    datasets: {
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
  insightGenerator: (
    index: number,
    label: string,
    value: number
  ) => InsightProps;
  height?: number;
}

export function InsightPieChart({
  data,
  insightGenerator,
  height = 300
}: InsightPieChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  
  // Generate the insight based on selection
  const selectedLabel = data.labels[selectedIndex];
  const selectedValue = data.datasets[0].data[selectedIndex];
  const insight = insightGenerator(selectedIndex, selectedLabel, selectedValue);
  
  const handlePieClick = (event: React.MouseEvent, elements: any[]) => {
    if (elements.length === 0) return;
    const { index } = elements[0];
    setSelectedIndex(index);
  };
  
  // Chart options with click handler
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = data.labels[context.dataIndex] || '';
            const value = context.parsed;
            return `${label}: ${value}`;
          }
        }
      }
    },
    onClick: handlePieClick
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <div style={{ height: height }}>
          <PieChart data={data} options={chartOptions} />
        </div>
      </div>
      <div>
        <Card className="h-full">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{insight.title}</CardTitle>
              <Badge variant={getVariantByType(insight.type)}>
                {getTypeLabel(insight.type)}
              </Badge>
            </div>
            <div className="text-3xl font-bold mt-2">
              {insight.value}
              {insight.valueSuffix && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {insight.valueSuffix}
                </span>
              )}
            </div>
            <CardDescription className="mt-1">{insight.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {insight.detailsKeys && (
              <div className="space-y-3">
                {insight.detailsKeys.map((key) => (
                  <div key={key} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="font-medium">{insight[key]}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper functions for styling
function getVariantByType(type: InsightProps['type']) {
  switch (type) {
    case 'hours':
      return 'default';
    case 'variance':
      return 'destructive';
    case 'utilization':
      return 'outline';
    case 'revenue':
      return 'secondary';
    default:
      return 'default';
  }
}

function getTypeLabel(type: InsightProps['type']) {
  switch (type) {
    case 'hours':
      return 'Hours';
    case 'variance':
      return 'Variance';
    case 'utilization':
      return 'Utilization';
    case 'revenue':
      return 'Revenue';
    default:
      return 'Info';
  }
}