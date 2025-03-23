/**
 * In-House ML Provider
 * 
 * This module implements the ML Provider interface for in-house ML insights.
 * It contains simulated ML logic but can be extended with actual ML algorithms.
 */

import type { 
  MLProvider,
  MLInsightsRequest,
  MLInsightsResponse,
  ResourceUtilizationInsight,
  RevenueInsight
} from './ml-adapter';

// Import only the type definitions from the original ml-insights
import type { 
  Project, 
  Proposal, 
  TimeEstimate, 
  Service, 
  ProfessionalRole, 
  ClientCompany
} from "@shared/schema";

export class InHouseMLProvider implements MLProvider {
  getName(): string {
    return 'in-house';
  }

  getCapabilities(): string[] {
    return [
      'workload-predictions',
      'revenue-forecasts',
      'client-insights',
      'service-efficiency',
      'seasonal-patterns',
      'staffing-recommendations',
      'anomaly-detection',
      'profitability-predictions'
    ];
  }

  async generateInsights(request: MLInsightsRequest): Promise<MLInsightsResponse> {
    const {
      projects,
      proposals,
      timeEstimates,
      services,
      professionalRoles,
      clientCompanies,
      period = 'month'
    } = request;
    
    // Generate all insights
    const workloadPredictions = this.generateWorkloadPredictions(timeEstimates, projects, professionalRoles);
    const revenueForecasts = this.generateRevenueForecasts(projects, proposals, timeEstimates, period);
    const clientInsights = this.generateClientInsights(timeEstimates, clientCompanies, projects);
    const serviceEfficiencyInsights = this.generateServiceEfficiencyInsights(timeEstimates, services);
    const seasonalPatterns = this.detectSeasonalPatterns(timeEstimates, projects, period);
    const staffingRecommendations = this.generateStaffingRecommendations(timeEstimates, projects, professionalRoles);
    const abnormalPatterns = this.detectAbnormalPatterns(timeEstimates, projects, clientCompanies);
    const profitabilityPredictions = this.generateProfitabilityPredictions(projects, timeEstimates, clientCompanies);
    
    return {
      workloadPredictions,
      revenueForecasts,
      clientInsights,
      serviceEfficiencyInsights,
      seasonalPatterns,
      staffingRecommendations,
      abnormalPatterns,
      profitabilityPredictions
    };
  }

  // Generate workload predictions based on historical data and current projects
  private generateWorkloadPredictions(
    timeEstimates: TimeEstimate[],
    projects: Project[],
    professionalRoles: ProfessionalRole[]
  ) {
    // Group time estimates by role
    const roleWorkloads = new Map<number, ResourceUtilizationInsight>();
    
    // Process each professional role
    professionalRoles.forEach(role => {
      // Get time estimates for this role
      const roleTimeEstimates = timeEstimates.filter(te => te.professionalRoleId === role.id);
      
      // Calculate current workload (hours) - using estimatedHours from our schema
      const currentHours = roleTimeEstimates.reduce((sum, te) => sum + Number(te.estimatedHours || 0), 0);
      
      // Simulate projected hours - in a real system this would use ML models
      // Here we're using a simple heuristic based on current projects
      const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'pending');
      const projectedHours = currentHours * (1 + 0.2 * activeProjects.length / Math.max(1, projects.length));
      
      // Calculate available capacity - in real system would use staff capacities
      // Create capacity based on rate tiers - higher rates typically have lower capacity
      const tierMap = {
        'top': 160,  // Top tier professionals have less available hours (more meetings, client-facing work)
        'mid': 180,  // Mid tier professionals have moderate capacity
        'low': 200   // Lower tier professionals have highest capacity (more tactical work)
      };
      
      // Determine tier based on rate structure
      const tier = role.topTierRate ? 'top' : 'mid';
      const availableCapacity = tierMap[tier as keyof typeof tierMap];
      
      // Calculate utilization rate
      const utilizationRate = projectedHours / availableCapacity;
      
      // Determine risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (utilizationRate > 0.9) {
        riskLevel = 'high';
      } else if (utilizationRate > 0.75) {
        riskLevel = 'medium';
      }
      
      roleWorkloads.set(role.id, {
        roleId: role.id,
        roleName: role.name,
        currentHours,
        projectedHours,
        availableCapacity,
        utilizationRate,
        riskLevel
      });
    });
    
    return {
      roleWorkloads: Array.from(roleWorkloads.values()),
      overallUtilization: Array.from(roleWorkloads.values())
        .reduce((sum, role) => sum + role.utilizationRate, 0) / Math.max(1, roleWorkloads.size),
      resourceConstraints: Array.from(roleWorkloads.values())
        .filter(role => role.riskLevel === 'high')
        .map(role => ({
          roleId: role.roleId,
          roleName: role.roleName,
          shortageAmount: role.projectedHours - role.availableCapacity,
          impactLevel: 'high'
        }))
    };
  }

  // Generate revenue forecasts based on project and proposal data
  private generateRevenueForecasts(
    projects: Project[],
    proposals: Proposal[],
    timeEstimates: TimeEstimate[],
    period: string = 'month'
  ) {
    // Generate time periods for the forecast (next 6 periods)
    const now = new Date();
    const periods = [];
    
    for (let i = 0; i < 6; i++) {
      const periodDate = new Date(now);
      
      if (period === 'week') {
        periodDate.setDate(periodDate.getDate() + (i * 7));
      } else if (period === 'quarter') {
        periodDate.setMonth(periodDate.getMonth() + (i * 3));
      } else { // default: month
        periodDate.setMonth(periodDate.getMonth() + i);
      }
      
      periods.push({
        label: this.formatPeriodLabel(periodDate, period),
        date: periodDate
      });
    }
    
    // Calculate confirmed revenue from active projects
    const confirmedRevenue = periods.map(period => {
      const periodRevenue = this.calculateRevenueInPeriod(projects, timeEstimates, period.date, period);
      return {
        period: period.label,
        revenue: periodRevenue,
        confidence: 0.9 // 90% confidence in confirmed revenue
      };
    });
    
    // Calculate projected revenue from proposals
    const projectedRevenue = periods.map(period => {
      // For each period, calculate possible revenue from proposals
      // with a probability factor based on proposal status
      let periodProjectedRevenue = 0;
      
      proposals.forEach(proposal => {
        // Skip rejected proposals
        if (proposal.status === 'rejected') return;
        
        // Determine probability based on status
        let probability = 0;
        switch (proposal.status) {
          case 'draft': probability = 0.2; break;
          case 'sent': probability = 0.4; break;
          case 'negotiation': probability = 0.6; break;
          case 'approved': probability = 0.8; break;
          default: probability = 0.3;
        }
        
        // Only count proposals with start dates in this period or without dates
        if (!proposal.estimatedStartDate || this.isInPeriod(proposal.estimatedStartDate, period.date, period)) {
          const estimatedValue = parseFloat(proposal.estimatedCost || '0');
          periodProjectedRevenue += estimatedValue * probability;
        }
      });
      
      return {
        period: period.label,
        revenue: periodProjectedRevenue,
        confidence: 0.7 // 70% confidence in projected revenue
      };
    });
    
    // Calculate total revenue forecast (confirmed + projected)
    const totalRevenueForecast: RevenueInsight[] = periods.map((period, i) => {
      return {
        period: period.label,
        confirmed: confirmedRevenue[i].revenue,
        projected: projectedRevenue[i].revenue,
        total: confirmedRevenue[i].revenue + projectedRevenue[i].revenue
      };
    });
    
    return {
      totalRevenueForecast,
      forecastAccuracy: 0.85, // Simulated forecast accuracy
      anomalies: []  // In a real system, we'd detect anomalies here
    };
  }

  // Generate insights about clients based on historical data
  private generateClientInsights(
    timeEstimates: TimeEstimate[],
    clientCompanies: ClientCompany[],
    projects: Project[]
  ) {
    const clientInsights = clientCompanies.map(client => {
      // Find projects for this client
      const clientProjects = projects.filter(p => p.clientCompanyId === client.id);
      
      // Calculate time spent on client projects
      const clientTimeEstimates = timeEstimates.filter(te => 
        clientProjects.some(p => p.id === te.projectId)
      );
      
      // Use estimatedHours instead of hours
      const totalHours = clientTimeEstimates.reduce((sum, te) => sum + Number(te.estimatedHours || 0), 0);
      
      // Use hourlyRate instead of rate
      const totalRevenue = clientTimeEstimates.reduce((sum, te) => {
        const hourlyRate = Number(te.hourlyRate || 0);
        const hours = Number(te.estimatedHours || 0);
        return sum + (hourlyRate * hours);
      }, 0);
      
      // Calculate average hourly rate
      const averageRate = totalHours > 0 ? totalRevenue / totalHours : 0;
      
      // Calculate profitability (simplified)
      // In a real system, we'd include costs, overhead, etc.
      const profitability = averageRate > 150 ? 'high' : (averageRate > 100 ? 'medium' : 'low');
      
      // Growth potential - in a real system this would use ML to predict
      // Here we use a simple heuristic based on recent projects/activity
      const recentProjects = clientProjects.filter(p => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return new Date(p.createdAt) > sixMonthsAgo;
      });
      
      const growthPotential = recentProjects.length > 2 ? 'high' : (recentProjects.length > 0 ? 'medium' : 'low');
      
      // Client engagement score (0-100)
      // Higher score for clients with recent activity and higher total hours
      const recencyFactor = recentProjects.length > 0 ? 1 : 0.5;
      const hoursFactor = Math.min(1, totalHours / 1000); // Normalize, max at 1000 hours
      const engagementScore = Math.round((recencyFactor * 0.6 + hoursFactor * 0.4) * 100);
      
      return {
        clientId: client.id,
        clientName: client.name,
        totalHours,
        totalRevenue,
        averageRate,
        profitability: profitability as 'low' | 'medium' | 'high',
        growthPotential: growthPotential as 'low' | 'medium' | 'high',
        engagementScore,
        retentionRisk: engagementScore < 30 ? 'high' : (engagementScore < 60 ? 'medium' : 'low')
      };
    });
    
    // Sort by engagement score (descending)
    clientInsights.sort((a, b) => b.engagementScore - a.engagementScore);
    
    return {
      clientInsights,
      topClients: clientInsights.slice(0, 5),
      atRiskClients: clientInsights.filter(c => c.retentionRisk === 'high'),
      growthOpportunities: clientInsights.filter(c => c.growthPotential === 'high' && c.profitability !== 'low')
    };
  }

  // Generate insights on service efficiency
  private generateServiceEfficiencyInsights(
    timeEstimates: TimeEstimate[],
    services: Service[]
  ) {
    const serviceEfficiency = services.map(service => {
      // Find time estimates for this service
      const serviceTimeEstimates = timeEstimates.filter(te => te.serviceId === service.id);
      
      // Use estimatedHours instead of hours
      const totalHours = serviceTimeEstimates.reduce((sum, te) => sum + Number(te.estimatedHours || 0), 0);
      
      // Use hourlyRate instead of rate
      const totalRevenue = serviceTimeEstimates.reduce((sum, te) => {
        const hourlyRate = Number(te.hourlyRate || 0);
        const hours = Number(te.estimatedHours || 0);
        return sum + (hourlyRate * hours);
      }, 0);
      
      // Calculate average hourly rate
      const averageRate = totalHours > 0 ? totalRevenue / totalHours : 0;
      
      // Calculate efficiency score - in a real system this would be more complex
      // and would take into account estimated vs actual time
      const efficiencyScore = Math.min(100, Math.max(0, 
        70 + (averageRate - 100) / 2 + (Math.random() * 20 - 10)
      ));
      
      return {
        serviceId: service.id,
        serviceName: service.name,
        category: service.category || 'General',
        totalHours,
        totalRevenue,
        averageRate,
        efficiencyScore,
        profitability: averageRate > 150 ? 'high' : (averageRate > 100 ? 'medium' : 'low')
      };
    });
    
    // Sort by efficiency score (descending)
    serviceEfficiency.sort((a, b) => b.efficiencyScore - a.efficiencyScore);
    
    return {
      serviceEfficiency,
      mostEfficientServices: serviceEfficiency.slice(0, 3),
      leastEfficientServices: serviceEfficiency.slice(-3).reverse(),
      improvementOpportunities: serviceEfficiency
        .filter(s => s.efficiencyScore < 70 && s.totalHours > 20)
        .map(s => ({
          serviceId: s.serviceId,
          serviceName: s.serviceName,
          currentEfficiency: s.efficiencyScore,
          potentialImprovement: Math.round((70 - s.efficiencyScore) * 1.5),
          revenueImpact: Math.round((70 - s.efficiencyScore) * s.totalHours * 2)
        }))
    };
  }

  // Detect seasonal patterns in workload and revenue
  private detectSeasonalPatterns(
    timeEstimates: TimeEstimate[],
    projects: Project[],
    period: string = 'month'
  ) {
    // In a real system, this would use time series analysis and ML models
    // Here we'll simulate seasonal patterns typical for CPA firms
    
    // Typical tax season (Jan-Apr and Aug-Oct) pattern for CPA firms
    const seasonalPatterns = [
      { month: 0, factor: 1.3 },  // Jan
      { month: 1, factor: 1.5 },  // Feb
      { month: 2, factor: 1.8 },  // Mar
      { month: 3, factor: 2.0 },  // Apr
      { month: 4, factor: 0.8 },  // May
      { month: 5, factor: 0.7 },  // Jun
      { month: 6, factor: 0.7 },  // Jul
      { month: 7, factor: 1.2 },  // Aug
      { month: 8, factor: 1.4 },  // Sep
      { month: 9, factor: 1.3 },  // Oct
      { month: 10, factor: 0.8 }, // Nov
      { month: 11, factor: 0.7 }, // Dec
    ];
    
    // Simulate monthly workload (hours) based on seasonal patterns
    const seasonalWorkload = seasonalPatterns.map(pattern => {
      const date = new Date();
      date.setMonth(pattern.month);
      
      return {
        period: this.formatPeriodLabel(date, 'month'),
        workload: Math.round(1000 * pattern.factor), // Base workload of 1000 hours
        factor: pattern.factor
      };
    });
    
    // Identify peak periods
    const peakPeriods = seasonalWorkload
      .filter(m => m.factor > 1.3)
      .map(m => m.period);
    
    // Identify slow periods
    const slowPeriods = seasonalWorkload
      .filter(m => m.factor < 0.8)
      .map(m => m.period);
    
    return {
      seasonalWorkload,
      peakPeriods,
      slowPeriods,
      seasonalityScore: 0.65, // Measure of how seasonal the business is (0-1)
      recommendations: [
        "Plan hiring and temporary staff for peak periods in January-April and August-October",
        "Schedule training and internal projects during slow periods in May-July and November-December",
        "Consider service diversification to smooth seasonal revenue fluctuations"
      ]
    };
  }

  // Generate staffing recommendations based on workload predictions
  private generateStaffingRecommendations(
    timeEstimates: TimeEstimate[],
    projects: Project[],
    professionalRoles: ProfessionalRole[]
  ) {
    // Group active projects by time period
    const now = new Date();
    const nextQuarter = new Date(now);
    nextQuarter.setMonth(now.getMonth() + 3);
    
    // Calculate hours needed by role for next quarter
    const roleNeeds = new Map<number, {
      roleId: number,
      roleName: string,
      tier: string,
      hoursNeeded: number,
      currentCapacity: number,
      shortfall: number,
      hiringNeeded: number
    }>();
    
    // Process each professional role
    professionalRoles.forEach(role => {
      // Get time estimates for this role
      const roleTimeEstimates = timeEstimates.filter(te => te.professionalRoleId === role.id);
      
      // Calculate current hours being used
      const currentHours = roleTimeEstimates.reduce((sum, te) => sum + Number(te.estimatedHours || 0), 0);
      
      // Projected hours for next quarter - in real system would be ML-based
      // Here we use a simplified projection based on current workload and growth factor
      const growthFactor = 1.15; // 15% growth
      let hoursNeeded = currentHours * growthFactor;
      
      // Adjust for seasonality
      const currentMonth = now.getMonth();
      const nextQuarterMonth = (currentMonth + 3) % 12;
      
      // Tax season adjustment (higher in Q1 and Q3)
      if (nextQuarterMonth >= 0 && nextQuarterMonth <= 3) {
        hoursNeeded *= 1.3; // Tax season Q1 (Jan-Apr)
      } else if (nextQuarterMonth >= 7 && nextQuarterMonth <= 9) {
        hoursNeeded *= 1.2; // Tax season Q3 (Aug-Oct)
      }
      
      // For staffing count, we'd normally pull from the database
      // For now, use a default value based on role
      const staffCount = 2; // Default to 2 staff members for each role
      
      // Determine tier based on rate structure for capacity calculation
      const tierMap = {
        'top': 160,  // Top tier professionals have less available hours
        'mid': 180,  // Mid tier professionals have moderate capacity
        'low': 200   // Lower tier professionals have highest capacity
      };
      
      // Determine tier based on rate structure
      const tier = role.topTierRate ? 'top' : 'mid';
      const hoursPerStaff = tierMap[tier as keyof typeof tierMap];
      
      const currentCapacity = staffCount * hoursPerStaff * 3; // Capacity for 3 months
      
      // Calculate shortfall
      const shortfall = Math.max(0, hoursNeeded - currentCapacity);
      
      // Calculate hiring needed
      const hiringNeeded = Math.ceil(shortfall / (hoursPerStaff * 3));
      
      roleNeeds.set(role.id, {
        roleId: role.id,
        roleName: role.name,
        tier: tier,
        hoursNeeded: Math.round(hoursNeeded),
        currentCapacity,
        shortfall: Math.round(shortfall),
        hiringNeeded
      });
    });
    
    // Generate specific recommendations
    const hiringRecommendations = Array.from(roleNeeds.values())
      .filter(role => role.hiringNeeded > 0)
      .map(role => ({
        roleId: role.roleId,
        roleName: role.roleName,
        tier: role.tier,
        hiringNeeded: role.hiringNeeded,
        urgency: role.shortfall > role.currentCapacity * 0.5 ? 'high' : 'medium',
        impact: role.tier === 'top' ? 'high' : (role.tier === 'mid' ? 'medium' : 'moderate')
      }));
    
    // Identify roles with excess capacity
    const excessCapacityRoles = Array.from(roleNeeds.values())
      .filter(role => role.hoursNeeded < role.currentCapacity * 0.7) // Less than 70% utilized
      .map(role => ({
        roleId: role.roleId,
        roleName: role.roleName,
        tier: role.tier,
        excessCapacity: Math.round(role.currentCapacity - role.hoursNeeded),
        utilization: Math.round((role.hoursNeeded / role.currentCapacity) * 100) + '%'
      }));
      
    return {
      staffingNeeds: Array.from(roleNeeds.values()),
      hiringRecommendations,
      excessCapacityRoles,
      resourceShiftOpportunities: excessCapacityRoles.length > 0 && hiringRecommendations.length > 0 ?
        [{
          fromRole: excessCapacityRoles[0].roleName,
          toRole: hiringRecommendations[0].roleName,
          potentialHours: Math.min(excessCapacityRoles[0].excessCapacity, hiringRecommendations[0].hiringNeeded * 160 * 3),
          costSavings: 'moderate'
        }] : []
    };
  }

  // Detect abnormal patterns or anomalies in time tracking and project data
  private detectAbnormalPatterns(
    timeEstimates: TimeEstimate[],
    projects: Project[],
    clientCompanies: ClientCompany[]
  ) {
    // In a real system, this would use anomaly detection algorithms
    // Here we'll simulate some anomaly detection results
    
    const anomalies: any[] = [];
    
    // Detect projects with significantly more hours than estimated
    projects.forEach(project => {
      if (!project.estimatedHours) return;
      
      const projectTimeEstimates = timeEstimates.filter(te => te.projectId === project.id);
      const actualHours = projectTimeEstimates.reduce((sum, te) => sum + Number(te.estimatedHours || 0), 0);
      const estimatedHours = Number(project.estimatedHours);
      
      if (actualHours > estimatedHours * 1.5 && actualHours > 20) {
        // Find client name
        const client = clientCompanies.find(c => c.id === project.clientCompanyId);
        
        anomalies.push({
          type: 'overrun',
          severity: actualHours > estimatedHours * 2 ? 'high' : 'medium',
          description: `Project ${project.name} is over budget by ${Math.round((actualHours / estimatedHours - 1) * 100)}%`,
          projectId: project.id,
          projectName: project.name,
          clientName: client?.name || 'Unknown',
          estimatedHours,
          actualHours,
          variance: Math.round((actualHours / estimatedHours - 1) * 100) + '%',
          impact: Math.round((actualHours - estimatedHours) * 150), // Assuming $150/hr
          recommendation: 'Review project scope and time tracking practices'
        });
      }
    });
    
    // Detect unusual hourly rates (simulated)
    timeEstimates.forEach(te => {
      if (!te.hourlyRate) return;
      
      const rate = Number(te.hourlyRate);
      // Anomalous if rate is very low or very high
      if ((rate < 50 || rate > 300) && Number(te.estimatedHours || 0) > 5) {
        const project = projects.find(p => p.id === te.projectId);
        
        anomalies.push({
          type: 'unusual_rate',
          severity: 'medium',
          description: `Unusual hourly rate of $${rate} detected for project ${project?.name || 'Unknown'}`,
          timeEstimateId: te.id,
          projectName: project?.name || 'Unknown',
          rate,
          hours: Number(te.estimatedHours || 0),
          recommendation: rate < 50 ? 'Review service pricing' : 'Validate high hourly rate'
        });
      }
    });
    
    return {
      anomalies,
      riskScore: anomalies.filter(a => a.severity === 'high').length > 2 ? 'high' : 'normal',
      recommendations: anomalies.slice(0, 3).map(a => a.recommendation)
    };
  }

  // Generate profitability predictions for projects and clients
  private generateProfitabilityPredictions(
    projects: Project[],
    timeEstimates: TimeEstimate[],
    clientCompanies: ClientCompany[]
  ) {
    // Calculate profitability by client
    const clientProfitability = clientCompanies.map(client => {
      // Find projects for this client
      const clientProjects = projects.filter(p => p.clientCompanyId === client.id);
      
      // Calculate time spent on client projects
      const clientTimeEstimates = timeEstimates.filter(te => 
        clientProjects.some(p => p.id === te.projectId)
      );
      
      const totalHours = clientTimeEstimates.reduce((sum, te) => sum + Number(te.estimatedHours || 0), 0);
      const totalRevenue = clientTimeEstimates.reduce((sum, te) => {
        const hourlyRate = Number(te.hourlyRate || 0);
        const hours = Number(te.estimatedHours || 0);
        return sum + (hourlyRate * hours);
      }, 0);
      
      // Simplified cost calculation - in a real system would include
      // actual staff costs, overhead, etc.
      const averageCostPerHour = 75; // Simplified average cost per hour
      const totalCost = totalHours * averageCostPerHour;
      
      // Calculate profitability
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? profit / totalRevenue : 0;
      
      // Predict future profitability (simple model)
      // In a real system would use ML regression models
      const futureProfitMargin = Math.min(0.6, profitMargin * 1.1); // Slight improvement predicted
      
      return {
        clientId: client.id,
        name: client.name,
        revenue: Math.round(totalRevenue),
        cost: Math.round(totalCost),
        profit: Math.round(profit),
        profitMargin: Math.round(profitMargin * 100) / 100,
        trend: futureProfitMargin > profitMargin ? 'improving' : 'declining'
      };
    });
    
    // Simulate project profitability
    const projectProfitability = projects.map(project => {
      // Find time estimates for this project
      const projectTimeEstimates = timeEstimates.filter(te => te.projectId === project.id);
      
      const totalHours = projectTimeEstimates.reduce((sum, te) => sum + Number(te.estimatedHours || 0), 0);
      const totalRevenue = projectTimeEstimates.reduce((sum, te) => {
        const hourlyRate = Number(te.hourlyRate || 0);
        const hours = Number(te.estimatedHours || 0);
        return sum + (hourlyRate * hours);
      }, 0);
      
      // Simplified cost calculation
      const averageCostPerHour = 75; // Simplified average cost per hour
      const totalCost = totalHours * averageCostPerHour;
      
      // Calculate profitability
      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? profit / totalRevenue : 0;
      
      // Find client
      const client = clientCompanies.find(c => c.id === project.clientCompanyId);
      
      return {
        projectId: project.id,
        name: project.name,
        revenue: Math.round(totalRevenue),
        cost: Math.round(totalCost),
        profit: Math.round(profit),
        profitMargin: Math.round(profitMargin * 100) / 100
      };
    });
    
    // Sort by profitability (descending)
    clientProfitability.sort((a, b) => b.profitMargin - a.profitMargin);
    projectProfitability.sort((a, b) => b.profitMargin - a.profitMargin);
    
    return {
      clientProfitability,
      projectProfitability,
      mostProfitableClients: clientProfitability.slice(0, 3),
      leastProfitableClients: clientProfitability.filter(c => c.revenue > 1000).slice(-3).reverse(),
      overallProfitability: {
        current: clientProfitability.reduce((sum, c) => sum + c.profitMargin, 0) / 
          Math.max(1, clientProfitability.length),
        trending: clientProfitability.filter(c => c.trend === 'improving').length > 
          clientProfitability.filter(c => c.trend === 'declining').length ? 'up' : 'down'
      },
      profitabilityRecommendations: [
        "Focus business development efforts on industries similar to your most profitable clients",
        "Review pricing strategy for least profitable service offerings",
        "Consider implementing minimum profitability thresholds for new client acceptance"
      ]
    };
  }

  // Utility function to format period labels
  private formatPeriodLabel(date: Date, period: string): string {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (period === 'week') {
      // Format as week (e.g., "W13 2023")
      const weekNum = Math.ceil((date.getDate() - date.getDay()) / 7);
      return `W${weekNum} ${months[date.getMonth()]}`;
    } else if (period === 'quarter') {
      // Format as quarter (e.g., "Q1 2023")
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    } else {
      // Format as month (e.g., "Jan 2023")
      return `${months[date.getMonth()]} ${date.getFullYear()}`;
    }
  }

  // Utility function to check if a date falls within a period
  private isInPeriod(date: Date, periodDate: Date, periodConfig: { label: string, date: Date }): boolean {
    const period = periodConfig.label.split(' ')[0]; // Extract period part (e.g., "Jan" or "Q1")
    
    if (period.startsWith('W')) {
      // Weekly period - check if date is in the same week
      const dateWeek = Math.ceil((date.getDate() - date.getDay()) / 7);
      const periodWeek = Math.ceil((periodDate.getDate() - periodDate.getDay()) / 7);
      return date.getMonth() === periodDate.getMonth() && dateWeek === periodWeek;
    } else if (period.startsWith('Q')) {
      // Quarterly period - check if date is in the same quarter
      const dateQuarter = Math.floor(date.getMonth() / 3);
      const periodQuarter = Math.floor(periodDate.getMonth() / 3);
      return date.getFullYear() === periodDate.getFullYear() && dateQuarter === periodQuarter;
    } else {
      // Monthly period - check if date is in the same month
      return date.getMonth() === periodDate.getMonth() && date.getFullYear() === periodDate.getFullYear();
    }
  }

  // Helper to calculate revenue in a given period
  private calculateRevenueInPeriod(
    projects: Project[], 
    timeEstimates: TimeEstimate[],
    periodDate: Date,
    periodConfig: { label: string, date: Date }
  ): number {
    // Filter projects active in this period
    const activeProjects = projects.filter(project => {
      // Skip completed or cancelled projects
      if (project.status === 'completed' || project.status === 'cancelled') return false;
      
      // If no start date, include all active projects
      if (!project.startDate) return project.status === 'active';
      
      // Check if project is active in this period
      const projectStart = new Date(project.startDate);
      const projectEnd = project.endDate ? new Date(project.endDate) : null;
      
      // Project starts before or during this period
      const startsBeforeOrDuringPeriod = projectStart <= periodDate;
      
      // Project ends after or during this period, or has no end date
      const endsAfterOrDuringPeriod = !projectEnd || projectEnd >= periodDate;
      
      return startsBeforeOrDuringPeriod && endsAfterOrDuringPeriod;
    });
    
    // Calculate revenue for active projects
    return activeProjects.reduce((sum, project) => {
      // Find time estimates for this project
      const projectTimeEstimates = timeEstimates.filter(te => te.projectId === project.id);
      
      // Calculate average monthly revenue
      const totalRevenue = projectTimeEstimates.reduce((sum, te) => {
        const hourlyRate = Number(te.hourlyRate || 0);
        const hours = Number(te.estimatedHours || 0);
        return sum + (hourlyRate * hours);
      }, 0);
      
      // Distribute revenue across project duration
      let monthlyRevenue = totalRevenue;
      
      if (project.startDate && project.endDate) {
        const start = new Date(project.startDate);
        const end = new Date(project.endDate);
        const months = Math.max(1, (end.getFullYear() - start.getFullYear()) * 12 + 
          (end.getMonth() - start.getMonth()));
        monthlyRevenue = totalRevenue / months;
      }
      
      return sum + monthlyRevenue;
    }, 0);
  }
}