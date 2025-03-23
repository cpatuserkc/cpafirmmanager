import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Project } from "@shared/schema";

interface ProjectSelectProps {
  value?: number;
  onChange: (value: number) => void;
  clientId: number | null;
  disabled?: boolean;
}

const ProjectSelect = ({ value, onChange, clientId, disabled = false }: ProjectSelectProps) => {
  const { data: projects, isLoading } = useQuery({
    queryKey: ["/api/projects", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const res = await fetch(`/api/projects?clientId=${clientId}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
    enabled: !!clientId,
  });
  
  if (disabled) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Select a client first" />
        </SelectTrigger>
      </Select>
    );
  }
  
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }
  
  if (!projects || projects.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="No projects available" />
        </SelectTrigger>
      </Select>
    );
  }
  
  return (
    <Select
      value={value?.toString()}
      onValueChange={(val) => onChange(Number(val))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select a project" />
      </SelectTrigger>
      <SelectContent>
        {projects.map((project: Project) => (
          <SelectItem key={project.id} value={project.id.toString()}>
            {project.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProjectSelect;
