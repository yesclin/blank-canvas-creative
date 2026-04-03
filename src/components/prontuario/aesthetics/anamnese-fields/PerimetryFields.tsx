import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PerimetryField {
  id: string;
  label: string;
}

interface PerimetryFieldsProps {
  fields: PerimetryField[];
  values: Record<string, number | null>;
  onChange: (fieldId: string, value: number | null) => void;
  disabled?: boolean;
}

export function PerimetryFields({ fields, values, onChange, disabled = false }: PerimetryFieldsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {fields.map((field) => (
        <div key={field.id} className="space-y-1">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="number"
            step="0.1"
            value={values[field.id] ?? ''}
            onChange={(e) =>
              onChange(field.id, e.target.value ? parseFloat(e.target.value) : null)
            }
            disabled={disabled}
            className="h-8 text-sm"
            placeholder="cm"
          />
        </div>
      ))}
    </div>
  );
}
