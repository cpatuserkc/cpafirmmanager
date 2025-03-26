import React, { useRef, useState } from 'react';
import { Pie } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  ChartData,
  ChartOptions
} from 'chart.js';
import { AnimatedInsightTooltip } from './AnimatedInsightTooltip';
import { useInsightTooltip } from '@/hooks/use-insight-tooltip';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

interface InsightPieChartProps {
  data: ChartData<'pie'>;
  options?: ChartOptions<'pie'>;
  height?: number;
  width?: number;
  insightGenerator?: (
    index: number,
    label: string, 
    value: number
  ) => any;
  previousPeriodData?: any;
}

export const InsightPieChart: React.FC<InsightPieChartProps> = ({
  data,
  options = {},
  height = 300,
  width = 300,
  insightGenerator,
  previousPeriodData
}) => {
  const chartRef = useRef<ChartJS>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  
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
      const { index } = firstPoint;
      
      if (insightGenerator && activeIndex !== index) {
        setActiveIndex(index);
        
        const dataset = data.datasets[0]; // Pie chart typically has one dataset
        const label = data.labels?.[index] as string || '';
        const value = dataset.data[index] as number;
        
        // Get the insight data for this segment
        const insightData = insightGenerator(index, label, value);
        
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
      hideTooltip();
    }
  };
  
  const handleMouseLeave = () => {
    setActiveIndex(null);
    hideTooltip();
  };

  // Merge default options with provided options
  const defaultOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        enabled: false, // Disable the default tooltip
      },
      legend: {
        position: 'right' as const,
      }
    },
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full"
      style={{ height }}
      onMouseMove={handleHover}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex h-full items-center justify-center">
        <div style={{ width, height }}>
          <Pie 
            ref={chartRef}
            data={data} 
            options={mergedOptions}
          />
        </div>
      </div>
      
      <AnimatedInsightTooltip
        data={tooltipState.data!}
        visible={tooltipState.visible}
        position={tooltipState.position}
        onClose={hideTooltip}
      />
    </div>
  );
};