import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ResourceFilters from "@/components/resources/ResourceFilters";
import ResourceCard from "@/components/resources/ResourceCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Resource } from "@shared/schema";
import { Download } from "lucide-react";

const Resources = () => {
  const [activeFilter, setActiveFilter] = useState<string>("all");
  
  const { data: resources, isLoading } = useQuery({
    queryKey: ["/api/resources"],
    queryFn: async () => {
      const res = await fetch(`/api/resources`);
      if (!res.ok) throw new Error("Failed to fetch resources");
      return res.json();
    }
  });
  
  const filteredResources = resources?.filter((resource: Resource) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "free") return resource.accessLevel === "free";
    if (activeFilter === "premium") return resource.accessLevel === "premium";
    if (activeFilter === "template") return resource.type === "template";
    return true;
  });

  return (
    <div className="min-h-screen bg-white py-10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="font-heading font-bold text-3xl text-neutral-800 mb-4">Resources for Accounting Professionals</h1>
          <p className="text-neutral-600 max-w-3xl mx-auto">Access free and premium resources to enhance your accounting practice.</p>
        </div>
        
        <ResourceFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {isLoading ? (
            // Loading skeletons
            Array(6).fill(0).map((_, index) => (
              <div key={index} className="bg-neutral-50 rounded-lg overflow-hidden shadow-sm">
                <div className="h-48 overflow-hidden">
                  <Skeleton className="w-full h-full" />
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))
          ) : filteredResources?.length > 0 ? (
            filteredResources.map((resource: Resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))
          ) : (
            <div className="col-span-3 text-center py-8 text-neutral-600">
              No resources found for the selected filter.
            </div>
          )}
        </div>
        
        <Card className="mt-12 p-6 max-w-3xl mx-auto">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-heading">Need a specific resource?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-600 mb-4">Our team is constantly adding new resources. If you need something specific, let us know and we'll try to create it!</p>
            <div className="flex justify-center">
              <a href="#" className="flex items-center text-primary font-semibold hover:text-primary-dark">
                <Download className="mr-2 h-5 w-5" />
                Request a Resource
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Resources;
