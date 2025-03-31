/**
 * OpenAI Service for AI-Enhanced Proposals
 * 
 * This service provides functionality to generate intelligent proposal recommendations
 * using OpenAI's GPT models.
 */

import OpenAI from "openai";
import type { 
  Service, 
  ClientCompany, 
  Proposal,
  TimeEstimate
} from "@shared/schema";
import { ProposalRecommendation } from './ml-adapter';

// Initialize OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. Do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Interface for client data
interface ClientData {
  client: ClientCompany;
  previousProposals?: Proposal[];
  industryData?: { 
    avgRate: number;
    rateRange: { min: number; max: number };
    commonServices: string[];
  };
  previousTimeEstimates?: TimeEstimate[];
}

// Interface for service data
interface ServiceData {
  services: Service[];
  serviceCategories?: string[];
  popularServices?: { id: number; name: string; frequency: number }[];
  serviceProfitability?: { id: number; name: string; profitability: number }[];
}

// Main function to generate proposal recommendations
export async function generateAIProposalRecommendations(
  clientId: number,
  firmId: number,
  services: Service[],
  clientData: ClientData,
  industry?: string
): Promise<{
  recommendations: ProposalRecommendation[];
  bestPractices: string[];
  pricingGuidance: {
    industry: string;
    averageHourlyRate: number;
    rateRange: { min: number; max: number };
    seasonalFactor: number;
  };
  clientSpecificSuggestions: {
    clientId: number;
    clientName: string;
    suggestedServices: ProposalRecommendation[];
    reasoning: string[];
  }[];
}> {
  try {
    // Current month for seasonal factors
    const currentMonth = new Date().getMonth();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentMonthName = months[currentMonth];
    
    // Season factors based on typical CPA busy seasons
    const busySeasonFactor = (currentMonth >= 0 && currentMonth <= 3) || (currentMonth >= 7 && currentMonth <= 9) ? 1.2 : 1.0;
    
    // Prepare data for the OpenAI prompt
    const serviceData = services.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      typicalHours: s.typicalHours,
      standardRate: s.standardRate
    }));
    
    const clientInfo = {
      id: clientData.client.id,
      name: clientData.client.name,
      industry: clientData.client.industry || industry || "General",
      previousServices: clientData.previousProposals?.flatMap(p => p.proposalServices || []) || []
    };
    
    // Prepare prompt for OpenAI
    const prompt = `
    You are an expert CPA firm advisor specializing in creating custom proposals. 
    Based on the following data, generate service recommendations for a proposal to client ${clientInfo.name} in the ${clientInfo.industry} industry.
    
    Current month: ${currentMonthName}
    
    Available services:
    ${JSON.stringify(serviceData, null, 2)}
    
    Client information:
    ${JSON.stringify(clientInfo, null, 2)}
    
    Based on this information, provide the following in JSON format:
    1. A list of 3-5 recommended services for this client with:
       - serviceId (from the available services)
       - serviceName
       - recommendedHours (based on typical engagement sizes)
       - recommendedRate (based on industry standards and seasonal adjustments)
       - tier (either 'top', 'mid', or 'low' based on pricing tier)
       - confidence (a number between 0 and 1)
       - rationale (brief explanation for recommending this service)
    
    2. 5 best practices for proposal preparation
    
    3. Pricing guidance specific to the ${clientInfo.industry} industry
    
    4. Client-specific suggestions with reasoning
    `;
    
    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: "You are a professional advisor for CPA firms, specializing in proposal creation and pricing strategy." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }
    
    const aiResponse = JSON.parse(content);
    
    // Transform and validate AI response into our expected format
    const recommendations = Array.isArray(aiResponse.recommendations) 
      ? aiResponse.recommendations.map((rec: any) => ({
          serviceId: Number(rec.serviceId),
          serviceName: rec.serviceName,
          recommendedHours: Number(rec.recommendedHours),
          recommendedRate: Number(rec.recommendedRate),
          tier: rec.tier as 'top' | 'mid' | 'low',
          confidence: Number(rec.confidence),
          rationale: rec.rationale
        }))
      : [];
      
    const bestPractices = Array.isArray(aiResponse.bestPractices) 
      ? aiResponse.bestPractices.map((practice: any) => String(practice))
      : [
          "Include detailed scope of work with clear deliverables",
          "Specify timeline with key milestones and deadlines",
          "Outline communication expectations and frequency",
          "Include payment terms and schedule",
          "Add contingency for scope changes"
        ];
    
    // Format and return the response
    return {
      recommendations,
      bestPractices,
      pricingGuidance: {
        industry: industry || clientInfo.industry || "General",
        averageHourlyRate: aiResponse.pricingGuidance?.averageHourlyRate || 150,
        rateRange: {
          min: aiResponse.pricingGuidance?.rateRange?.min || 125,
          max: aiResponse.pricingGuidance?.rateRange?.max || 175
        },
        seasonalFactor: busySeasonFactor
      },
      clientSpecificSuggestions: [
        {
          clientId: clientId,
          clientName: clientData.client.name,
          suggestedServices: recommendations.slice(0, 3),
          reasoning: Array.isArray(aiResponse.clientSpecificSuggestions?.reasoning) 
            ? aiResponse.clientSpecificSuggestions.reasoning 
            : ["Based on industry trends and similar client profiles"]
        }
      ]
    };
  } catch (error) {
    console.error("Error generating AI proposal recommendations:", error);
    throw new Error('Failed to generate AI proposal recommendations');
  }
}

/**
 * Analyze PDF proposals to extract insights
 * @param pdfContent Base64 encoded PDF content
 */
export async function analyzeProposalDocument(pdfContent: string): Promise<{
  title: string;
  estimatedCost: number;
  services: { name: string; hours: number; rate: number }[];
  summary: string;
  insights: string[];
}> {
  try {
    // Call OpenAI API to analyze the PDF content
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "system", 
          content: "You are a professional proposal analyzer for a CPA firm. Extract key information from proposal documents." 
        },
        { 
          role: "user", 
          content: `
            Analyze this proposal document and extract the following information in JSON format:
            1. Proposal title
            2. Estimated total cost
            3. Services included (name, hours, rate)
            4. A brief summary of the proposal
            5. Key insights or observations
            
            Here is the document content:
            ${pdfContent.substring(0, 4000)}...
          `
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }
    
    const analysis = JSON.parse(content);
    
    // Format and return the analysis
    return {
      title: analysis.title || "Untitled Proposal",
      estimatedCost: Number(analysis.estimatedCost) || 0,
      services: Array.isArray(analysis.services) ? analysis.services : [],
      summary: analysis.summary || "No summary available",
      insights: Array.isArray(analysis.insights) ? analysis.insights : []
    };
  } catch (error) {
    console.error("Error analyzing proposal document:", error);
    throw new Error('Failed to analyze proposal document');
  }
}