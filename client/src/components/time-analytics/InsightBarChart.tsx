import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart } from "@/components/ui/charts";

export interface InsightProps {
  title: string;
  value: string;
  valueSuffix?: string;
  description: string;
  type: "hours" | "variance" | "utilization" | "revenue";
  detailsKeys?: string[];
  [key: string]: any;
}

interface InsightBarChartProps {
  data: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string;
      borderColor: string;
      borderWidth?: number;
    }[];
  };
  insightGenerator: (
    index: number,
    datasetIndex: number,
    label: string,
    value: number
  ) => InsightProps;
  height?: number;
}

export function InsightBarChart({
  data,
  insightGenerator,
  height = 300
}: InsightBarChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState<number>(0);
  
  // Generate the insight based on selection
  const selectedLabel = data.labels[selectedIndex];
  const selectedValue = data.datasets[selectedDatasetIndex].data[selectedIndex];
  const insight = insightGenerator(selectedIndex, selectedDatasetIndex, selectedLabel, selectedValue);
  
  const handleBarClick = (event: React.MouseEvent, elements: any[]) => {
    if (elements.length === 0) return;
    const { datasetIndex, index } = elements[0];
    setSelectedIndex(index);
    setSelectedDatasetIndex(datasetIndex);
  };
  
  // Chart options with click handler
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}`;
          }
        }
      }
    },
    onClick: handleBarClick,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2">
        <div style={{ height: height }}>
          <BarChart data={data} options={chartOptions} />
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