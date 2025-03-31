import { useQuery } from "@tanstack/react-query";

export interface ProposalRecommendation {
  serviceId: number;
  serviceName: string;
  recommendedHours: number;
  recommendedRate: number;
  tier: 'top' | 'mid' | 'low';
  confidence: number;
  rationale: string;
}

export interface ProposalRecommendations {
  recommendations: ProposalRecommendation[];
  bestPractices: string[];
  pricingGuidance: {
    industry: string;
    averageHourlyRate: number;
    rateRange: {
      min: number;
      max: number;
    };
    seasonalFactor: number;
  };
  clientSpecificSuggestions: {
    clientId: number;
    clientName: string;
    suggestedServices: ProposalRecommendation[];
    reasoning: string[];
  }[];
}

interface UseProposalRecommendationsProps {
  clientId: number;
  firmId: number;
  industry?: string;
  enabled?: boolean;
}

export function useProposalRecommendations({
  clientId,
  firmId,
  industry,
  enabled = true
}: UseProposalRecommendationsProps) {
  return useQuery<ProposalRecommendations>({
    queryKey: ['/api/proposals/recommendations', clientId, firmId, industry],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams();
      params.append('clientId', clientId.toString());
      params.append('firmId', firmId.toString());
      if (industry) params.append('industry', industry);
      
      const response = await fetch(`/api/proposals/recommendations?${params.toString()}`, {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch proposal recommendations');
      }
      
      return response.json();
    },
    enabled: enabled && !!clientId && !!firmId
  });
}