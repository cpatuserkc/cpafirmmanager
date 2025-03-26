import React, { useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Tooltip, 
  Legend, 
  ChartData,
  ChartOptions
} from 'chart.js';
import { AnimatedInsightTooltip } from './AnimatedInsightTooltip';
import { useInsightTooltip } from '@/hooks/use-insight-tooltip';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface InsightBarChartProps {
  data: ChartData<'bar'>;
  options?: ChartOptions<'bar'>;
  height?: number;
  insightGenerator?: (
    index: number, 
    datasetIndex: number, 
    label: string, 
    value: number
  ) => any;
  previousPeriodData?: any;
}

export const InsightBarChart: React.FC<InsightBarChartProps> = ({
  data,
  options = {},
  height = 300,
  insightGenerator,
  previousPeriodData
}) => {
  const chartRef = useRef<ChartJS>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeDatasetIndex, setActiveDatasetIndex] = useState<number | null>(null);
  
  const { 
    tooltipState, 
    showTooltip, 
    hideTooltip, 
    generateInsightData 
  } = useInsightTooltip();

  const handleHover = (event: React.MouseEvent) => {
    if (!chartRef.current) return;
    
    const chart = chartRef.current;
    const points = chart.getElementsAtEventForMode(
      event.nativeEvent,
      'nearest',
      { intersect: true },
      true
    );
    
    if (points.length > 0) {
      const firstPoint = points[0];
      const { datasetIndex, index } = firstPoint;
      
      if (
        insightGenerator && 
        activeIndex !== index || 
        activeDatasetIndex !== datasetIndex
      ) {
        setActiveIndex(index);
        setActiveDatasetIndex(datasetIndex);
        
        const dataset = data.datasets[datasetIndex];
        const label = data.labels?.[index] as string || '';
        const value = dataset.data[index] as number;
        
        // Get the insight data for this data point
        const insightData = insightGenerator(index, datasetIndex, label, value);
        
        // Calculate position relative to container
        const rect = containerRef.current?.getBoundingClientRect();
        const x = event.clientX - (rect?.left || 0);
        const y = event.clientY - (rect?.top || 0);
        
        // Show tooltip with this data
        showTooltip(
          generateInsightData(
            insightData.type || 'revenue',
            insightData,
            {
              title: insightData.title || label,
              valuePrefix: insightData.valuePrefix || '',
              valueSuffix: insightData.valueSuffix || '',
              description: insightData.description || '',
              compareKey: insightData.compareKey,
              previousPeriod: previousPeriodData,
              detailsKeys: insightData.detailsKeys || []
            }
          ),
          event
        );
      }
    } else if (activeIndex !== null) {
      setActiveIndex(null);
      setActiveDatasetIndex(null);
      hideTooltip();
    }
  };
  
  const handleMouseLeave = () => {
    setActiveIndex(null);
    setActiveDatasetIndex(null);
    hideTooltip();
  };

  // Merge default options with provided options
  const defaultOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: false, // Disable the default tooltip
      },
      legend: {
        position: 'top' as const,
      }
    },
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full"
      onMouseMove={handleHover}
      onMouseLeave={handleMouseLeave}
    >
      <Bar 
        ref={chartRef}
        data={data} 
        options={mergedOptions}
        height={height}
      />
      
      <AnimatedInsightTooltip
        data={tooltipState.data!}
        visible={tooltipState.visible}
        position={tooltipState.position}
        onClose={hideTooltip}
      />
    </div>
  );
};