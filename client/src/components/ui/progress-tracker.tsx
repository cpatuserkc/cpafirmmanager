import React from 'react';
import { CheckCircle, Clock, Upload, FileText, Download } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';

export interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  progress?: number;
}

interface ProgressTrackerProps {
  steps: ProgressStep[];
  currentStep: number;
  overallProgress: number;
}

const stepIcons = {
  upload: Upload,
  processing: FileText,
  analysis: Clock,
  complete: Download,
};

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  steps,
  currentStep,
  overallProgress,
}) => {
  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.status === 'completed') {
      return <CheckCircle className="w-6 h-6 text-green-500" />;
    }
    
    const IconComponent = stepIcons[step.id as keyof typeof stepIcons] || Clock;
    const iconClass = step.status === 'active' 
      ? 'w-6 h-6 text-blue-500 animate-pulse' 
      : step.status === 'error'
      ? 'w-6 h-6 text-red-500'
      : 'w-6 h-6 text-gray-400';
    
    return <IconComponent className={iconClass} />;
  };

  const getConnectorClass = (index: number) => {
    if (index >= steps.length - 1) return 'hidden';
    return steps[index].status === 'completed' 
      ? 'bg-green-500' 
      : 'bg-gray-300';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Upload Progress</h3>
            <span className="text-sm text-gray-600">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 relative">
                  <div className={`
                    w-12 h-12 rounded-full border-2 flex items-center justify-center
                    ${step.status === 'completed' 
                      ? 'border-green-500 bg-green-50' 
                      : step.status === 'active'
                      ? 'border-blue-500 bg-blue-50'
                      : step.status === 'error'
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-gray-50'
                    }
                  `}>
                    {getStepIcon(step, index)}
                  </div>
                  
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className={`
                      absolute top-12 left-1/2 transform -translate-x-1/2 
                      w-0.5 h-8 ${getConnectorClass(index)}
                    `} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`
                      text-sm font-medium
                      ${step.status === 'active' ? 'text-blue-600' : 'text-gray-900'}
                    `}>
                      {step.title}
                    </h4>
                    {step.status === 'active' && step.progress !== undefined && (
                      <span className="text-xs text-blue-600 font-medium">
                        {Math.round(step.progress)}%
                      </span>
                    )}
                  </div>
                  <p className={`
                    text-sm mt-1
                    ${step.status === 'active' ? 'text-blue-600' : 'text-gray-600'}
                  `}>
                    {step.description}
                  </p>
                  
                  {step.status === 'active' && step.progress !== undefined && (
                    <Progress value={step.progress} className="w-full mt-2 h-2" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgressTracker;