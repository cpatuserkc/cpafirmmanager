/**
 * Data Engines System for CPA Resource Hub
 * Supports multiple data processing engines with different capabilities
 */

import { createReadStream } from 'fs';
import { FormData } from 'formdata-node';

interface DataEngineConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey?: string;
  capabilities: string[];
  maxFileSize: number;
  supportedFormats: string[];
}

interface ProcessingJob {
  id: string;
  engineId: string;
  type: 'document_analysis' | 'tax_calculation' | 'financial_analysis' | 'bulk_processing';
  status: 'queued' | 'processing' | 'completed' | 'failed';
  input: any;
  output?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

interface DocumentAnalysisRequest {
  documentType: 'tax_return' | 'financial_statement' | 'client_records' | 'general';
  analysisType: 'extract_data' | 'validate_entries' | 'calculate_totals' | 'compliance_check';
  clientId?: number;
  firmId: number;
}

interface BulkCalculationRequest {
  calculationType: 'tax_estimates' | 'depreciation' | 'payroll' | 'custom';
  dataSet: any[];
  parameters: Record<string, any>;
}

class DataEngineManager {
  private engines: Map<string, DataEngineConfig> = new Map();
  private jobs: Map<string, ProcessingJob> = new Map();

  constructor() {
    this.initializeEngines();
  }

  private initializeEngines() {
    // External data processing engines
    const engines: DataEngineConfig[] = [
      {
        id: 'cpa_analytics_engine',
        name: 'CPA Analytics Engine',
        baseUrl: 'https://ss-cpa-firm-manager-v-100-accounts95.replit.app',
        capabilities: ['tax_calculations', 'financial_analysis', 'client_insights', 'bulk_processing'],
        maxFileSize: 50 * 1024 * 1024, // 50MB
        supportedFormats: ['pdf', 'xlsx', 'csv', 'json', 'zip']
      },
      {
        id: 'document_processor',
        name: 'Document Processing Engine',
        baseUrl: 'https://14b71d64-e9ea-4b1f-beb0-14e95f144af5-00-iz6bsxxlx3nd.picard.replit.dev',
        capabilities: ['document_analysis', 'ocr', 'data_extraction', 'compliance_check'],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        supportedFormats: ['pdf', 'jpg', 'png', 'tiff', 'zip']
      },
      {
        id: 'calculation_engine',
        name: 'High-Performance Calculation Engine',  
        baseUrl: process.env.CALCULATION_ENGINE_URL || 'http://localhost:8000',
        capabilities: ['complex_calculations', 'tax_modeling', 'scenario_analysis', 'optimization'],
        maxFileSize: 200 * 1024 * 1024, // 200MB
        supportedFormats: ['json', 'csv', 'xlsx', 'zip']
      }
    ];

    engines.forEach(engine => this.engines.set(engine.id, engine));
  }

  /**
   * Get available data engines
   */
  getEngines(): DataEngineConfig[] {
    return Array.from(this.engines.values());
  }

  /**
   * Get engine by capabilities
   */
  getEnginesByCapability(capability: string): DataEngineConfig[] {
    return Array.from(this.engines.values()).filter(
      engine => engine.capabilities.includes(capability)
    );
  }

  /**
   * Submit document for analysis
   */
  async processDocument(
    filePath: string,
    request: DocumentAnalysisRequest,
    engineId?: string
  ): Promise<ProcessingJob> {
    const selectedEngine = engineId 
      ? this.engines.get(engineId)
      : this.getEnginesByCapability('document_analysis')[0];

    if (!selectedEngine) {
      throw new Error('No suitable document processing engine available');
    }

    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      engineId: selectedEngine.id,
      type: 'document_analysis',
      status: 'queued',
      input: { filePath, ...request },
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);

    // Process asynchronously
    this.executeDocumentProcessing(job, selectedEngine, filePath, request)
      .catch(error => {
        job.status = 'failed';
        job.error = error.message;
      });

    return job;
  }

  /**
   * Submit bulk calculations
   */
  async processBulkCalculation(
    request: BulkCalculationRequest,
    engineId?: string
  ): Promise<ProcessingJob> {
    const selectedEngine = engineId
      ? this.engines.get(engineId)
      : this.getEnginesByCapability('bulk_processing')[0];

    if (!selectedEngine) {
      throw new Error('No suitable calculation engine available');
    }

    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      engineId: selectedEngine.id,
      type: 'bulk_processing',
      status: 'queued',
      input: request,
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);

    // Process asynchronously
    this.executeBulkCalculation(job, selectedEngine, request)
      .catch(error => {
        job.status = 'failed';
        job.error = error.message;
      });

    return job;
  }

  /**
   * Process financial analysis with live QuickBooks data
   */
  async processFinancialAnalysis(
    qbData: any,
    analysisType: 'cash_flow' | 'profitability' | 'tax_planning' | 'forecasting',
    engineId?: string
  ): Promise<ProcessingJob> {
    const selectedEngine = engineId
      ? this.engines.get(engineId)
      : this.getEnginesByCapability('financial_analysis')[0];

    if (!selectedEngine) {
      throw new Error('No suitable financial analysis engine available');
    }

    const jobId = this.generateJobId();
    const job: ProcessingJob = {
      id: jobId,
      engineId: selectedEngine.id,
      type: 'financial_analysis',
      status: 'queued',
      input: { qbData, analysisType },
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);

    // Process asynchronously
    this.executeFinancialAnalysis(job, selectedEngine, qbData, analysisType)
      .catch(error => {
        job.status = 'failed';
        job.error = error.message;
      });

    return job;
  }

  /**
   * Get job status
   */
  getJob(jobId: string): ProcessingJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all jobs for a firm
   */
  getJobsByFirm(firmId: number): ProcessingJob[] {
    return Array.from(this.jobs.values()).filter(
      job => job.input.firmId === firmId
    );
  }

  private async executeDocumentProcessing(
    job: ProcessingJob,
    engine: DataEngineConfig,
    filePath: string,
    request: DocumentAnalysisRequest
  ): Promise<void> {
    try {
      job.status = 'processing';

      const formData = new FormData();
      formData.append('file', createReadStream(filePath));
      formData.append('documentType', request.documentType);
      formData.append('analysisType', request.analysisType);
      formData.append('firmId', request.firmId.toString());

      if (request.clientId) {
        formData.append('clientId', request.clientId.toString());
      }

      const response = await fetch(`${engine.baseUrl}/api/process-document`, {
        method: 'POST',
        body: formData as any,
        headers: engine.apiKey ? { 'Authorization': `Bearer ${engine.apiKey}` } : {}
      });

      if (!response.ok) {
        throw new Error(`Engine processing failed: ${response.status}`);
      }

      const result = await response.json();
      
      job.status = 'completed';
      job.output = result;
      job.completedAt = new Date();

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Processing failed';
    }
  }

  private async executeBulkCalculation(
    job: ProcessingJob,
    engine: DataEngineConfig,
    request: BulkCalculationRequest
  ): Promise<void> {
    try {
      job.status = 'processing';

      const response = await fetch(`${engine.baseUrl}/api/bulk-calculate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(engine.apiKey ? { 'Authorization': `Bearer ${engine.apiKey}` } : {})
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Bulk calculation failed: ${response.status}`);
      }

      const result = await response.json();
      
      job.status = 'completed';
      job.output = result;
      job.completedAt = new Date();

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Calculation failed';
    }
  }

  private async executeFinancialAnalysis(
    job: ProcessingJob,
    engine: DataEngineConfig,
    qbData: any,
    analysisType: string
  ): Promise<void> {
    try {
      job.status = 'processing';

      const response = await fetch(`${engine.baseUrl}/api/analyze-financial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(engine.apiKey ? { 'Authorization': `Bearer ${engine.apiKey}` } : {})
        },
        body: JSON.stringify({
          qbData,
          analysisType,
          historicalData: await this.getHistoricalEngagementData()
        })
      });

      if (!response.ok) {
        throw new Error(`Financial analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      job.status = 'completed';
      job.output = result;
      job.completedAt = new Date();

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Analysis failed';
    }
  }

  private async getHistoricalEngagementData(): Promise<any> {
    // Return the 787 historical engagements for enhanced analysis
    return {
      totalEngagements: 787,
      serviceBreakdown: {
        'Tax Services': 450,
        'Accounting Services': 220, 
        'Advisory Services': 85,
        'Payroll Services': 32
      },
      complexityDistribution: {
        'Basic': 320,
        'Intermediate': 285,
        'Advanced': 140,
        'Complex': 42
      }
    };
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Test engine connectivity
   */
  async testEngine(engineId: string): Promise<{ success: boolean; message: string; latency?: number }> {
    const engine = this.engines.get(engineId);
    if (!engine) {
      return { success: false, message: 'Engine not found' };
    }

    try {
      const startTime = Date.now();
      const response = await fetch(`${engine.baseUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const latency = Date.now() - startTime;

      return {
        success: response.ok,
        message: response.ok ? 'Engine is responsive' : `Engine returned ${response.status}`,
        latency
      };
    } catch (error) {
      return {
        success: false,
        message: `Engine unreachable: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export { DataEngineManager, DataEngineConfig, ProcessingJob, DocumentAnalysisRequest, BulkCalculationRequest };