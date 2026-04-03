import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { User, Ruler, Scale } from 'lucide-react';

interface BMICalculatorProps {
  weight: number | null;
  height: number | null;
  onChangeWeight: (v: number | null) => void;
  onChangeHeight: (v: number | null) => void;
  disabled?: boolean;
}

function getObesityType(bmi: number): string {
  if (bmi < 18.5) return 'Abaixo do peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  if (bmi < 35) return 'Obesidade Grau I';
  if (bmi < 40) return 'Obesidade Grau II';
  return 'Obesidade Grau III (mórbida)';
}

function getCircumferenceRisk(bmi: number): string {
  if (bmi < 25) return 'Sem risco aumentado';
  if (bmi < 30) return 'Risco aumentado';
  return 'Risco muito aumentado';
}

export function BMICalculator({
  weight,
  height,
  onChangeWeight,
  onChangeHeight,
  disabled = false,
}: BMICalculatorProps) {
  const bmi = useMemo(() => {
    if (!weight || !height || height <= 0) return null;
    const hMeters = height / 100;
    return weight / (hMeters * hMeters);
  }, [weight, height]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-1.5">
            <Scale className="h-3.5 w-3.5" /> Peso (kg)
          </Label>
          <Input
            type="number"
            step="0.1"
            value={weight ?? ''}
            onChange={(e) => onChangeWeight(e.target.value ? parseFloat(e.target.value) : null)}
            disabled={disabled}
            placeholder="Ex: 72.5"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-1.5">
            <Ruler className="h-3.5 w-3.5" /> Altura (cm)
          </Label>
          <Input
            type="number"
            step="1"
            value={height ?? ''}
            onChange={(e) => onChangeHeight(e.target.value ? parseFloat(e.target.value) : null)}
            disabled={disabled}
            placeholder="Ex: 170"
          />
        </div>
      </div>

      {bmi !== null && (
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground mb-1">IMC</p>
                <p className="text-2xl font-bold text-primary">{bmi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Classificação</p>
                <p className="text-sm font-medium">{getObesityType(bmi)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Risco circunferencial</p>
                <p className="text-sm font-medium">{getCircumferenceRisk(bmi)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Body placeholder illustration */}
      <div className="flex justify-center">
        <div className="flex h-40 w-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/20">
          <User className="h-16 w-16 text-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}
