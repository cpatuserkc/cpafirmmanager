import React, { useState } from "react";
import { useProposalRecommendations, type ProposalRecommendation } from "@/hooks/use-proposal-recommendations";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Info, Clock, DollarSign, LineChart, CheckCircle, ThumbsUp, BarChart4 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ProposalRecommendationsProps {
  clientId: number;
  firmId: number;
  industry?: string;
  onSelectService: (recommendation: ProposalRecommendation) => void;
}

export function ProposalRecommendations({
  clientId,
  firmId,
  industry,
  onSelectService,
}: ProposalRecommendationsProps) {
  const { data, isLoading, error } = useProposalRecommendations({
    clientId,
    firmId,
    industry,
    enabled: !!clientId && !!firmId,
  });
  
  const [selectedTab, setSelectedTab] = useState("recommendations");

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6 px-6 flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">
            Analyzing historical data and generating AI recommendations...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="pt-6 px-6 flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-destructive">Failed to load AI recommendations</p>
          <p className="text-muted-foreground text-sm mt-2">
            Please try again later or proceed with manual proposal creation.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { recommendations, bestPractices, pricingGuidance, clientSpecificSuggestions } = data;

  // Format to currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <LineChart className="h-5 w-5 mr-2 text-primary" />
          AI-Powered Proposal Recommendations
        </CardTitle>
        <CardDescription>
          Insights based on historical data and industry benchmarks
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pb-0">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="recommendations">Recommended Services</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Guidance</TabsTrigger>
            <TabsTrigger value="practices">Best Practices</TabsTrigger>
          </TabsList>

          <TabsContent value="recommendations" className="space-y-4">
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => (
                <ServiceRecommendation 
                  key={rec.serviceId || i} 
                  recommendation={rec} 
                  onSelect={() => onSelectService(rec)}
                />
              ))
            ) : (
              <Card className="border border-dashed p-6 flex flex-col items-center">
                <Info className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground text-center">
                  No service recommendations available for this client
                </p>
              </Card>
            )}
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Client-Specific Insights
              </h4>
              {clientSpecificSuggestions.length > 0 ? (
                clientSpecificSuggestions.map((suggestion, i) => (
                  <Card key={i} className="p-4 mb-3 bg-muted/50">
                    <h5 className="font-medium">{suggestion.clientName}</h5>
                    <ul className="mt-1 text-sm space-y-1">
                      {suggestion.reasoning.map((reason, j) => (
                        <li key={j} className="text-muted-foreground flex items-start">
                          <span className="mr-2 text-primary">•</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">
                  No client-specific insights available
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pricing">
            <div className="space-y-6 p-1">
              <div className="flex flex-col space-y-2">
                <h4 className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-primary" />
                  Industry Rate Benchmarks: {pricingGuidance.industry}
                </h4>
                <div className="grid grid-cols-3 gap-4 mt-2">
                  <div className="bg-muted p-4 rounded-md">
                    <div className="text-2xl font-bold">
                      {formatCurrency(pricingGuidance.averageHourlyRate)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Average hourly rate
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <div className="text-2xl font-bold">
                      {formatCurrency(pricingGuidance.rateRange.min)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Minimum rate
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-md">
                    <div className="text-2xl font-bold">
                      {formatCurrency(pricingGuidance.rateRange.max)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Maximum rate
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center mb-2">
                  <BarChart4 className="h-4 w-4 mr-1 text-primary" />
                  Seasonal Factor
                </h4>
                <div className="flex items-center space-x-4">
                  <Progress 
                    value={pricingGuidance.seasonalFactor * 50} 
                    className="h-3" 
                  />
                  <span className="text-sm font-medium">
                    {(pricingGuidance.seasonalFactor * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {pricingGuidance.seasonalFactor > 1 
                    ? "Current season shows higher demand. Consider adjusting rates to reflect market conditions." 
                    : "Current season shows standard or lower demand. Competitive pricing may be more effective."}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium flex items-center mb-2">
                  <ThumbsUp className="h-4 w-4 mr-1 text-primary" />
                  Pricing Recommendations
                </h4>
                <ul className="space-y-2">
                  <li className="text-sm flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Consider bundling services for better value proposition
                  </li>
                  <li className="text-sm flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Offer tiered pricing options (standard, premium)
                  </li>
                  <li className="text-sm flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    Include pricing comparison to demonstrate value
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="practices">
            <div className="space-y-4 p-1">
              <h4 className="text-sm font-medium flex items-center">
                <Check className="h-4 w-4 mr-1 text-primary" />
                Proposal Best Practices
              </h4>
              <ul className="space-y-3">
                {bestPractices.map((practice, i) => (
                  <li key={i} className="flex items-start p-2 bg-muted/50 rounded-md">
                    <span className="mr-2 text-primary mt-0.5">
                      <Check className="h-4 w-4" />
                    </span>
                    <span>{practice}</span>
                  </li>
                ))}
              </ul>
              
              <h4 className="text-sm font-medium flex items-center mt-6">
                <Clock className="h-4 w-4 mr-1 text-primary" />
                Timeframe Recommendations
              </h4>
              <ul className="space-y-2">
                <li className="text-sm flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  Clearly define project phases with specific deliverables
                </li>
                <li className="text-sm flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  Include buffer time for client feedback and revisions
                </li>
                <li className="text-sm flex items-start">
                  <span className="mr-2 text-primary">•</span>
                  Set explicit deadlines for client-provided materials
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground italic px-4 py-3">
        Recommendations are based on historical data and AI analysis of similar clients and services
      </CardFooter>
    </Card>
  );
}

function ServiceRecommendation({ 
  recommendation, 
  onSelect 
}: { 
  recommendation: ProposalRecommendation; 
  onSelect: () => void;
}) {
  const confidencePercent = Math.round(recommendation.confidence * 100);
  const confidenceColor = 
    confidencePercent >= 80 ? "bg-green-500" : 
    confidencePercent >= 60 ? "bg-amber-500" : 
    "bg-red-500";
  
  // Determine tier badge color
  const tierColor = 
    recommendation.tier === "top" ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : 
    recommendation.tier === "mid" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
    "bg-orange-100 text-orange-800 hover:bg-orange-100";
  
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-row">
        <div 
          className={cn(
            "w-1.5 h-auto", 
            confidenceColor
          )} 
        />
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{recommendation.serviceName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn("text-xs", tierColor)}>
                  {recommendation.tier.toUpperCase()} TIER
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Info className="h-3 w-3 mr-1" />
                        {confidencePercent}% confidence
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>AI confidence level based on historical data</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <Button size="sm" onClick={onSelect}>Add to Proposal</Button>
          </div>
          
          <Separator className="my-3" />
          
          <div className="grid grid-cols-2 gap-4 text-sm mt-2">
            <div>
              <div className="text-muted-foreground text-xs">Recommended Hours</div>
              <div className="font-medium">{recommendation.recommendedHours} hours</div>
            </div>
            <div>
              <div className="text-muted-foreground text-xs">Recommended Rate</div>
              <div className="font-medium">${recommendation.recommendedRate}/hr</div>
            </div>
          </div>
          
          <div className="mt-3 text-sm text-muted-foreground">
            <div className="text-xs font-medium text-foreground mb-1">Rationale:</div>
            {recommendation.rationale}
          </div>
        </div>
      </div>
    </Card>
  );
}