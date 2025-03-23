import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Classification } from "@shared/schema";
import { LockKeyhole, FileTextIcon, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ClassificationPage = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const { data: classifications, isLoading } = useQuery({
    queryKey: ["/api/classifications"],
    queryFn: async () => {
      const res = await fetch("/api/classifications");
      if (!res.ok) throw new Error("Failed to fetch classifications");
      return res.json();
    }
  });

  // Extract unique categories
  const categories = classifications 
    ? [...new Set(classifications.map((c: Classification) => c.category))]
    : [];
  
  const filteredClassifications = activeCategory
    ? classifications?.filter((c: Classification) => c.category === activeCategory)
    : classifications;

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-heading font-bold text-3xl text-neutral-800 mb-4">Classification Systems</h1>
            <p className="text-neutral-600">
              Access standardized classification systems for various accounting scenarios to ensure consistency and accuracy in your work.
            </p>
          </div>
          
          <Tabs defaultValue="all" className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="all">All Classifications</TabsTrigger>
                <TabsTrigger value="free">Free</TabsTrigger>
                <TabsTrigger value="premium">Premium</TabsTrigger>
              </TabsList>
              <div className="flex items-center text-sm">
                <Filter className="h-4 w-4 mr-1" />
                <span>Filter by category:</span>
                <select 
                  className="ml-2 border-0 bg-neutral-100 rounded p-1 text-sm"
                  value={activeCategory || ""}
                  onChange={(e) => setActiveCategory(e.target.value || null)}
                >
                  <option value="">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <TabsContent value="all">
              {renderClassifications(filteredClassifications, isLoading)}
            </TabsContent>
            
            <TabsContent value="free">
              {renderClassifications(
                filteredClassifications?.filter((c: Classification) => c.accessLevel === "free"),
                isLoading
              )}
            </TabsContent>
            
            <TabsContent value="premium">
              {renderClassifications(
                filteredClassifications?.filter((c: Classification) => c.accessLevel === "premium"), 
                isLoading
              )}
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Request a Classification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-600 mb-4">
                Need a specific classification system that's not listed here? Let us know and our team of accounting experts will work on adding it to our library.
              </p>
              <div className="flex justify-center">
                <a href="#" className="flex items-center text-primary font-semibold hover:text-primary-dark">
                  <FileTextIcon className="mr-2 h-5 w-5" />
                  Request a Classification System
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const renderClassifications = (classifications: Classification[] | undefined, isLoading: boolean) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(3).fill(0).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="mt-4 space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!classifications || classifications.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileTextIcon className="h-12 w-12 mx-auto mb-3 text-neutral-400" />
          <h3 className="text-lg font-semibold mb-2">No Classifications Found</h3>
          <p className="text-neutral-600">
            No classification systems found with the current filter settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {classifications.map((classification) => (
        <Card key={classification.id}>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle>{classification.name}</CardTitle>
              <Badge variant={classification.accessLevel === "premium" ? "secondary" : "outline"}>
                {classification.accessLevel === "premium" ? (
                  <div className="flex items-center">
                    <LockKeyhole className="h-3 w-3 mr-1" />
                    Premium
                  </div>
                ) : "Free"}
              </Badge>
            </div>
            <p className="text-sm text-neutral-600">{classification.description}</p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible>
              {classification.details?.items?.map((item: string, index: number) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="py-2">{item}</AccordionTrigger>
                  <AccordionContent>
                    {classification.accessLevel === "premium" ? (
                      <div className="bg-neutral-50 p-4 rounded-md text-sm text-neutral-600 flex items-center">
                        <LockKeyhole className="h-4 w-4 mr-2 text-neutral-500" />
                        Detailed explanation available for premium members.
                      </div>
                    ) : (
                      <div className="bg-neutral-50 p-4 rounded-md text-sm text-neutral-600">
                        Example implementation and explanation for {item}.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ClassificationPage;
