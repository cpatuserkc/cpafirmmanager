import { useQuery } from "@tanstack/react-query";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactSelectProps {
  value?: number;
  onChange: (value: number) => void;
  clientId: number | null;
  disabled?: boolean;
}

const ContactSelect = ({ value, onChange, clientId, disabled = false }: ContactSelectProps) => {
  // Fetch contacts for the selected client
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['/api/contacts', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      const res = await fetch(`/api/contacts?clientId=${clientId}`);
      if (!res.ok) throw new Error('Failed to fetch contacts');
      return res.json();
    },
    enabled: !!clientId,
  });

  return (
    <Select
      value={value ? value.toString() : ""}
      onValueChange={(val) => onChange(parseInt(val))}
      disabled={disabled || isLoading || contacts.length === 0}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={
          isLoading 
            ? "Loading contacts..." 
            : contacts.length === 0 
              ? "No contacts available" 
              : "Select a contact"
        } />
      </SelectTrigger>
      <SelectContent>
        {contacts.map((contact: any) => (
          <SelectItem key={contact.id} value={contact.id.toString()}>
            {contact.firstName} {contact.lastName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ContactSelect;