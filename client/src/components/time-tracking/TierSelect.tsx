import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TierSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const TierSelect = ({ value, onChange, disabled = false }: TierSelectProps) => {
  const tiers = [
    { value: "top", label: "Top-tier" },
    { value: "mid", label: "Mid-tier" },
    { value: "low", label: "Low-tier" },
  ];

  return (
    <Select
      onValueChange={onChange}
      value={value}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select billing tier" />
      </SelectTrigger>
      <SelectContent>
        {tiers.map((tier) => (
          <SelectItem key={tier.value} value={tier.value}>
            {tier.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TierSelect;