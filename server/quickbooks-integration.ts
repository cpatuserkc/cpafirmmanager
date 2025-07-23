/**
 * QuickBooks Online Integration for CPA Resource Hub
 * Real integration using user's QB developer test app credentials
 */

interface QBConfig {
  clientId: string;
  clientSecret: string;
  sandboxBaseUrl: string;
  discoveryDocument: string;
}

interface QBToken {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  company_id: string;
}

interface QBClient {
  Id: string;
  Name: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  BillAddr?: {
    Line1?: string;
    City?: string;
    CountrySubDivisionCode?: string;
    PostalCode?: string;
  };
}

interface QBTimeActivity {
  Id: string;
  TxnDate: string;
  Description?: string;
  Hours: number;
  HourlyRate?: number;
  Customer: { value: string; name: string };
  Employee?: { value: string; name: string };
}

class QuickBooksIntegration {
  private config: QBConfig;
  private token: QBToken | null = null;

  constructor() {
    this.config = {
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      sandboxBaseUrl: process.env.QUICKBOOKS_SANDBOX_BASE_URL!,
      discoveryDocument: 'https://appcenter.intuit.com/api/v1/openid_connect/openid-connect-discovery-document'
    };
  }

  /**
   * Generate OAuth URL for QuickBooks authorization
   */
  generateAuthUrl(redirectUri: string): string {
    const scope = 'com.intuit.quickbooks.accounting';
    const state = Math.random().toString(36).substring(7);
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      scope: scope,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      state: state
    });

    return `https://appcenter.intuit.com/connect/oauth2?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<QBToken> {
    try {
      const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
      
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      });

      const credentials = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64');

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      const tokenData = await response.json();
      this.token = {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        company_id: tokenData.realmId || 'sandbox_company'
      };

      return this.token;
      
    } catch (error) {
      console.error('QB token exchange error:', error);
      throw error;
    }
  }

  /**
   * Make authenticated request to QuickBooks API
   */
  private async makeQBRequest(endpoint: string): Promise<any> {
    if (!this.token) {
      throw new Error('No QB token available - need to authorize first');
    }

    const url = `${this.config.sandboxBaseUrl}/v3/company/${this.token.company_id}/${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token.access_token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`QB API request failed: ${response.status} - ${await response.text()}`);
    }

    return response.json();
  }

  /**
   * Sync client data from QuickBooks
   */
  async syncClients(): Promise<QBClient[]> {
    try {
      const response = await this.makeQBRequest("customers?fetchAll=true");
      const customers = response.QueryResponse?.Customer || [];
      
      console.log(`Synced ${customers.length} clients from QuickBooks`);
      
      return customers.map((customer: any) => ({
        Id: customer.Id,
        Name: customer.Name,
        CompanyName: customer.CompanyName || customer.Name,
        PrimaryEmailAddr: customer.PrimaryEmailAddr,
        PrimaryPhone: customer.PrimaryPhone,
        BillAddr: customer.BillAddr
      }));
      
    } catch (error) {
      console.error('QB client sync error:', error);
      throw error;
    }
  }

  /**
   * Sync time tracking data from QuickBooks
   */
  async syncTimeActivities(fromDate?: string): Promise<QBTimeActivity[]> {
    try {
      let query = "timeactivities";
      if (fromDate) {
        query += `?query=TxnDate >= '${fromDate}'`;
      }
      
      const response = await this.makeQBRequest(query);
      const timeActivities = response.QueryResponse?.TimeActivity || [];
      
      console.log(`Synced ${timeActivities.length} time activities from QuickBooks`);
      
      return timeActivities.map((activity: any) => ({
        Id: activity.Id,
        TxnDate: activity.TxnDate,
        Description: activity.Description,
        Hours: parseFloat(activity.Hours || '0'),
        HourlyRate: parseFloat(activity.HourlyRate?.amount || '0'),
        Customer: activity.CustomerRef || { value: '', name: 'Unknown' },
        Employee: activity.EmployeeRef || null
      }));
      
    } catch (error) {
      console.error('QB time activities sync error:', error);
      throw error;
    }
  }

  /**
   * Get company information from QuickBooks
   */
  async getCompanyInfo(): Promise<any> {
    try {
      const response = await this.makeQBRequest("companyinfo/1");
      return response.QueryResponse?.CompanyInfo?.[0] || null;
    } catch (error) {
      console.error('QB company info error:', error);
      throw error;
    }
  }

  /**
   * Aggregate financial data for CPA analytics
   */
  async aggregateFinancialData(): Promise<{
    totalRevenue: number;
    clientCount: number;
    avgHourlyRate: number;
    totalHours: number;
    topClients: Array<{ name: string; revenue: number }>;
  }> {
    try {
      const [clients, timeActivities] = await Promise.all([
        this.syncClients(),
        this.syncTimeActivities()
      ]);

      const totalRevenue = timeActivities.reduce((sum, activity) => 
        sum + (activity.Hours * (activity.HourlyRate || 0)), 0
      );

      const totalHours = timeActivities.reduce((sum, activity) => sum + activity.Hours, 0);
      const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;

      // Calculate top clients by revenue
      const clientRevenue = new Map<string, number>();
      timeActivities.forEach(activity => {
        const clientName = activity.Customer?.name || 'Unknown';
        const revenue = activity.Hours * (activity.HourlyRate || 0);
        clientRevenue.set(clientName, (clientRevenue.get(clientName) || 0) + revenue);
      });

      const topClients = Array.from(clientRevenue.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([name, revenue]) => ({ name, revenue }));

      return {
        totalRevenue,
        clientCount: clients.length,
        avgHourlyRate,
        totalHours,
        topClients
      };

    } catch (error) {
      console.error('QB financial aggregation error:', error);
      throw error;
    }
  }

  /**
   * Test connection with current credentials
   */
  async testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      if (!this.token) {
        return {
          success: false,
          message: 'No authorization token - need to complete QB OAuth flow first'
        };
      }

      const companyInfo = await this.getCompanyInfo();
      
      return {
        success: true,
        message: 'QuickBooks connection successful',
        data: {
          companyName: companyInfo?.Name || 'Sandbox Company',
          companyId: this.token.company_id,
          environment: 'sandbox'
        }
      };

    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Set token for testing (bypass OAuth for development)
   */
  setTestToken(token: QBToken): void {
    this.token = token;
  }
}

export { QuickBooksIntegration, QBClient, QBTimeActivity, QBToken };