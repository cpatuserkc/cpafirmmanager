import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import ResourceCard from "@/components/resources/ResourceCard";
import ResourceFilters from "@/components/resources/ResourceFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { Resource } from "@shared/schema";

const ResourcesSection = () => {
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
  }).slice(0, 3);
  
  return (
    <section className="py-16 bg-white" id="resources">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading font-bold text-3xl text-neutral-800 mb-4">Resources for Accounting Professionals</h2>
          <p className="text-neutral-600 max-w-3xl mx-auto">Access free and premium resources to enhance your accounting practice.</p>
        </div>
        
        <div className="mb-10">
          <ResourceFilters activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
            {isLoading ? (
              // Loading skeletons
              Array(3).fill(0).map((_, index) => (
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
          
          <div className="text-center mt-10">
            <Link href="/resources" className="inline-block bg-primary text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-dark transition">
              View All Resources
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourcesSection;
