import { Button } from "@/components/ui/button";

interface ResourceFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

const ResourceFilters = ({ activeFilter, setActiveFilter }: ResourceFiltersProps) => {
  const filters = [
    { id: "all", label: "All Resources" },
    { id: "free", label: "Free Resources" },
    { id: "premium", label: "Premium Content" },
    { id: "template", label: "Templates" }
  ];

  return (
    <div className="flex justify-center space-x-4 mb-8 flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.id}
          variant={activeFilter === filter.id ? "default" : "outline"}
          className={activeFilter === filter.id 
            ? "bg-primary text-white" 
            : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
          }
          onClick={() => setActiveFilter(filter.id)}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  );
};

export default ResourceFilters;
