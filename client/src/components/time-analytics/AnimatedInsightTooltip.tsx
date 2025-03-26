import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart as BarChartIcon,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightData {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string | number;
  type: 'revenue' | 'hours' | 'utilization' | 'clients' | 'alert';
  details?: {
    label: string;
    value: string | number;
  }[];
}

interface AnimatedInsightTooltipProps {
  data: InsightData;
  visible: boolean;
  position?: { x: number; y: number };
  onClose?: () => void;
}

export const AnimatedInsightTooltip: React.FC<AnimatedInsightTooltipProps> = ({
  data,
  visible,
  position = { x: 0, y: 0 },
  onClose
}) => {
  const [expanded, setExpanded] = useState(false);
  
  useEffect(() => {
    if (!visible) {
      setExpanded(false);
    }
  }, [visible]);

  const getIcon = () => {
    switch (data.type) {
      case 'revenue':
        return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'hours':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'utilization':
        return <BarChartIcon className="h-4 w-4 text-indigo-500" />;
      case 'clients':
        return <Users className="h-4 w-4 text-violet-500" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4 text-amber-500" />;
      default:
        return <BarChartIcon className="h-4 w-4" />;
    }
  };

  const getTrendIcon = () => {
    switch (data.trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-emerald-500" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-rose-500" />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (data.type) {
      case 'revenue':
        return 'bg-emerald-50 dark:bg-emerald-950/30';
      case 'hours':
        return 'bg-blue-50 dark:bg-blue-950/30';
      case 'utilization':
        return 'bg-indigo-50 dark:bg-indigo-950/30';
      case 'clients':
        return 'bg-violet-50 dark:bg-violet-950/30';
      case 'alert':
        return 'bg-amber-50 dark:bg-amber-950/30';
      default:
        return 'bg-gray-50 dark:bg-gray-800/30';
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={cn(
            "absolute z-50 rounded-lg shadow-lg p-3 border border-muted w-64", 
            getBackgroundColor(),
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transformOrigin: 'top left'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            y: expanded ? -10 : 0,
          }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {getIcon()}
              <h3 className="font-medium text-sm">{data.title}</h3>
            </div>
            {onClose && (
              <button 
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground rounded-full h-5 w-5 flex items-center justify-center"
              >
                ×
              </button>
            )}
          </div>
          
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold">{data.value}</span>
              {data.trend && data.trendValue && (
                <div className="flex items-center text-xs gap-0.5">
                  {getTrendIcon()}
                  <span 
                    className={cn(
                      "font-medium",
                      data.trend === 'up' ? "text-emerald-500" : 
                      data.trend === 'down' ? "text-rose-500" : ""
                    )}
                  >
                    {data.trendValue}
                  </span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
          </div>
          
          {data.details && data.details.length > 0 && (
            <>
              <button 
                className="mt-2 text-xs flex items-center gap-0.5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setExpanded(!expanded)}
              >
                <motion.div
                  animate={{ rotate: expanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="h-3 w-3" />
                </motion.div>
                {expanded ? "Show less" : "Show details"}
              </button>
              
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 pt-2 border-t border-muted">
                      {data.details.map((detail, i) => (
                        <div key={i} className="flex justify-between text-xs py-1">
                          <span className="text-muted-foreground">{detail.label}</span>
                          <span className="font-medium">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};