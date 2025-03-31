import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "../../App";
import { getQueryFn } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { 
  Percent, 
  AlertCircle, 
  CheckCircle, 
  TrendingDown, 
  TrendingUp, 
  BarChart3,
  Clock,
  Users,
  Layers
} from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import { InsightBarChart } from './InsightBarChart';

// Define types for our budget vs actual data
interface ProjectPhase {
  id: number;
  name: string;
  budgetHours: number;
  actualHours: number;
  variance: number;
  variancePercent: number;
  status: 'on_budget' | 'over_budget' | 'under_budget';
}

interface StaffPerformance {
  id: number;
  name: string;
  role: string;
  budgetHours: number;
  actualHours: number;
  variance: number;
  variancePercent: number;
  efficiency: number;
}

interface ProjectDetails {
  id: number;
  name: string;
  client: string;
  totalBudgetHours: number;
  totalActualHours: number;
  totalVariance: number;
  totalVariancePercent: number;
  status: 'completed' | 'in_progress' | 'not_started';
  startDate: string;
  endDate: string;
  phases: ProjectPhase[];
  staffPerformance: StaffPerformance[];
}

interface BudgetVsActualResponse {
  projects: ProjectDetails[];
  summary: {
    totalProjects: number;
    projectsOnBudget: number;
    projectsOverBudget: number;
    projectsUnderBudget: number;
    avgBudgetVariance: number;
    mostOverBudgetPhase: string;
    mostEfficientStaff: string;
    leastEfficientStaff: string;
  };
  recentlyCompletedProjects: {
    id: number;
    name: string;
    client: string;
    budgetHours: number;
    actualHours: number;
    variance: number;
    variancePercent: number;
  }[];
  topProblematicPhases: {
    name: string;
    avgVariancePercent: number;
    occurrences: number;
  }[];
  staffEfficiency: {
    name: string;
    role: string;
    efficiency: number;
  }[];
}

const BudgetVsActualDashboard = () => {
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().getFullYear(), 0, 1)); // January 1 of current year
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const firmId = user?.id || 1; // Using user id until we implement proper firm selection

  const queryFn = getQueryFn({ on401: 'throw' });

  // Fetch budget vs actual data
  const { data, isLoading, error } = useQuery<BudgetVsActualResponse>({
    queryKey: ['/api/budget-vs-actual', firmId, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const result = await queryFn(`/api/budget-vs-actual?firmId=${firmId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
      return result as BudgetVsActualResponse;
    },
    enabled: !!firmId,
  });

  // Get selected project details
  const selectedProjectDetails = selectedProject 
    ? data?.projects.find(p => p.id === selectedProject)
    : null;

  // Chart colors
  const colors = {
    blue: ['rgba(53, 162, 235, 0.8)', 'rgba(53, 162, 235, 0.4)'],
    green: ['rgba(75, 192, 192, 0.8)', 'rgba(75, 192, 192, 0.4)'],
    orange: ['rgba(255, 159, 64, 0.8)', 'rgba(255, 159, 64, 0.4)'],
    purple: ['rgba(153, 102, 255, 0.8)', 'rgba(153, 102, 255, 0.4)'],
    red: ['rgba(255, 99, 132, 0.8)', 'rgba(255, 99, 132, 0.4)'],
  };

  // Prepare chart data for budget vs actual comparison
  const budgetVsActualData = {
    labels: selectedProjectDetails?.phases.map(phase => phase.name) || [],
    datasets: [
      {
        label: 'Budget Hours',
        data: selectedProjectDetails?.phases.map(phase => phase.budgetHours) || [],
        backgroundColor: colors.blue[1],
        borderColor: colors.blue[0],
        borderWidth: 1,
      },
      {
        label: 'Actual Hours',
        data: selectedProjectDetails?.phases.map(phase => phase.actualHours) || [],
        backgroundColor: colors.orange[1],
        borderColor: colors.orange[0],
        borderWidth: 1,
      },
    ],
  };

  // Staff performance chart data
  const staffPerformanceData = {
    labels: selectedProjectDetails?.staffPerformance.map(staff => staff.name) || [],
    datasets: [
      {
        label: 'Budget Hours',
        data: selectedProjectDetails?.staffPerformance.map(staff => staff.budgetHours) || [],
        backgroundColor: colors.blue[1],
        borderColor: colors.blue[0],
        borderWidth: 1,
      },
      {
        label: 'Actual Hours',
        data: selectedProjectDetails?.staffPerformance.map(staff => staff.actualHours) || [],
        backgroundColor: colors.orange[1],
        borderColor: colors.orange[0],
        borderWidth: 1,
      },
    ],
  };

  // Problem phases chart
  const problematicPhasesData = {
    labels: data?.topProblematicPhases.map(phase => phase.name) || [],
    datasets: [
      {
        label: 'Avg. Variance %',
        data: data?.topProblematicPhases.map(phase => phase.avgVariancePercent) || [],
        backgroundColor: colors.red[1],
        borderColor: colors.red[0],
        borderWidth: 1,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4">Loading budget comparison data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading budget comparison data. Please try again later.</p>
      </div>
    );
  }

  // Helper function to render variance badges
  const renderVarianceBadge = (variance: number, variancePercent: number) => {
    if (variancePercent <= 5 && variancePercent >= -5) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" /> On Budget
        </Badge>
      );
    } else if (variancePercent < 0) {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <TrendingDown className="h-3 w-3 mr-1" /> Under ({variancePercent.toFixed(1)}%)
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <TrendingUp className="h-3 w-3 mr-1" /> Over ({variancePercent.toFixed(1)}%)
        </Badge>
      );
    }
  };

  // Helper function to determine color based on variance
  const getVarianceColor = (variancePercent: number) => {
    if (variancePercent <= 5 && variancePercent >= -5) {
      return 'text-green-600';
    } else if (variancePercent < 0) {
      return 'text-blue-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Budget vs. Actual Time Analysis</CardTitle>
          <CardDescription>
            Compare estimated hours against actual time spent on projects, phases, and staff
          </CardDescription>
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium">Start Date</span>
              <DatePicker date={startDate} onChange={(date) => date && setStartDate(date)} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">End Date</span>
              <DatePicker date={endDate} onChange={(date) => date && setEndDate(date)} />
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Summary</TabsTrigger>
          <TabsTrigger value="project-detail">Project Detail</TabsTrigger>
          <TabsTrigger value="staff-efficiency">Staff Efficiency</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data?.summary.totalProjects}
                </div>
                <div className="mt-2 flex gap-2">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    On Budget: {data?.summary.projectsOnBudget}
                  </Badge>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Over: {data?.summary.projectsOverBudget}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Under: {data?.summary.projectsUnderBudget}
                  </Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Budget Variance</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${getVarianceColor(data?.summary.avgBudgetVariance || 0)}`}>
                  {data?.summary.avgBudgetVariance > 0 ? '+' : ''}{data?.summary.avgBudgetVariance.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {data?.summary.avgBudgetVariance > 5 
                    ? 'Over budget on average' 
                    : data?.summary.avgBudgetVariance < -5
                      ? 'Under budget on average'
                      : 'On target overall'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Problematic Phase</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-red-600 truncate">
                  {data?.summary.mostOverBudgetPhase}
                </div>
                <p className="text-xs text-muted-foreground">
                  Most frequently over budget phase
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Staff Efficiency</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground">Most Efficient:</div>
                  <div className="text-sm font-medium text-green-600">{data?.summary.mostEfficientStaff}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Least Efficient:</div>
                  <div className="text-sm font-medium text-red-600">{data?.summary.leastEfficientStaff}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recently Completed Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Budget</TableHead>
                    <TableHead className="text-right">Actual</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recentlyCompletedProjects.map((project) => (
                    <TableRow key={project.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedProject(project.id)}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.client}</TableCell>
                      <TableCell className="text-right">{project.budgetHours.toFixed(1)}h</TableCell>
                      <TableCell className="text-right">{project.actualHours.toFixed(1)}h</TableCell>
                      <TableCell className={`text-right ${getVarianceColor(project.variancePercent)}`}>
                        {project.variance > 0 ? '+' : ''}{project.variance.toFixed(1)}h
                      </TableCell>
                      <TableCell className="text-right">
                        {renderVarianceBadge(project.variance, project.variancePercent)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Problematic Project Phases</CardTitle>
              <CardDescription>Phases with the highest average budget overruns</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <InsightBarChart 
                data={problematicPhasesData}
                height={300}
                insightGenerator={(index, datasetIndex, label, value) => ({
                  title: `${label} Phase Analysis`,
                  value: `${value.toFixed(1)}%`,
                  valueSuffix: '%',
                  description: `Average budget variance for ${label} phase`,
                  type: 'variance',
                  detailsKeys: ['frequency', 'avgOverage', 'recommendation'],
                  frequency: `${data?.topProblematicPhases[index].occurrences} projects`,
                  avgOverage: `${value.toFixed(1)}% over budget`,
                  recommendation: value > 20 
                    ? 'Revise estimation methodology' 
                    : value > 10 
                      ? 'Review scope definition' 
                      : 'Monitor closely'
                })}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="project-detail" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Detail Analysis</CardTitle>
              <CardDescription>Select a project to see detailed budget vs. actual breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <Select value={selectedProject?.toString()} onValueChange={(value) => setSelectedProject(Number(value))}>
                  <SelectTrigger className="w-full md:w-[350px]">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name} ({project.client})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProjectDetails ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Budget Hours</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedProjectDetails.totalBudgetHours.toFixed(1)}h
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Original time estimate
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Actual Hours</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {selectedProjectDetails.totalActualHours.toFixed(1)}h
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Time actually spent
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Variance</CardTitle>
                        <Percent className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${getVarianceColor(selectedProjectDetails.totalVariancePercent)}`}>
                          {selectedProjectDetails.totalVariance > 0 ? '+' : ''}{selectedProjectDetails.totalVariance.toFixed(1)}h
                          <span className="ml-1 text-sm">
                            ({selectedProjectDetails.totalVariancePercent > 0 ? '+' : ''}{selectedProjectDetails.totalVariancePercent.toFixed(1)}%)
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {selectedProjectDetails.status === 'completed' ? 'Final variance' : 'Current variance'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Project Phases</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Phase</TableHead>
                            <TableHead className="text-right">Budget</TableHead>
                            <TableHead className="text-right">Actual</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProjectDetails.phases.map((phase) => (
                            <TableRow key={phase.id}>
                              <TableCell className="font-medium">{phase.name}</TableCell>
                              <TableCell className="text-right">{phase.budgetHours.toFixed(1)}h</TableCell>
                              <TableCell className="text-right">{phase.actualHours.toFixed(1)}h</TableCell>
                              <TableCell className={`text-right ${getVarianceColor(phase.variancePercent)}`}>
                                {phase.variance > 0 ? '+' : ''}{phase.variance.toFixed(1)}h
                                <span className="text-xs ml-1">
                                  ({phase.variancePercent > 0 ? '+' : ''}{phase.variancePercent.toFixed(1)}%)
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {renderVarianceBadge(phase.variance, phase.variancePercent)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Phase Comparison</h3>
                    <div className="h-80">
                      <Bar
                        data={budgetVsActualData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Hours'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Project Phase'
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            tooltip: {
                              callbacks: {
                                footer: (tooltipItems) => {
                                  if (tooltipItems.length >= 2) {
                                    const budgetValue = tooltipItems[0].raw as number;
                                    const actualValue = tooltipItems[1].raw as number;
                                    const variance = actualValue - budgetValue;
                                    const variancePercent = budgetValue > 0 ? (variance / budgetValue) * 100 : 0;
                                    return `Variance: ${variance > 0 ? '+' : ''}${variance.toFixed(1)}h (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;
                                  }
                                  return '';
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Staff Performance</h3>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Budget</TableHead>
                            <TableHead className="text-right">Actual</TableHead>
                            <TableHead className="text-right">Variance</TableHead>
                            <TableHead className="text-right">Efficiency</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedProjectDetails.staffPerformance.map((staff) => (
                            <TableRow key={staff.id}>
                              <TableCell className="font-medium">{staff.name}</TableCell>
                              <TableCell>{staff.role}</TableCell>
                              <TableCell className="text-right">{staff.budgetHours.toFixed(1)}h</TableCell>
                              <TableCell className="text-right">{staff.actualHours.toFixed(1)}h</TableCell>
                              <TableCell className={`text-right ${getVarianceColor(staff.variancePercent)}`}>
                                {staff.variance > 0 ? '+' : ''}{staff.variance.toFixed(1)}h
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-24">
                                    <Progress value={staff.efficiency} className="h-2" />
                                  </div>
                                  <span className={`
                                    ${staff.efficiency >= 95 ? 'text-green-600' : 
                                      staff.efficiency >= 80 ? 'text-amber-600' : 'text-red-600'}
                                  `}>
                                    {staff.efficiency}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-4">Staff Comparison</h3>
                    <div className="h-80">
                      <Bar
                        data={staffPerformanceData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Hours'
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Staff Member'
                              }
                            }
                          },
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            tooltip: {
                              callbacks: {
                                footer: (tooltipItems) => {
                                  if (tooltipItems.length >= 2) {
                                    const budgetValue = tooltipItems[0].raw as number;
                                    const actualValue = tooltipItems[1].raw as number;
                                    const variance = actualValue - budgetValue;
                                    const variancePercent = budgetValue > 0 ? (variance / budgetValue) * 100 : 0;
                                    return `Variance: ${variance > 0 ? '+' : ''}${variance.toFixed(1)}h (${variancePercent > 0 ? '+' : ''}${variancePercent.toFixed(1)}%)`;
                                  }
                                  return '';
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Select a project to view detailed budget vs. actual analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff-efficiency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Staff Efficiency Analysis</CardTitle>
              <CardDescription>View staff performance across all projects</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Efficiency</TableHead>
                    <TableHead>Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.staffEfficiency.map((staff, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{staff.name}</TableCell>
                      <TableCell>{staff.role}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-24">
                            <Progress 
                              value={staff.efficiency} 
                              className={`h-2 ${
                                staff.efficiency >= 95 ? 'bg-green-600' : 
                                staff.efficiency >= 80 ? 'bg-amber-600' : 'bg-red-600'
                              }`} 
                            />
                          </div>
                          <span className={`
                            ${staff.efficiency >= 95 ? 'text-green-600' : 
                              staff.efficiency >= 80 ? 'text-amber-600' : 'text-red-600'}
                          `}>
                            {staff.efficiency}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {staff.efficiency >= 95 ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Excellent
                          </Badge>
                        ) : staff.efficiency >= 85 ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            Good
                          </Badge>
                        ) : staff.efficiency >= 75 ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Average
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                            Needs Improvement
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetVsActualDashboard;