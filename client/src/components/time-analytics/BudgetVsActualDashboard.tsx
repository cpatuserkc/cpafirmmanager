import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { InsightBarChart } from "./InsightBarChart";
import { InsightPieChart } from "./InsightPieChart";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { ClipboardCheck, Clock, Clock4, Users, AlertCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Demo data for projects
const demoProjects = [
  { id: 1, name: "Adams Family Tax Return" },
  { id: 2, name: "D. White Business Advisement" },
  { id: 3, name: "Jackson LLC Audit" },
  { id: 4, name: "Martinez Financial Review" },
];

// Sample data structure
interface BudgetVsActualDataPoint {
  phaseName: string;
  budgetHours: number;
  actualHours: number;
  budgetCost: number;
  actualCost: number;
  efficiency: number;
  assignedTo: string;
  startDate: string;
  endDate: string;
  status: string;
}

interface StaffPerformance {
  name: string;
  role: string;
  budgetHours: number;
  actualHours: number;
  efficiency: number;
  projectCount: number;
  phaseCount: number;
}

interface DashboardSummary {
  totalBudgetHours: number;
  totalActualHours: number;
  totalBudgetCost: number;
  totalActualCost: number;
  avgEfficiency: number;
  avgBudgetVariance: number;
  completedPhases: number;
  inProgressPhases: number;
  notStartedPhases: number;
  totalPhases: number;
}

interface ProjectBudgetData {
  projectId: number;
  projectName: string;
  phases: BudgetVsActualDataPoint[];
  staffPerformance: StaffPerformance[];
  summary: DashboardSummary;
}

const BudgetVsActualDashboard = () => {
  const [selectedProject, setSelectedProject] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Fetch data for the selected project
  const { data, isLoading, isError } = useQuery<ProjectBudgetData>({
    queryKey: ["/api/time-analytics/budget-actual", selectedProject],
    queryFn: async () => {
      // In a real app, we would fetch from the API
      // For demo, we'll return mock data
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      
      return {
        projectId: selectedProject,
        projectName: demoProjects.find(p => p.id === selectedProject)?.name || "",
        phases: [
          {
            phaseName: "Initial Consultation",
            budgetHours: 10,
            actualHours: 12,
            budgetCost: 1500,
            actualCost: 1800,
            efficiency: 83,
            assignedTo: "John Smith",
            startDate: "2024-02-01",
            endDate: "2024-02-15",
            status: "completed"
          },
          {
            phaseName: "Document Collection",
            budgetHours: 15,
            actualHours: 20,
            budgetCost: 2250,
            actualCost: 3000,
            efficiency: 75,
            assignedTo: "Emily Johnson",
            startDate: "2024-02-16",
            endDate: "2024-03-01",
            status: "completed"
          },
          {
            phaseName: "Tax Preparation",
            budgetHours: 25,
            actualHours: 28,
            budgetCost: 3750,
            actualCost: 4200,
            efficiency: 89,
            assignedTo: "Robert Chen",
            startDate: "2024-03-02",
            endDate: "2024-03-20",
            status: "completed"
          },
          {
            phaseName: "Review & Quality Check",
            budgetHours: 8,
            actualHours: 6,
            budgetCost: 1600,
            actualCost: 1200,
            efficiency: 133,
            assignedTo: "Maria Garcia",
            startDate: "2024-03-21",
            endDate: "2024-03-28",
            status: "completed"
          },
          {
            phaseName: "Client Review Meeting",
            budgetHours: 4,
            actualHours: 4.5,
            budgetCost: 800,
            actualCost: 900,
            efficiency: 89,
            assignedTo: "John Smith",
            startDate: "2024-03-29",
            endDate: "2024-04-01",
            status: "in_progress"
          },
          {
            phaseName: "Final Filing",
            budgetHours: 3,
            actualHours: 0,
            budgetCost: 450,
            actualCost: 0,
            efficiency: 0,
            assignedTo: "Emily Johnson",
            startDate: "2024-04-02",
            endDate: "2024-04-05",
            status: "not_started"
          }
        ],
        staffPerformance: [
          {
            name: "John Smith",
            role: "Senior CPA",
            budgetHours: 14,
            actualHours: 16.5,
            efficiency: 85,
            projectCount: 1,
            phaseCount: 2
          },
          {
            name: "Emily Johnson",
            role: "Tax Specialist",
            budgetHours: 18,
            actualHours: 20,
            efficiency: 90,
            projectCount: 1,
            phaseCount: 2
          },
          {
            name: "Robert Chen",
            role: "Staff Accountant",
            budgetHours: 25,
            actualHours: 28,
            efficiency: 89,
            projectCount: 1,
            phaseCount: 1
          },
          {
            name: "Maria Garcia",
            role: "Senior Manager",
            budgetHours: 8,
            actualHours: 6,
            efficiency: 133,
            projectCount: 1,
            phaseCount: 1
          }
        ],
        summary: {
          totalBudgetHours: 65,
          totalActualHours: 70.5,
          totalBudgetCost: 10350,
          totalActualCost: 11100,
          avgEfficiency: 92.2,
          avgBudgetVariance: 8.5,
          completedPhases: 4,
          inProgressPhases: 1,
          notStartedPhases: 1,
          totalPhases: 6
        }
      };
    },
    enabled: !!selectedProject,
  });

  // Chart data for budget vs actual phases
  const phaseChartData = {
    labels: data?.phases.map(phase => phase.phaseName) || [],
    datasets: [
      {
        label: 'Budget Hours',
        data: data?.phases.map(phase => phase.budgetHours) || [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Actual Hours',
        data: data?.phases.map(phase => phase.actualHours) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Chart data for staff performance
  const staffChartData = {
    labels: data?.staffPerformance.map(staff => staff.name) || [],
    datasets: [
      {
        label: 'Budget Hours',
        data: data?.staffPerformance.map(staff => staff.budgetHours) || [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Actual Hours',
        data: data?.staffPerformance.map(staff => staff.actualHours) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  // Pie chart data for phase statuses
  const statusPieData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [{
      data: data ? [
        data.summary.completedPhases, 
        data.summary.inProgressPhases, 
        data.summary.notStartedPhases
      ] : [0, 0, 0],
      backgroundColor: [
        'rgba(75, 192, 192, 0.6)',
        'rgba(255, 159, 64, 0.6)',
        'rgba(201, 203, 207, 0.6)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(201, 203, 207, 1)'
      ],
      borderWidth: 1,
    }]
  };

  // Functions to generate insight cards
  const generatePhaseInsight = (index: number, datasetIndex: number, label: string, value: number) => {
    if (!data || !data.phases[index]) return {
      title: "No data available",
      value: "0",
      description: "No phase data found",
      type: "hours" as const,
      detailsKeys: []
    };
    
    const phase = data.phases[index];
    const isActual = datasetIndex === 1;
    const budgetHours = phase.budgetHours;
    const actualHours = phase.actualHours;
    const variance = actualHours - budgetHours;
    const variancePercent = ((actualHours / budgetHours) * 100) - 100;
    
    return {
      title: `${phase.phaseName} ${isActual ? 'Actual' : 'Budget'}`,
      value: value.toFixed(1),
      valueSuffix: " hours",
      description: isActual 
        ? `This is ${Math.abs(variance).toFixed(1)} hours ${variance >= 0 ? 'over' : 'under'} budget (${Math.abs(variancePercent).toFixed(1)}%)`
        : `The budgeted time for this phase`,
      type: "variance" as const,
      efficiency: `${phase.efficiency}%`,
      assignedTo: phase.assignedTo,
      status: phase.status.replace('_', ' '),
      dates: `${format(new Date(phase.startDate), 'MMM d')} - ${format(new Date(phase.endDate), 'MMM d, yyyy')}`,
      detailsKeys: ['efficiency', 'assignedTo', 'status', 'dates']
    };
  };
  
  const generateStaffInsight = (index: number, datasetIndex: number, label: string, value: number) => {
    if (!data || !data.staffPerformance[index]) return {
      title: "No data available",
      value: "0",
      description: "No staff data found",
      type: "hours" as const,
      detailsKeys: []
    };
    
    const staff = data.staffPerformance[index];
    const isActual = datasetIndex === 1;
    const budgetHours = staff.budgetHours;
    const actualHours = staff.actualHours;
    const variance = actualHours - budgetHours;
    const variancePercent = ((actualHours / budgetHours) * 100) - 100;
    
    return {
      title: `${staff.name} ${isActual ? 'Actual' : 'Budget'}`,
      value: value.toFixed(1),
      valueSuffix: " hours",
      description: isActual 
        ? `This is ${Math.abs(variance).toFixed(1)} hours ${variance >= 0 ? 'over' : 'under'} budget (${Math.abs(variancePercent).toFixed(1)}%)`
        : `The budgeted time for this staff member`,
      type: "utilization" as const,
      role: staff.role,
      efficiency: `${staff.efficiency}%`,
      phases: staff.phaseCount.toString(),
      averageHours: (staff.actualHours / staff.phaseCount).toFixed(1),
      detailsKeys: ['role', 'efficiency', 'phases', 'averageHours']
    };
  };
  
  const generateStatusInsight = (index: number, label: string, value: number) => {
    if (!data) return {
      title: "No data available",
      value: "0",
      description: "No status data found",
      type: "hours" as const,
      detailsKeys: []
    };
    
    const totalPhases = data.summary.totalPhases;
    const percentOfTotal = ((value / totalPhases) * 100).toFixed(1);
    
    const descriptions = [
      `${percentOfTotal}% of project phases are complete`,
      `${percentOfTotal}% of project phases are currently in progress`,
      `${percentOfTotal}% of project phases have not yet started`
    ];
    
    return {
      title: `${label} Phases`,
      value: value.toString(),
      valueSuffix: ` (${percentOfTotal}%)`,
      description: descriptions[index],
      type: (index === 0 ? "hours" : index === 1 ? "variance" : "revenue") as "hours" | "variance" | "revenue",
      percentComplete: `${(data.summary.completedPhases / totalPhases * 100).toFixed(1)}%`,
      totalHours: index === 0 
        ? data.phases.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.actualHours, 0).toFixed(1)
        : index === 1
          ? data.phases.filter(p => p.status === 'in_progress').reduce((sum, p) => sum + p.actualHours, 0).toFixed(1)
          : '0',
      remainingHours: data.phases.filter(p => p.status !== 'completed').reduce((sum, p) => sum + p.budgetHours, 0).toFixed(1),
      estimatedCompletion: index === 2 ? "Apr 5, 2024" : "N/A",
      detailsKeys: index === 2 
        ? ['percentComplete', 'remainingHours', 'estimatedCompletion'] 
        : ['percentComplete', 'totalHours', 'remainingHours']
    };
  };

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-500">Error loading data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>There was an error loading the budget vs. actual data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Budget vs. Actual Analysis</h2>
          <p className="text-muted-foreground">
            Compare budgeted time and actual time spent on projects and phases
          </p>
        </div>
        
        <div className="w-full lg:w-64">
          <Select 
            value={selectedProject.toString()} 
            onValueChange={(value) => setSelectedProject(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {demoProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Budget vs. Actual Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold">
                    {data.summary.totalActualHours.toFixed(1)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    of {data.summary.totalBudgetHours.toFixed(1)} budgeted
                  </div>
                </div>
                <div className="mt-1">
                  <Badge variant={data.summary.avgBudgetVariance > 15 ? "destructive" : 
                                 data.summary.avgBudgetVariance > 5 ? "outline" : "default"}>
                    {data.summary.totalActualHours > data.summary.totalBudgetHours ? "+" : ""}
                    {(data.summary.totalActualHours - data.summary.totalBudgetHours).toFixed(1)} hours
                    ({((data.summary.totalActualHours / data.summary.totalBudgetHours * 100) - 100).toFixed(1)}%)
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Overall Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold">
                    {data.summary.avgEfficiency.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    optimum target: 100%
                  </div>
                </div>
                <div className="mt-1">
                  <Badge variant={data.summary.avgEfficiency < 80 ? "destructive" : 
                                 data.summary.avgEfficiency < 90 ? "outline" : 
                                 data.summary.avgEfficiency > 110 ? "outline" : 
                                 "default"}>
                    {data.summary.avgEfficiency < 100 ? "Under budget" : 
                     data.summary.avgEfficiency > 100 ? "Over budget" : "On target"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold">
                    {Math.round(data.summary.completedPhases / data.summary.totalPhases * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {data.summary.completedPhases} of {data.summary.totalPhases} phases
                  </div>
                </div>
                <div className="mt-1 flex space-x-1">
                  <Badge variant="default">
                    {data.summary.completedPhases} Completed
                  </Badge>
                  <Badge variant="outline">
                    {data.summary.inProgressPhases} In Progress
                  </Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Budget Variance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline space-x-2">
                  <div className="text-2xl font-bold">
                    {data.summary.avgBudgetVariance.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    avg. across all phases
                  </div>
                </div>
                <div className="mt-1">
                  <Badge variant={data.summary.avgBudgetVariance > 15 ? "destructive" : 
                                 data.summary.avgBudgetVariance > 5 ? "outline" : 
                                 "default"}>
                    {data.summary.avgBudgetVariance <= 5 ? "Excellent" : 
                     data.summary.avgBudgetVariance <= 10 ? "Good" : 
                     data.summary.avgBudgetVariance <= 15 ? "Fair" : "Needs Attention"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Project Overview
              </TabsTrigger>
              <TabsTrigger value="phases">
                <Clock className="h-4 w-4 mr-2" />
                Phase Analysis
              </TabsTrigger>
              <TabsTrigger value="staff">
                <Users className="h-4 w-4 mr-2" />
                Staff Performance
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Project Phases Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <InsightBarChart 
                      data={phaseChartData}
                      insightGenerator={generatePhaseInsight}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Phase Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <InsightPieChart
                      data={statusPieData}
                      insightGenerator={generateStatusInsight}
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="phases" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Phase-by-Phase Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-3 text-left font-medium">Phase</th>
                          <th className="py-3 text-left font-medium">Status</th>
                          <th className="py-3 text-right font-medium">Budget Hours</th>
                          <th className="py-3 text-right font-medium">Actual Hours</th>
                          <th className="py-3 text-right font-medium">Variance</th>
                          <th className="py-3 text-right font-medium">Efficiency</th>
                          <th className="py-3 text-left font-medium">Assigned To</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.phases.map((phase, index) => {
                          const variance = phase.actualHours - phase.budgetHours;
                          const variancePercent = ((phase.actualHours / phase.budgetHours) * 100) - 100;
                          
                          return (
                            <tr key={index} className="border-b hover:bg-neutral-50">
                              <td className="py-3">{phase.phaseName}</td>
                              <td className="py-3">
                                <Badge
                                  variant={
                                    phase.status === "completed" ? "default" :
                                    phase.status === "in_progress" ? "outline" : "secondary"
                                  }
                                >
                                  {phase.status.replace("_", " ")}
                                </Badge>
                              </td>
                              <td className="py-3 text-right">{phase.budgetHours.toFixed(1)}</td>
                              <td className="py-3 text-right">{phase.status === "not_started" ? "-" : phase.actualHours.toFixed(1)}</td>
                              <td className="py-3 text-right">
                                {phase.status === "not_started" ? "-" : (
                                  <span className={
                                    Math.abs(variancePercent) <= 5 ? "text-green-600" :
                                    Math.abs(variancePercent) <= 15 ? "text-amber-600" : "text-red-600"
                                  }>
                                    {variance >= 0 ? "+" : ""}{variance.toFixed(1)} ({variancePercent.toFixed(1)}%)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 text-right">
                                {phase.status === "not_started" ? "-" : (
                                  <span className={
                                    phase.efficiency >= 95 ? "text-green-600" :
                                    phase.efficiency >= 85 ? "text-amber-600" : "text-red-600"
                                  }>
                                    {phase.efficiency}%
                                  </span>
                                )}
                              </td>
                              <td className="py-3">{phase.assignedTo}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="staff" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg">Staff Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <InsightBarChart 
                      data={staffChartData}
                      insightGenerator={generateStaffInsight}
                    />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Staff Efficiency</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {data.staffPerformance.map((staff, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">{staff.name}</div>
                              <div className="text-sm text-neutral-500">{staff.role}</div>
                            </div>
                            <Badge
                              variant={
                                staff.efficiency >= 95 ? "default" :
                                staff.efficiency >= 85 ? "outline" : "destructive"
                              }
                            >
                              {staff.efficiency}%
                            </Badge>
                          </div>
                          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                staff.efficiency >= 95 ? "bg-green-500" :
                                staff.efficiency >= 85 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${Math.min(100, staff.efficiency)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      ) : null}
    </div>
  );
};

export default BudgetVsActualDashboard;