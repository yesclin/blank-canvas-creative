import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShieldAlert,
  AlertTriangle,
  Phone,
  Stethoscope,
  Building2,
  Hospital,
  CalendarClock,
  MessageCircle,
  Save,
  Loader2,
  FileWarning,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PlanoAcaoCriseData {
  risco_iminente: boolean;
  encaminhamento_emergencial: boolean;
  contato_responsavel: boolean;
  descricao_intervencao: string;
  tecnica_aplicada: string;
  encaminhamento_medico: boolean;
  encaminhamento_caps: boolean;
  encaminhamento_hospital: boolean;
  encaminhamento_outro: string;
  sessao_antecipada: boolean;
  contato_intermediario: boolean;
  observacoes_adicionais: string;
}

const EMPTY_PLANO: PlanoAcaoCriseData = {
  risco_iminente: false,
  encaminhamento_emergencial: false,
  contato_responsavel: false,
  descricao_intervencao: '',
  tecnica_aplicada: '',
  encaminhamento_medico: false,
  encaminhamento_caps: false,
  encaminhamento_hospital: false,
  encaminhamento_outro: '',
  sessao_antecipada: false,
  contato_intermediario: false,
  observacoes_adicionais: '',
};

interface PlanoAcaoCriseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  clinicId: string;
  sessaoId: string;
  profissionalId: string;
  regressionStatus: 'crise' | 'regressao';
  onSaved: () => void;
}

export function PlanoAcaoCriseModal({
  open,
  onOpenChange,
  patientId,
  clinicId,
  sessaoId,
  profissionalId,
  regressionStatus,
  onSaved,
}: PlanoAcaoCriseModalProps) {
  const [data, setData] = useState<PlanoAcaoCriseData>(EMPTY_PLANO);
  const [saving, setSaving] = useState(false);

  const canSave = data.descricao_intervencao.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) {
      toast.error('Preencha a descrição da intervenção realizada');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('planos_acao_crise' as any)
        .insert({
          patient_id: patientId,
          clinic_id: clinicId,
          sessao_id: sessaoId,
          profissional_id: profissionalId,
          regression_status: regressionStatus,
          risco_iminente: data.risco_iminente,
          encaminhamento_emergencial: data.encaminhamento_emergencial,
          contato_responsavel: data.contato_responsavel,
          descricao_intervencao: data.descricao_intervencao.trim(),
          tecnica_aplicada: data.tecnica_aplicada.trim() || null,
          encaminhamento_medico: data.encaminhamento_medico,
          encaminhamento_caps: data.encaminhamento_caps,
          encaminhamento_hospital: data.encaminhamento_hospital,
          encaminhamento_outro: data.encaminhamento_outro.trim() || null,
          sessao_antecipada: data.sessao_antecipada,
          contato_intermediario: data.contato_intermediario,
          observacoes_adicionais: data.observacoes_adicionais.trim() || null,
        } as any);

      if (error) throw error;

      toast.success('Plano de Ação registrado com sucesso');
      setData(EMPTY_PLANO);
      onSaved();
      onOpenChange(false);
    } catch (err) {
      console.error('Error saving plano de ação:', err);
      toast.error('Erro ao salvar plano de ação');
    } finally {
      setSaving(false);
    }
  };

  const updateBool = (field: keyof PlanoAcaoCriseData, value: boolean) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const updateText = (field: keyof PlanoAcaoCriseData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* prevent closing without saving */ }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onPointerDownOutside={e => e.preventDefault()} onEscapeKeyDown={e => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            Plano de Ação Obrigatório
          </DialogTitle>
          <DialogDescription>
            Status de <Badge variant="destructive" className="text-xs mx-1">{regressionStatus === 'crise' ? 'Crise' : 'Regressão'}</Badge> detectado.
            Preencha o plano de ação antes de finalizar o atendimento.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[60vh] pr-4">
          <div className="space-y-6 py-2">
            {/* SEÇÃO 1 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                1. Avaliação de Risco Imediato
              </h3>
              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2">
                  <Checkbox id="risco-iminente" checked={data.risco_iminente} onCheckedChange={v => updateBool('risco_iminente', !!v)} />
                  <Label htmlFor="risco-iminente" className="text-sm">Risco iminente identificado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="encaminhamento-emergencial" checked={data.encaminhamento_emergencial} onCheckedChange={v => updateBool('encaminhamento_emergencial', !!v)} />
                  <Label htmlFor="encaminhamento-emergencial" className="text-sm">Encaminhamento emergencial necessário</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="contato-responsavel" checked={data.contato_responsavel} onCheckedChange={v => updateBool('contato_responsavel', !!v)} />
                  <Label htmlFor="contato-responsavel" className="text-sm flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    Contato com responsável/familiar realizado
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* SEÇÃO 2 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-primary" />
                2. Intervenção Realizada
              </h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <Label className="text-sm">
                    Descrição da intervenção <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={data.descricao_intervencao}
                    onChange={e => updateText('descricao_intervencao', e.target.value)}
                    placeholder="Descreva a intervenção realizada..."
                    className="min-h-[80px]"
                  />
                  {!canSave && data.descricao_intervencao.length === 0 && (
                    <p className="text-xs text-destructive">Campo obrigatório</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Técnica aplicada</Label>
                  <Textarea
                    value={data.tecnica_aplicada}
                    onChange={e => updateText('tecnica_aplicada', e.target.value)}
                    placeholder="Técnica(s) utilizada(s)..."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SEÇÃO 3 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                3. Encaminhamentos
              </h3>
              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2">
                  <Checkbox id="enc-medico" checked={data.encaminhamento_medico} onCheckedChange={v => updateBool('encaminhamento_medico', !!v)} />
                  <Label htmlFor="enc-medico" className="text-sm flex items-center gap-1">
                    <Stethoscope className="h-3 w-3" />
                    Encaminhamento médico
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="enc-caps" checked={data.encaminhamento_caps} onCheckedChange={v => updateBool('encaminhamento_caps', !!v)} />
                  <Label htmlFor="enc-caps" className="text-sm flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    CAPS
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="enc-hospital" checked={data.encaminhamento_hospital} onCheckedChange={v => updateBool('encaminhamento_hospital', !!v)} />
                  <Label htmlFor="enc-hospital" className="text-sm flex items-center gap-1">
                    <Hospital className="h-3 w-3" />
                    Hospital
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Outro encaminhamento</Label>
                  <Textarea
                    value={data.encaminhamento_outro}
                    onChange={e => updateText('encaminhamento_outro', e.target.value)}
                    placeholder="Descreva outro encaminhamento..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SEÇÃO 4 */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                4. Plano para as Próximas 72h
              </h3>
              <div className="space-y-2 pl-1">
                <div className="flex items-center gap-2">
                  <Checkbox id="sessao-antecipada" checked={data.sessao_antecipada} onCheckedChange={v => updateBool('sessao_antecipada', !!v)} />
                  <Label htmlFor="sessao-antecipada" className="text-sm flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    Sessão antecipada agendada
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="contato-intermediario" checked={data.contato_intermediario} onCheckedChange={v => updateBool('contato_intermediario', !!v)} />
                  <Label htmlFor="contato-intermediario" className="text-sm flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    Contato intermediário planejado
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Observações adicionais</Label>
                  <Textarea
                    value={data.observacoes_adicionais}
                    onChange={e => updateText('observacoes_adicionais', e.target.value)}
                    placeholder="Observações sobre o plano de ação..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-2">
          <p className="text-xs text-muted-foreground flex-1 flex items-center gap-1">
            <FileWarning className="h-3 w-3" />
            Este plano não será incluído em relatórios automaticamente.
          </p>
          <Button onClick={handleSave} disabled={saving || !canSave}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />
            Registrar Plano de Ação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Viewer for history ───

interface PlanoAcaoCriseViewerProps {
  sessaoId: string;
  clinicId: string;
}

export function PlanoAcaoCriseBadge({ sessaoId, clinicId }: PlanoAcaoCriseViewerProps) {
  const [plano, setPlano] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadPlano = async () => {
    if (loaded) {
      if (plano) setDialogOpen(true);
      return;
    }
    const { data } = await supabase
      .from('planos_acao_crise' as any)
      .select('*')
      .eq('sessao_id', sessaoId)
      .eq('clinic_id', clinicId)
      .limit(1);
    
    const found = (data as any[])?.[0] || null;
    setPlano(found);
    setLoaded(true);
    if (found) setDialogOpen(true);
  };

  if (loaded && !plano) return null;

  return (
    <>
      <Badge
        variant="destructive"
        className="text-[10px] cursor-pointer gap-1"
        onClick={loadPlano}
      >
        <FileWarning className="h-3 w-3" />
        Plano de Ação
      </Badge>

      {plano && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-sm">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                Plano de Ação Registrado
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-xs text-muted-foreground mb-1">Intervenção realizada</p>
                <p>{plano.descricao_intervencao}</p>
              </div>
              {plano.tecnica_aplicada && (
                <div>
                  <p className="font-medium text-xs text-muted-foreground mb-1">Técnica aplicada</p>
                  <p>{plano.tecnica_aplicada}</p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {plano.risco_iminente && <Badge variant="destructive" className="text-xs">Risco iminente</Badge>}
                {plano.encaminhamento_emergencial && <Badge variant="destructive" className="text-xs">Enc. emergencial</Badge>}
                {plano.contato_responsavel && <Badge variant="outline" className="text-xs">Contato c/ responsável</Badge>}
                {plano.encaminhamento_medico && <Badge variant="outline" className="text-xs">Enc. médico</Badge>}
                {plano.encaminhamento_caps && <Badge variant="outline" className="text-xs">CAPS</Badge>}
                {plano.encaminhamento_hospital && <Badge variant="outline" className="text-xs">Hospital</Badge>}
                {plano.sessao_antecipada && <Badge variant="outline" className="text-xs">Sessão antecipada</Badge>}
                {plano.contato_intermediario && <Badge variant="outline" className="text-xs">Contato intermediário</Badge>}
              </div>
              {plano.encaminhamento_outro && (
                <div>
                  <p className="font-medium text-xs text-muted-foreground mb-1">Outro encaminhamento</p>
                  <p>{plano.encaminhamento_outro}</p>
                </div>
              )}
              {plano.observacoes_adicionais && (
                <div>
                  <p className="font-medium text-xs text-muted-foreground mb-1">Observações</p>
                  <p>{plano.observacoes_adicionais}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Registrado em {new Date(plano.created_at).toLocaleString('pt-BR')}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
