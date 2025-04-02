import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, LineChart, PieChart } from "@/components/ui/charts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Calendar } from "lucide-react";

import { BudgetVsActualDashboard } from "./BudgetVsActualDashboard";

// Mock data for firm overview
const firmData = {
  monthlyHours: [120, 145, 160, 178, 190, 205, 220, 235, 240, 255, 270, 285],
  clients: [
    { id: 1, name: "Adams Family LLC", hours: 85, revenue: 12750 },
    { id: 2, name: "White Enterprises", hours: 65, revenue: 9750 },
    { id: 3, name: "Johnson Manufacturing", hours: 45, revenue: 6750 },
    { id: 4, name: "Smith & Partners", hours: 35, revenue: 5250 },
    { id: 5, name: "XYZ Corporation", hours: 30, revenue: 4500 },
  ],
  services: [
    { id: 1, name: "Tax Preparation", hours: 120, revenue: 18000 },
    { id: 2, name: "Bookkeeping", hours: 80, revenue: 12000 },
    { id: 3, name: "Audit Services", hours: 60, revenue: 9000 },
    { id: 4, name: "Financial Planning", hours: 45, revenue: 6750 },
    { id: 5, name: "Payroll", hours: 30, revenue: 4500 },
  ],
};

// Mock data for staff overview
const staffData = {
  staff: [
    { id: 1, name: "Jane Smith", role: "Tax Specialist", utilization: 87, hours: 145, revenue: 21750 },
    { id: 2, name: "Michael Chen", role: "Senior Accountant", utilization: 92, hours: 155, revenue: 23250 },
    { id: 3, name: "Robert Williams", role: "Junior Accountant", utilization: 75, hours: 125, revenue: 18750 },
    { id: 4, name: "Sarah Johnson", role: "Bookkeeper", utilization: 85, hours: 140, revenue: 21000 },
    { id: 5, name: "David Lee", role: "Tax Associate", utilization: 82, hours: 135, revenue: 20250 },
    { id: 6, name: "Emily Davis", role: "Audit Specialist", utilization: 88, hours: 145, revenue: 21750 },
  ],
  utilizationByRole: {
    "Tax Specialist": 87,
    "Senior Accountant": 92,
    "Junior Accountant": 75,
    "Bookkeeper": 85,
    "Tax Associate": 82,
    "Audit Specialist": 88,
  },
};

// Mock data for client overview
const clientData = {
  projects: [
    { id: 1, client: "Adams Family LLC", status: "In Progress", hours: 45, budget: 60, variance: -15 },
    { id: 2, client: "White Enterprises", status: "Completed", hours: 75, budget: 65, variance: 10 },
    { id: 3, client: "Johnson Manufacturing", status: "In Progress", hours: 25, budget: 40, variance: -15 },
    { id: 4, client: "Smith & Partners", status: "Not Started", hours: 0, budget: 35, variance: -35 },
  ],
};

type ViewType = "firm" | "staff" | "client" | "budget-vs-actual";

export function TimeAnalyticsDashboard() {
  const [view, setView] = useState<ViewType>("firm");
  const [timeFrame, setTimeFrame] = useState("monthly");
  const [showActuals, setShowActuals] = useState(true);
  const [showProjections, setShowProjections] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>("adams-family");

  // Create data for firm monthly hours chart
  const monthlyHoursData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    datasets: [
      {
        label: showActuals ? "Actual Hours" : "",
        data: showActuals ? firmData.monthlyHours : [],
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
      {
        label: showProjections ? "Projected Hours" : "",
        data: showProjections ? [120, 145, 160, 178, 190, 205, 230, 250, 265, 280, 295, 310] : [],
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderDash: [5, 5],
      },
    ],
  };

  // Create data for top clients chart
  const clientsChartData = {
    labels: firmData.clients.map(c => c.name),
    datasets: [
      {
        label: "Hours",
        data: firmData.clients.map(c => c.hours),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Create data for services chart
  const servicesChartData = {
    labels: firmData.services.map(s => s.name),
    datasets: [
      {
        data: firmData.services.map(s => s.hours),
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
          "rgba(153, 102, 255, 0.7)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  // Create data for staff utilization chart
  const staffChartData = {
    labels: staffData.staff.map(s => s.name),
    datasets: [
      {
        label: "Utilization %",
        data: staffData.staff.map(s => s.utilization),
        backgroundColor: staffData.staff.map(s => 
          s.utilization >= 90 ? "rgba(75, 192, 192, 0.7)" :
          s.utilization >= 80 ? "rgba(54, 162, 235, 0.7)" :
          "rgba(255, 206, 86, 0.7)"
        ),
        borderColor: staffData.staff.map(s => 
          s.utilization >= 90 ? "rgba(75, 192, 192, 1)" :
          s.utilization >= 80 ? "rgba(54, 162, 235, 1)" :
          "rgba(255, 206, 86, 1)"
        ),
        borderWidth: 1,
      },
    ],
  };

  // Create data for staff hours chart
  const staffHoursData = {
    labels: staffData.staff.map(s => s.name),
    datasets: [
      {
        label: "Hours",
        data: staffData.staff.map(s => s.hours),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };
  
  // Create data for project status chart
  const projectStatusChartData = {
    labels: clientData.projects.map(p => p.client),
    datasets: [
      {
        label: "Actual Hours",
        data: clientData.projects.map(p => p.hours),
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
      {
        label: "Budgeted Hours",
        data: clientData.projects.map(p => p.budget),
        backgroundColor: "rgba(53, 162, 235, 0.5)",
        borderColor: "rgba(53, 162, 235, 1)",
        borderWidth: 1,
      },
    ],
  };

  // Chart options
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const { dataIndex, dataset } = context;
            const label = dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const label = context.dataset.label || "";
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "right" as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const { dataIndex } = context;
            const label = servicesChartData.labels[dataIndex] || "";
            const value = context.parsed;
            return `${label}: ${value} hours`;
          },
        },
      },
    },
  };

  const renderFirmOverview = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Time Frame" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="annual">Annual</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center space-x-2">
            <Switch
              id="actual-hours"
              checked={showActuals}
              onCheckedChange={setShowActuals}
            />
            <Label htmlFor="actual-hours">Actual Hours</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="projected-hours"
              checked={showProjections}
              onCheckedChange={setShowProjections}
            />
            <Label htmlFor="projected-hours">Projections</Label>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <Calendar className="h-4 w-4" />
          <span>Date Range</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Hours</CardTitle>
          <CardDescription>
            Hours billed over time with projections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <LineChart data={monthlyHoursData} options={lineChartOptions} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Clients by Hours</CardTitle>
            <CardDescription>
              Clients with the most billable hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <BarChart data={clientsChartData} options={barChartOptions} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Distribution</CardTitle>
            <CardDescription>
              Hours by service category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <PieChart data={servicesChartData} options={pieChartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderStaffOverview = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Staff Utilization</CardTitle>
          <CardDescription>
            Percentage of billable hours vs. available hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <BarChart data={staffChartData} options={barChartOptions} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Staff Hours</CardTitle>
          <CardDescription>
            Total billable hours by staff member
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <BarChart data={staffHoursData} options={barChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderClientOverview = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Project Status</CardTitle>
          <CardDescription>
            Hours billed vs. budgeted hours by client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <BarChart data={projectStatusChartData} options={barChartOptions} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Project Detail</h3>
        <Select value={selectedProject} onValueChange={setSelectedProject}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Select Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="adams-family">Adams Family LLC - Tax Preparation</SelectItem>
            <SelectItem value="white-enterprises">White Enterprises - Audit</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Tabs value={view} onValueChange={(v) => setView(v as ViewType)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="firm">Firm Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="client">Client Overview</TabsTrigger>
          <TabsTrigger value="budget-vs-actual">Budget vs. Actual</TabsTrigger>
        </TabsList>
        
        <TabsContent value="firm">
          {renderFirmOverview()}
        </TabsContent>
        
        <TabsContent value="staff">
          {renderStaffOverview()}
        </TabsContent>
        
        <TabsContent value="client">
          {renderClientOverview()}
        </TabsContent>
        
        <TabsContent value="budget-vs-actual">
          <BudgetVsActualDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}