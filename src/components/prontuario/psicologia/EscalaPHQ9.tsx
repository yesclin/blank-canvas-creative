import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";

const PHQ9_QUESTIONS = [
  "Pouco interesse ou pouco prazer em fazer as coisas",
  "Se sentir para baixo, deprimido(a) ou sem perspectiva",
  "Dificuldade para pegar no sono ou permanecer dormindo, ou dormir mais do que de costume",
  "Se sentir cansado(a) ou com pouca energia",
  "Falta de apetite ou comendo demais",
  "Se sentir mal consigo mesmo(a) — ou achar que você é um fracasso ou que decepcionou sua família ou você mesmo(a)",
  "Dificuldade para se concentrar nas coisas, como ler o jornal ou ver televisão",
  "Lentidão para se movimentar ou falar, a ponto das outras pessoas perceberem. Ou o contrário — Loss tão agitado(a) ou irrequieto(a) que você fica andando de um lado para o outro muito mais do que de costume",
  "Pensar em se ferir de alguma maneira ou que seria melhor estar morto(a)",
];

const SCORE_OPTIONS = [
  { value: 0, label: "Nenhum dia" },
  { value: 1, label: "Vários dias" },
  { value: 2, label: "Mais da metade dos dias" },
  { value: 3, label: "Quase todos os dias" },
];

function getClassification(total: number): { label: string; color: string } {
  if (total <= 4) return { label: "Mínimo", color: "bg-green-100 text-green-700 border-green-300" };
  if (total <= 9) return { label: "Leve", color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
  if (total <= 14) return { label: "Moderado", color: "bg-orange-100 text-orange-700 border-orange-300" };
  if (total <= 19) return { label: "Moderadamente grave", color: "bg-red-100 text-red-700 border-red-300" };
  return { label: "Grave", color: "bg-red-200 text-red-800 border-red-400" };
}

interface EscalaPHQ9Props {
  respostas: number[] | null;
  onChange: (respostas: number[], total: number) => void;
  readOnly?: boolean;
}

export function EscalaPHQ9({ respostas, onChange, readOnly = false }: EscalaPHQ9Props) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(
    respostas || Array(9).fill(null)
  );

  useEffect(() => {
    if (respostas) setAnswers(respostas);
  }, [respostas]);

  const total = answers.reduce((sum, v) => sum + (v ?? 0), 0);
  const allAnswered = answers.every(v => v !== null);
  const classification = getClassification(total);

  const handleAnswer = (index: number, value: number) => {
    if (readOnly) return;
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
    const newTotal = newAnswers.reduce((sum, v) => sum + (v ?? 0), 0);
    onChange(newAnswers.map(v => v ?? 0), newTotal);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className="border-purple-200 dark:border-purple-800">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-purple-500" />
                Escala PHQ-9 (Depressão)
                <Badge variant="outline" className="text-[10px]">Opcional</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {allAnswered && (
                  <>
                    <Badge className={classification.color}>{total}/27 — {classification.label}</Badge>
                  </>
                )}
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <p className="text-xs text-muted-foreground">
              Nas últimas 2 semanas, com que frequência o(a) paciente foi incomodado(a) por qualquer um dos problemas abaixo?
            </p>
            {PHQ9_QUESTIONS.map((question, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded-lg bg-muted/30">
                <Label className="text-sm font-medium">
                  {idx + 1}. {question}
                </Label>
                <RadioGroup
                  value={answers[idx]?.toString()}
                  onValueChange={(v) => handleAnswer(idx, parseInt(v))}
                  className="flex flex-wrap gap-3"
                  disabled={readOnly}
                >
                  {SCORE_OPTIONS.map(opt => (
                    <div key={opt.value} className="flex items-center gap-1.5">
                      <RadioGroupItem value={opt.value.toString()} id={`phq9-${idx}-${opt.value}`} />
                      <Label htmlFor={`phq9-${idx}-${opt.value}`} className="text-xs cursor-pointer">
                        {opt.label} ({opt.value})
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            {allAnswered && (
              <div className={`p-3 rounded-lg border ${classification.color} text-center`}>
                <p className="font-semibold">Pontuação Total: {total}/27</p>
                <p className="text-sm">Classificação: {classification.label}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
