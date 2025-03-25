import { useQuery } from "@tanstack/react-query";
import { ProfessionalRole } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfessionalRoleSelectProps {
  value?: number;
  onChange: (value: number) => void;
  firmId?: number;
  disabled?: boolean;
}

const ProfessionalRoleSelect = ({ value, onChange, firmId, disabled = false }: ProfessionalRoleSelectProps) => {
  const { data: roles = [], isLoading } = useQuery<ProfessionalRole[]>({
    queryKey: firmId ? ["/api/professional-roles", firmId] : ["/api/professional-roles"],
    enabled: !disabled,
  });

  return (
    <Select
      onValueChange={(val) => onChange(Number(val))}
      value={value?.toString()}
      disabled={disabled || isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select role" />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role: ProfessionalRole) => (
          <SelectItem key={role.id} value={role.id.toString()}>
            {role.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ProfessionalRoleSelect;