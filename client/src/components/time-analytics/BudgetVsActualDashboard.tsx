import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, DollarSign, CheckCircle2, AlertCircle } from "lucide-react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

import { InsightBarChart } from "./InsightBarChart";
import { InsightPieChart } from "./InsightPieChart";

// Mocked project data for the White Enterprises proposal
const projectData = {
  name: "White Enterprises - Tax Preparation 2024",
  clientName: "White Enterprises",
  status: "In Progress",
  startDate: "Jan 15, 2024",
  endDate: "Apr 15, 2024",
  totalEstimatedHours: 60,
  totalActualHours: 71,
  estimatedCost: 9000,
  actualCost: 10650,
  phases: [
    {
      name: "Planning & Information Gathering",
      estimatedHours: 12,
      actualHours: 10,
    },
    {
      name: "Initial Review & Analysis",
      estimatedHours: 15,
      actualHours: 18,
    },
    {
      name: "Preparation & Calculations",
      estimatedHours: 20,
      actualHours: 29,
    },
    {
      name: "Review & Quality Control",
      estimatedHours: 8,
      actualHours: 10,
    },
    {
      name: "Filing & Documentation",
      estimatedHours: 5,
      actualHours: 4,
    },
  ],
  staffPerformance: [
    {
      id: 1,
      name: "Jane Smith",
      initials: "JS",
      role: "Tax Specialist",
      avatar: null,
      estimatedHours: 25,
      actualHours: 22,
      variance: -3,
      variancePercent: -12,
      efficiency: 114,
    },
    {
      id: 2,
      name: "Michael Chen",
      initials: "MC",
      role: "Senior Accountant",
      avatar: null,
      estimatedHours: 15,
      actualHours: 14,
      variance: -1,
      variancePercent: -7,
      efficiency: 107,
    },
    {
      id: 3,
      name: "Robert Williams",
      initials: "RW",
      role: "Junior Accountant",
      avatar: null,
      estimatedHours: 12,
      actualHours: 17,
      variance: 5,
      variancePercent: 42,
      efficiency: 71,
    },
    {
      id: 4,
      name: "Sarah Johnson",
      initials: "SJ",
      role: "Bookkeeper",
      avatar: null,
      estimatedHours: 8,
      actualHours: 18,
      variance: 10,
      variancePercent: 125,
      efficiency: 44,
    },
  ],
};

export function BudgetVsActualDashboard() {
  const [selectedProject, setSelectedProject] = useState("white-enterprise");
  
  // Calculate completion percentage
  const completionPercentage = Math.round(
    (projectData.totalActualHours / projectData.totalEstimatedHours) * 100
  );
  
  // Calculate the variance in hours (positive means over budget)
  const hoursVariance = projectData.totalActualHours - projectData.totalEstimatedHours;
  
  // Calculate the variance percentage
  const hoursVariancePercentage = Math.round(
    (hoursVariance / projectData.totalEstimatedHours) * 100
  );
  
  // Calculate the cost variance (positive means over budget)
  const costVariance = projectData.actualCost - projectData.estimatedCost;
  
  // Calculate the cost variance percentage
  const costVariancePercentage = Math.round(
    (costVariance / projectData.estimatedCost) * 100
  );

  // Create phase chart data
  const phaseChartData = {
    labels: projectData.phases.map((phase) => phase.name),
    datasets: [
      {
        label: "Estimated Hours",
        data: projectData.phases.map((phase) => phase.estimatedHours),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Actual Hours",
        data: projectData.phases.map((phase) => phase.actualHours),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Create staff chart data
  const staffChartData = {
    labels: projectData.staffPerformance.map((staff) => staff.name),
    datasets: [
      {
        label: "Estimated Hours",
        data: projectData.staffPerformance.map((staff) => staff.estimatedHours),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
      {
        label: "Actual Hours",
        data: projectData.staffPerformance.map((staff) => staff.actualHours),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Create efficiency pie chart data
  const efficiencyData = {
    labels: ["Within Budget", "Over Budget", "Significantly Over Budget"],
    datasets: [
      {
        data: [2, 3, 1],
        backgroundColor: [
          "rgba(75, 192, 192, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(255, 99, 132, 0.7)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Phase chart insight generator
  const generatePhaseInsight = (
    index: number,
    datasetIndex: number,
    label: string,
    value: number
  ) => {
    const phase = projectData.phases[index];
    const variance = phase.actualHours - phase.estimatedHours;
    const variancePercentage = Math.round((variance / phase.estimatedHours) * 100);
    
    if (datasetIndex === 0) {
      // Estimated hours dataset
      return {
        title: label,
        value: `${phase.estimatedHours}`,
        valueSuffix: " hrs estimated",
        description: `Estimated hours for ${label} phase`,
        type: "hours" as const,
        detailsKeys: ["actualHours", "variance", "status"],
        actualHours: `${phase.actualHours} hrs`,
        variance: `${variance > 0 ? "+" : ""}${variance} hrs (${variancePercentage > 0 ? "+" : ""}${variancePercentage}%)`,
        status: variance <= 0 ? "Within Budget" : variancePercentage <= 25 ? "Over Budget" : "Significantly Over Budget",
      };
    } else {
      // Actual hours dataset
      return {
        title: label,
        value: `${phase.actualHours}`,
        valueSuffix: " hrs actual",
        description: `Actual hours spent on ${label} phase`,
        type: variance > 0 ? "variance" as const : "hours" as const,
        detailsKeys: ["estimatedHours", "variance", "status"],
        estimatedHours: `${phase.estimatedHours} hrs`,
        variance: `${variance > 0 ? "+" : ""}${variance} hrs (${variancePercentage > 0 ? "+" : ""}${variancePercentage}%)`,
        status: variance <= 0 ? "Within Budget" : variancePercentage <= 25 ? "Over Budget" : "Significantly Over Budget",
      };
    }
  };

  // Staff chart insight generator
  const generateStaffInsight = (
    index: number,
    datasetIndex: number,
    label: string,
    value: number
  ) => {
    const staff = projectData.staffPerformance[index];
    
    if (datasetIndex === 0) {
      // Estimated hours dataset
      return {
        title: label,
        value: `${staff.estimatedHours}`,
        valueSuffix: " hrs estimated",
        description: `Estimated hours for ${label}`,
        type: "hours" as const,
        detailsKeys: ["role", "actualHours", "efficiency"],
        role: staff.role,
        actualHours: `${staff.actualHours} hrs`,
        efficiency: `${staff.efficiency}%`,
      };
    } else {
      // Actual hours dataset
      return {
        title: label,
        value: `${staff.actualHours}`,
        valueSuffix: " hrs actual",
        description: `Actual hours spent by ${label}`,
        type: staff.variance > 0 ? "variance" as const : "hours" as const,
        detailsKeys: ["role", "estimatedHours", "variance", "efficiency"],
        role: staff.role,
        estimatedHours: `${staff.estimatedHours} hrs`,
        variance: `${staff.variance > 0 ? "+" : ""}${staff.variance} hrs (${staff.variancePercent > 0 ? "+" : ""}${staff.variancePercent}%)`,
        efficiency: `${staff.efficiency}%`,
      };
    }
  };

  // Efficiency pie chart insight generator
  const generateEfficiencyInsight = (
    index: number,
    label: string,
    value: number
  ) => {
    // Different insights based on the selected category
    if (label === "Within Budget") {
      return {
        title: "Within Budget",
        value: "2",
        valueSuffix: " staff members",
        description: "Staff members who completed work within or under estimated hours",
        type: "hours" as const,
        detailsKeys: ["efficiency", "bestPerformer"],
        efficiency: "95-110%",
        bestPerformer: "Michael Chen (111%)",
      };
    } else if (label === "Over Budget") {
      return {
        title: "Over Budget",
        value: "3",
        valueSuffix: " staff members",
        description: "Staff members who exceeded estimated hours by up to 25%",
        type: "variance" as const,
        detailsKeys: ["efficiency", "averageOverrun"],
        efficiency: "75-95%",
        averageOverrun: "15% over budget",
      };
    } else {
      return {
        title: "Significantly Over Budget",
        value: "1",
        valueSuffix: " staff member",
        description: "Staff members who exceeded estimated hours by more than 25%",
        type: "variance" as const,
        detailsKeys: ["efficiency", "worstPerformer"],
        efficiency: "< 75%",
        worstPerformer: "Robert Williams (71%)",
      };
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Project Overview</CardTitle>
            <CardDescription>
              {projectData.clientName} • {projectData.status}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectData.name}</div>
            <div className="flex items-center mt-4 space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {projectData.startDate} to {projectData.endDate}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Completion</span>
                <span>{completionPercentage}%</span>
              </div>
              <Progress value={completionPercentage} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Time Variance</CardTitle>
            <CardDescription>Estimated vs. Actual Hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {hoursVariance > 0 ? "+" : ""}{hoursVariance} hrs
              </div>
              <Badge variant={hoursVariance <= 0 ? "outline" : "destructive"} className="ml-2">
                {hoursVariancePercentage > 0 ? "+" : ""}{hoursVariancePercentage}%
              </Badge>
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <div>
                <div className="font-medium">Estimated</div>
                <div className="text-lg">{projectData.totalEstimatedHours} hrs</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Actual</div>
                <div className="text-lg">{projectData.totalActualHours} hrs</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground flex items-start">
              {hoursVariance > 0 ? (
                <AlertCircle className="h-4 w-4 mr-2 text-destructive mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
              )}
              <span>
                {hoursVariance > 0
                  ? `Project is currently ${hoursVariance} hours over budget.`
                  : `Project is currently ${Math.abs(hoursVariance)} hours under budget.`}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Cost Variance</CardTitle>
            <CardDescription>Estimated vs. Actual Cost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-2xl font-bold">
                {costVariance > 0 ? "+" : ""}{costVariance.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
              <Badge variant={costVariance <= 0 ? "outline" : "destructive"} className="ml-2">
                {costVariancePercentage > 0 ? "+" : ""}{costVariancePercentage}%
              </Badge>
            </div>
            <div className="flex justify-between mt-4 text-sm">
              <div>
                <div className="font-medium">Estimated</div>
                <div className="text-lg">{projectData.estimatedCost.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">Actual</div>
                <div className="text-lg">{projectData.actualCost.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground flex items-start">
              {costVariance > 0 ? (
                <DollarSign className="h-4 w-4 mr-2 text-destructive mt-0.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-500 mt-0.5" />
              )}
              <span>
                {costVariance > 0
                  ? `Project is currently ${costVariance.toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} over budget.`
                  : `Project is currently ${Math.abs(costVariance).toLocaleString('en-US', {
                      style: 'currency',
                      currency: 'USD',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })} under budget.`}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="phases" className="space-y-4">
        <TabsList>
          <TabsTrigger value="phases">Project Phases</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="phases" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Phase-by-Phase Analysis</CardTitle>
              <CardDescription>
                Comparing estimated vs. actual hours for each project phase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InsightBarChart 
                data={phaseChartData} 
                insightGenerator={generatePhaseInsight}
                height={350}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="staff" className="space-y-4 p-0">
          <Card>
            <CardHeader>
              <CardTitle>Staff Performance Analysis</CardTitle>
              <CardDescription>
                Comparing estimated vs. actual hours by staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InsightBarChart 
                data={staffChartData} 
                insightGenerator={generateStaffInsight}
                height={350}
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {projectData.staffPerformance.map((staff) => (
              <Card key={staff.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <Avatar className="h-10 w-10">
                      {staff.avatar && <AvatarImage src={staff.avatar} alt={staff.name} />}
                      <AvatarFallback>{staff.initials}</AvatarFallback>
                    </Avatar>
                    <Badge 
                      variant={staff.efficiency > 95 ? "outline" : staff.efficiency > 75 ? "secondary" : "destructive"}
                      className="ml-2"
                    >
                      {staff.efficiency}%
                    </Badge>
                  </div>
                  <div className="font-medium mt-2">{staff.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">{staff.role}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Est. Hours</div>
                      <div>{staff.estimatedHours}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Act. Hours</div>
                      <div>{staff.actualHours}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Variance</div>
                      <div>{staff.variance > 0 ? "+" : ""}{staff.variance}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Var %</div>
                      <div>{staff.variancePercent > 0 ? "+" : ""}{staff.variancePercent}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="efficiency" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Staff Efficiency Distribution</CardTitle>
              <CardDescription>
                Analysis of staff performance against time budgets
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full md:w-[600px]">
                <InsightPieChart 
                  data={efficiencyData} 
                  insightGenerator={generateEfficiencyInsight}
                  height={350}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default BudgetVsActualDashboard;