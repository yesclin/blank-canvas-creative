import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Baby, RefreshCw, Scale, Ruler, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { differenceInMonths, parseISO } from 'date-fns';

import {
  CrescimentoDesenvolvimentoBlock,
  DEFAULT_MILESTONES,
  type GrowthMeasurement,
  type DevelopmentMilestone,
} from './CrescimentoDesenvolvimentoBlock';
import { PediatricGrowthChart } from './PediatricGrowthChart';
import {
  WEIGHT_BOYS, WEIGHT_GIRLS,
  HEIGHT_BOYS, HEIGHT_GIRLS,
  HC_BOYS, HC_GIRLS,
  estimatePercentile, getGrowthClassification,
} from './whoGrowthData';

interface CrescimentoDesenvolvimentoWrapperProps {
  patientId: string;
  clinicId: string | null;
  professionalId: string | null;
  appointmentId?: string;
  birthDate?: string | null;
  gender?: 'M' | 'F';
  canEdit?: boolean;
}

export function CrescimentoDesenvolvimentoWrapper({
  patientId,
  clinicId,
  professionalId,
  appointmentId,
  birthDate,
  gender,
  canEdit = true,
}: CrescimentoDesenvolvimentoWrapperProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [measurements, setMeasurements] = useState<GrowthMeasurement[]>([]);
  const [milestones, setMilestones] = useState<DevelopmentMilestone[]>([]);

  const patientGender = gender || 'M';

  const currentAgeMonths = useMemo(() => {
    if (!birthDate) return 0;
    return differenceInMonths(new Date(), parseISO(birthDate));
  }, [birthDate]);

  // Clinical interpretation of latest measurement
  const clinicalInterpretation = useMemo(() => {
    if (!measurements.length) return null;
    const sorted = [...measurements].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latest = sorted[0];
    const result: { label: string; value: string; classification: ReturnType<typeof getGrowthClassification> | null }[] = [];

    if (latest.weight_kg) {
      const wData = patientGender === 'M' ? WEIGHT_BOYS : WEIGHT_GIRLS;
      const p = estimatePercentile(latest.weight_kg, latest.age_months, wData);
      result.push({
        label: 'Peso/Idade',
        value: p !== undefined ? `P${Math.round(p)}` : '—',
        classification: p !== undefined ? getGrowthClassification(p) : null,
      });
    }
    if (latest.height_cm) {
      const hData = patientGender === 'M' ? HEIGHT_BOYS : HEIGHT_GIRLS;
      const p = estimatePercentile(latest.height_cm, latest.age_months, hData);
      result.push({
        label: 'Altura/Idade',
        value: p !== undefined ? `P${Math.round(p)}` : '—',
        classification: p !== undefined ? getGrowthClassification(p) : null,
      });
    }
    if (latest.head_circumference_cm) {
      const hcData = patientGender === 'M' ? HC_BOYS : HC_GIRLS;
      const p = estimatePercentile(latest.head_circumference_cm, latest.age_months, hcData);
      result.push({
        label: 'PC/Idade',
        value: p !== undefined ? `P${Math.round(p)}` : '—',
        classification: p !== undefined ? getGrowthClassification(p) : null,
      });
    }
    return result;
  }, [measurements, patientGender]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!patientId || !clinicId) return;
    setLoading(true);
    setError(null);

    try {
      const { data: measurementsData, error: mError } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('measurement_type', 'pediatric_growth')
        .order('created_at', { ascending: false });

      if (mError) throw mError;

      const parsedMeasurements: GrowthMeasurement[] = (measurementsData || []).map((row: any) => {
        const d = row.data || {};
        return {
          id: row.id,
          date: d.date || row.created_at,
          age_months: d.age_months || 0,
          weight_kg: d.weight_kg,
          height_cm: d.height_cm,
          head_circumference_cm: d.head_circumference_cm,
          bmi: d.bmi,
          weight_percentile: d.weight_percentile,
          height_percentile: d.height_percentile,
          hc_percentile: d.hc_percentile,
          bmi_percentile: d.bmi_percentile,
          notes: d.notes,
          recorded_by: row.professional_id,
        };
      });

      setMeasurements(parsedMeasurements);

      // Fetch milestones
      const { data: milestonesData, error: milError } = await supabase
        .from('body_measurements')
        .select('*')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('measurement_type', 'pediatric_milestones')
        .order('created_at', { ascending: false })
        .limit(1);

      if (milError) throw milError;

      if (milestonesData && milestonesData.length > 0) {
        const savedMilestones = (milestonesData[0] as any).data?.milestones;
        if (Array.isArray(savedMilestones)) {
          setMilestones(savedMilestones);
        } else {
          setMilestones(buildDefaultMilestones());
        }
      } else {
        setMilestones(buildDefaultMilestones());
      }
    } catch (err: any) {
      console.error('Erro ao carregar crescimento e desenvolvimento:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [patientId, clinicId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function buildDefaultMilestones(): DevelopmentMilestone[] {
    return DEFAULT_MILESTONES.map((m, idx) => ({
      id: `default-${idx}`,
      category: m.category,
      name: m.name,
      expected_age_months: m.expected_age_months,
      status: 'pending' as const,
    }));
  }

  const handleAddMeasurement = async (data: Omit<GrowthMeasurement, 'id'>) => {
    if (!clinicId) return;

    try {
      const { error: insertError } = await supabase
        .from('body_measurements')
        .insert({
          id: crypto.randomUUID(),
          patient_id: patientId,
          clinic_id: clinicId,
          professional_id: professionalId,
          measurement_type: 'pediatric_growth',
          data: {
            date: data.date,
            age_months: data.age_months,
            weight_kg: data.weight_kg,
            height_cm: data.height_cm,
            head_circumference_cm: data.head_circumference_cm,
            bmi: data.bmi,
            weight_percentile: data.weight_percentile,
            height_percentile: data.height_percentile,
            hc_percentile: data.hc_percentile,
            bmi_percentile: data.bmi_percentile,
            notes: data.notes,
          },
        });

      if (insertError) throw insertError;

      toast({
        title: 'Medida registrada',
        description: 'Os dados de crescimento foram salvos com sucesso.',
      });

      await fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar medida:', err);
      toast({
        title: 'Erro ao salvar',
        description: err.message || 'Não foi possível salvar a medida.',
        variant: 'destructive',
      });
      throw err;
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, data: Partial<DevelopmentMilestone>) => {
    if (!clinicId) return;

    try {
      const updatedMilestones = milestones.map(m =>
        m.id === milestoneId ? { ...m, ...data } : m
      );
      setMilestones(updatedMilestones);

      const { data: existing } = await supabase
        .from('body_measurements')
        .select('id')
        .eq('patient_id', patientId)
        .eq('clinic_id', clinicId)
        .eq('measurement_type', 'pediatric_milestones')
        .limit(1);

      if (existing && existing.length > 0) {
        const { error: updateError } = await supabase
          .from('body_measurements')
          .update({
            data: { milestones: updatedMilestones },
            professional_id: professionalId,
          })
          .eq('id', (existing[0] as any).id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('body_measurements')
          .insert({
            id: crypto.randomUUID(),
            patient_id: patientId,
            clinic_id: clinicId,
            professional_id: professionalId,
            measurement_type: 'pediatric_milestones',
            data: { milestones: updatedMilestones },
          });

        if (insertError) throw insertError;
      }

      toast({
        title: 'Marco atualizado',
        description: 'O marco de desenvolvimento foi atualizado.',
      });
    } catch (err: any) {
      console.error('Erro ao atualizar marco:', err);
      toast({
        title: 'Erro ao atualizar',
        description: err.message || 'Não foi possível atualizar o marco.',
        variant: 'destructive',
      });
      await fetchData();
    }
  };

  // No birth date
  if (!birthDate) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-orange-500" />
          <p className="text-sm font-medium">Data de nascimento não informada</p>
          <p className="text-xs text-muted-foreground">
            Para registrar o crescimento e desenvolvimento, é necessário cadastrar a data de nascimento do paciente.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Loading
  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Error
  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-3">
          <AlertTriangle className="h-10 w-10 mx-auto text-destructive" />
          <p className="text-sm font-medium text-destructive">Erro ao carregar dados</p>
          <p className="text-xs text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Clinical Interpretation Summary */}
      {clinicalInterpretation && clinicalInterpretation.length > 0 && (
        <Card>
          <CardContent className="py-4">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Leitura Clínica Atual
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {clinicalInterpretation.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{item.value}</span>
                    {item.classification && (
                      <Badge variant="outline" className={`text-xs ${item.classification.severity === 'normal' ? 'text-green-600 border-green-300' : item.classification.severity === 'attention' ? 'text-amber-600 border-amber-300' : 'text-red-600 border-red-300'}`}>
                        {item.classification.severity === 'normal' && <CheckCircle2 className="h-3 w-3 mr-0.5" />}
                        {item.classification.severity === 'attention' && <AlertCircle className="h-3 w-3 mr-0.5" />}
                        {item.classification.severity === 'alert' && <AlertTriangle className="h-3 w-3 mr-0.5" />}
                        {item.classification.label}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Charts */}
      <PediatricGrowthChart
        measurements={measurements}
        gender={patientGender}
        currentAgeMonths={currentAgeMonths}
      />

      {/* Growth Block (form, history, milestones) */}
      <CrescimentoDesenvolvimentoBlock
        patientId={patientId}
        birthDate={birthDate}
        measurements={measurements}
        milestones={milestones}
        onAddMeasurement={canEdit ? handleAddMeasurement : undefined}
        onUpdateMilestone={canEdit ? handleUpdateMilestone : undefined}
        isEditable={canEdit}
      />
    </div>
  );
}
