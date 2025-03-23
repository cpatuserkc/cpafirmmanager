import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthContext } from "@/App";
import { Client } from "@shared/schema";

interface ClientSelectProps {
  value?: number;
  onChange: (value: number) => void;
}

const ClientSelect = ({ value, onChange }: ClientSelectProps) => {
  const { user } = useContext(AuthContext);
  
  const { data: clients, isLoading } = useQuery({
    queryKey: ["/api/clients", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const res = await fetch(`/api/clients?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
    enabled: !!user,
  });
  
  if (isLoading) {
    return <Skeleton className="h-10 w-full" />;
  }
  
  if (!clients || clients.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="No clients available" />
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
        <SelectValue placeholder="Select a client" />
      </SelectTrigger>
      <SelectContent>
        {clients.map((client: Client) => (
          <SelectItem key={client.id} value={client.id.toString()}>
            {client.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ClientSelect;
