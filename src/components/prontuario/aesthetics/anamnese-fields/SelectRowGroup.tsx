import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface SelectDef {
  id: string;
  label: string;
  options: string[];
}

interface SelectRowGroupProps {
  selects: SelectDef[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
  disabled?: boolean;
}

export function SelectRowGroup({ selects, values, onChange, disabled = false }: SelectRowGroupProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {selects.map((s) => (
        <div key={s.id} className="flex-1 min-w-[180px] space-y-1.5">
          <Label className="text-xs font-medium">{s.label}</Label>
          <Select
            value={values[s.id] || ''}
            onValueChange={(v) => onChange(s.id, v)}
            disabled={disabled}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Selecionar..." />
            </SelectTrigger>
            <SelectContent>
              {s.options.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );
}
