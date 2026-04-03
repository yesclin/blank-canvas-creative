import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface MeasurementSection {
  id: string;
  label: string;
  fields: string[];
}

interface AccordionMeasurementGroupProps {
  sections: MeasurementSection[];
  values: Record<string, Record<string, number | null>>;
  onChange: (sectionId: string, fieldId: string, value: number | null) => void;
  disabled?: boolean;
}

function calcMedian(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => v !== null && !isNaN(v));
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function AccordionMeasurementGroup({
  sections,
  values,
  onChange,
  disabled = false,
}: AccordionMeasurementGroupProps) {
  const [openSections, setOpenSections] = useState<string[]>([]);

  const toggle = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-2">
      {sections.map((section) => {
        const sectionVals = values[section.id] || {};
        const fieldValues = section.fields.map((f) => sectionVals[f] ?? null);
        const median = calcMedian(fieldValues);
        const isOpen = openSections.includes(section.id);

        return (
          <Collapsible key={section.id} open={isOpen} onOpenChange={() => toggle(section.id)}>
            <CollapsibleTrigger className="w-full">
              <div className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/50 transition-colors">
                <span className="font-medium text-sm">{section.label}</span>
                <div className="flex items-center gap-3">
                  {median !== null && (
                    <span className="text-xs text-muted-foreground">
                      Mediana: <span className="font-medium text-foreground">{median.toFixed(1)} mm</span>
                    </span>
                  )}
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                  />
                </div>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-3 gap-3 px-4 py-3 bg-muted/20 rounded-b-lg border border-t-0">
                {section.fields.map((field, idx) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{`${idx + 1}ª medida`}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={sectionVals[field] ?? ''}
                      onChange={(e) =>
                        onChange(
                          section.id,
                          field,
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      disabled={disabled}
                      className="h-8 text-sm"
                      placeholder="mm"
                    />
                  </div>
                ))}
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Mediana</Label>
                  <div className="flex h-8 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">
                    {median !== null ? `${median.toFixed(1)} mm` : '—'}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
}
