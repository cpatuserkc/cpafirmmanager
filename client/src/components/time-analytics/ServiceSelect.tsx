import { useQuery } from "@tanstack/react-query";
import { Service } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ServiceSelectProps {
  value?: number;
  onChange: (value: number) => void;
  firmId?: number;
  disabled?: boolean;
}

const ServiceSelect = ({ value, onChange, firmId, disabled = false }: ServiceSelectProps) => {
  const { data: services = [], isLoading } = useQuery({
    queryKey: firmId ? ["/api/services", firmId] : ["/api/services"],
    enabled: !disabled,
  });

  return (
    <Select
      onValueChange={(val) => onChange(Number(val))}
      value={value?.toString()}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select service" />
      </SelectTrigger>
      <SelectContent>
        {services.map((service: Service) => (
          <SelectItem key={service.id} value={service.id.toString()}>
            {service.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ServiceSelect;