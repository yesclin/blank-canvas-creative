import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, ClipboardList } from "lucide-react";

const GAD7_QUESTIONS = [
  "Sentir-se nervoso(a), ansioso(a) ou muito tenso(a)",
  "Não ser capaz de impedir ou de controlar as preocupações",
  "Preocupar-se muito com diversas coisas",
  "Dificuldade para relaxar",
  "Ficar tão agitado(a) que se torna difícil permanecer sentado(a)",
  "Ficar facilmente aborrecido(a) ou irritado(a)",
  "Sentir medo como se algo terrível fosse acontecer",
];

const SCORE_OPTIONS = [
  { value: 0, label: "Nenhum dia" },
  { value: 1, label: "Vários dias" },
  { value: 2, label: "Mais da metade dos dias" },
  { value: 3, label: "Quase todos os dias" },
];

function getClassification(total: number): { label: string; color: string } {
  if (total <= 4) return { label: "Mínima", color: "bg-green-100 text-green-700 border-green-300" };
  if (total <= 9) return { label: "Leve", color: "bg-yellow-100 text-yellow-700 border-yellow-300" };
  if (total <= 14) return { label: "Moderada", color: "bg-orange-100 text-orange-700 border-orange-300" };
  return { label: "Grave", color: "bg-red-200 text-red-800 border-red-400" };
}

interface EscalaGAD7Props {
  respostas: number[] | null;
  onChange: (respostas: number[], total: number) => void;
  readOnly?: boolean;
}

export function EscalaGAD7({ respostas, onChange, readOnly = false }: EscalaGAD7Props) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>(
    respostas || Array(7).fill(null)
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
      <Card className="border-blue-200 dark:border-blue-800">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-blue-500" />
                Escala GAD-7 (Ansiedade)
                <Badge variant="outline" className="text-[10px]">Opcional</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                {allAnswered && (
                  <Badge className={classification.color}>{total}/21 — {classification.label}</Badge>
                )}
                {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <p className="text-xs text-muted-foreground">
              Nas últimas 2 semanas, com que frequência o(a) paciente foi incomodado(a) pelos problemas abaixo?
            </p>
            {GAD7_QUESTIONS.map((question, idx) => (
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
                      <RadioGroupItem value={opt.value.toString()} id={`gad7-${idx}-${opt.value}`} />
                      <Label htmlFor={`gad7-${idx}-${opt.value}`} className="text-xs cursor-pointer">
                        {opt.label} ({opt.value})
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            {allAnswered && (
              <div className={`p-3 rounded-lg border ${classification.color} text-center`}>
                <p className="font-semibold">Pontuação Total: {total}/21</p>
                <p className="text-sm">Classificação: {classification.label}</p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
