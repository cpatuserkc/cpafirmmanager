import { useState, useCallback } from 'react';

type InsightType = 'revenue' | 'hours' | 'utilization' | 'clients' | 'alert';

interface InsightData {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  type: InsightType;
  details?: {
    label: string;
    value: string | number;
  }[];
}

interface TooltipState {
  visible: boolean;
  data: InsightData | null;
  position: { x: number; y: number };
}

export function useInsightTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    data: null,
    position: { x: 0, y: 0 }
  });

  const showTooltip = useCallback((data: InsightData, event: React.MouseEvent) => {
    // Calculate position - offset from cursor
    const x = event.clientX + 10;
    const y = event.clientY + 10;
    
    setTooltip({
      visible: true,
      data,
      position: { x, y }
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const updatePosition = useCallback((event: React.MouseEvent) => {
    if (tooltip.visible) {
      const x = event.clientX + 10;
      const y = event.clientY + 10;
      
      setTooltip(prev => ({
        ...prev,
        position: { x, y }
      }));
    }
  }, [tooltip.visible]);

  // Helper function to generate insight data
  const generateInsightData = useCallback((
    type: InsightType, 
    data: any, 
    options: { 
      title?: string;
      valueKey?: string;
      valuePrefix?: string;
      valueSuffix?: string;
      description?: string;
      compareKey?: string;
      previousPeriod?: any;
      detailsKeys?: string[];
    } = {}
  ): InsightData => {
    const {
      title,
      valueKey = 'value',
      valuePrefix = '',
      valueSuffix = '',
      description = '',
      compareKey,
      previousPeriod,
      detailsKeys = []
    } = options;
    
    let generatedTitle = title || '';
    let value = data[valueKey] || 0;
    let formattedValue = `${valuePrefix}${value}${valueSuffix}`;
    let trendValue: string | number | undefined;
    let trend: 'up' | 'down' | 'neutral' | undefined;
    
    // Calculate trend if we have comparison data
    if (compareKey && previousPeriod) {
      const currentValue = data[compareKey];
      const previousValue = previousPeriod[compareKey];
      
      if (currentValue !== undefined && previousValue !== undefined) {
        const difference = currentValue - previousValue;
        
        // Define trend direction
        if (difference > 0) {
          trend = 'up';
        } else if (difference < 0) {
          trend = 'down';
        } else {
          trend = 'neutral';
        }
        
        // Format as percentage or absolute value
        if (previousValue !== 0) {
          const percentChange = (difference / previousValue) * 100;
          trendValue = `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%`;
        } else {
          trendValue = difference;
        }
      }
    }
    
    // Generate details array if keys provided
    const details = detailsKeys.map(key => {
      const detailValue = data[key] || 0;
      return {
        label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
        value: detailValue
      };
    });
    
    return {
      title: generatedTitle,
      value: formattedValue,
      description,
      trend,
      trendValue,
      type,
      details: details.length > 0 ? details : undefined
    };
  }, []);
  
  return {
    tooltipState: tooltip,
    showTooltip,
    hideTooltip,
    updatePosition,
    generateInsightData
  };
}