/**
 * ML Service Module
 * 
 * Central configuration point for ML services in the application
 */

import { registerMLProvider, getMLProvider, getDefaultMLProvider, MLInsightsRequest, MLInsightsResponse } from './ml-adapter';
import { InHouseMLProvider } from './ml-in-house-provider';
import { ExternalMLProvider } from './ml-external-provider';

// Set up our ML providers
export function initializeMLProviders() {
  console.log('Initializing ML providers...');
  
  // Register the in-house provider (our simulated ML)
  registerMLProvider(new InHouseMLProvider());
  
  // Check for API key in environment
  const externalMLApiKey = process.env.EXTERNAL_ML_API_KEY;
  
  // Register external provider if API key is available
  if (externalMLApiKey) {
    console.log('External ML API key found, registering external provider');
    registerMLProvider(new ExternalMLProvider(externalMLApiKey));
  } else {
    console.log('No external ML API key found, registering simulation mode');
    // Register with no API key - will use simulated responses
    registerMLProvider(new ExternalMLProvider());
  }
  
  return {
    getProvider: getMLProvider,
    getDefaultProvider: getDefaultMLProvider
  };
}

// Main service function to generate insights
export async function generateMLInsights(
  request: MLInsightsRequest, 
  providerName?: string
): Promise<MLInsightsResponse> {
  try {
    // Use specified provider or default
    const provider = providerName ? 
      getMLProvider(providerName) : 
      getDefaultMLProvider();
    
    console.log(`Generating ML insights using provider: ${provider.getName()}`);
    
    // Generate insights using the provider
    return await provider.generateInsights(request);
    
  } catch (error) {
    console.error('Error generating ML insights:', error);
    throw new Error('Failed to generate ML insights');
  }
}