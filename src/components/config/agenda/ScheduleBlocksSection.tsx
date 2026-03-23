import { useState, useEffect } from "react";
import { Calendar, Plus, Trash2, User, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ScheduleBlock {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string | null;
  professional_id: string | null;
  professional_name?: string;
}

interface Professional {
  id: string;
  full_name: string;
}

export function ScheduleBlocksSection() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteBlockId, setDeleteBlockId] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formStartTime, setFormStartTime] = useState("");
  const [formEndTime, setFormEndTime] = useState("");
  const [formAllDay, setFormAllDay] = useState(true);
  const [formReason, setFormReason] = useState("");
  const [formProfessionalId, setFormProfessionalId] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("clinic_id")
        .eq("user_id", user.id)
        .single();

      if (!profile?.clinic_id) return;
      setClinicId(profile.clinic_id);

      // Fetch blocks with professional info
      const { data: blocksData, error: blocksError } = await supabase
        .from("schedule_blocks")
        .select(`
          id,
          title,
          start_date,
          end_date,
          start_time,
          end_time,
          all_day,
          reason,
          professional_id,
          professionals:professional_id (full_name)
        `)
        .eq("clinic_id", profile.clinic_id)
        .order("start_date", { ascending: false });

      if (blocksError) {
        console.error("Error fetching blocks:", blocksError);
      } else {
        const formattedBlocks: ScheduleBlock[] = (blocksData || []).map(b => ({
          id: b.id,
          title: b.title,
          start_date: b.start_date,
          end_date: b.end_date,
          start_time: b.start_time,
          end_time: b.end_time,
          all_day: b.all_day,
          reason: b.reason,
          professional_id: b.professional_id,
          professional_name: (b.professionals as any)?.full_name,
        }));
        setBlocks(formattedBlocks);
      }

      // Fetch professionals
      const { data: profData } = await supabase
        .from("professionals")
        .select("id, full_name")
        .eq("clinic_id", profile.clinic_id)
        .eq("is_active", true)
        .order("full_name");

      setProfessionals(profData || []);

    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormTitle("");
    setFormStartDate("");
    setFormEndDate("");
    setFormStartTime("");
    setFormEndTime("");
    setFormAllDay(true);
    setFormReason("");
    setFormProfessionalId("all");
  };

  const handleCreateBlock = async () => {
    if (!clinicId || !formTitle || !formStartDate || !formEndDate) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    try {
      const blockData = {
        clinic_id: clinicId,
        title: formTitle,
        start_date: formStartDate,
        end_date: formEndDate,
        start_time: formAllDay ? null : formStartTime || null,
        end_time: formAllDay ? null : formEndTime || null,
        all_day: formAllDay,
        reason: formReason || null,
        professional_id: formProfessionalId === "all" ? null : formProfessionalId,
      };

      const { error } = await supabase
        .from("schedule_blocks")
        .insert(blockData);

      if (error) throw error;

      toast.success("Bloqueio criado com sucesso");
      setIsDialogOpen(false);
      resetForm();
      await fetchData();
    } catch (err) {
      console.error("Error creating block:", err);
      toast.error("Erro ao criar bloqueio");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBlock = async () => {
    if (!deleteBlockId) return;

    try {
      const { error } = await supabase
        .from("schedule_blocks")
        .delete()
        .eq("id", deleteBlockId);

      if (error) throw error;

      toast.success("Bloqueio removido");
      setDeleteBlockId(null);
      await fetchData();
    } catch (err) {
      console.error("Error deleting block:", err);
      toast.error("Erro ao remover bloqueio");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Exceções de Agenda
            </CardTitle>
            <CardDescription>
              Feriados, férias e outros períodos sem atendimento
            </CardDescription>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Exceção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Exceção de Agenda</DialogTitle>
                <DialogDescription>
                  Crie um período de bloqueio para a clínica ou profissional específico
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="block_title">Título *</Label>
                  <Input 
                    id="block_title" 
                    placeholder="Ex: Feriado - Ano Novo, Férias Dr. Carlos"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Aplicar a</Label>
                  <Select value={formProfessionalId} onValueChange={setFormProfessionalId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Toda a clínica
                        </div>
                      </SelectItem>
                      {professionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {prof.full_name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date">Data Início *</Label>
                    <Input 
                      id="start_date" 
                      type="date"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date">Data Fim *</Label>
                    <Input 
                      id="end_date" 
                      type="date"
                      value={formEndDate}
                      onChange={(e) => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Dia inteiro</Label>
                    <p className="text-sm text-muted-foreground">
                      Bloquear o dia completo
                    </p>
                  </div>
                  <Switch 
                    checked={formAllDay} 
                    onCheckedChange={setFormAllDay} 
                  />
                </div>

                {!formAllDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="block_start_time">Hora Início</Label>
                      <Input 
                        id="block_start_time" 
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="block_end_time">Hora Fim</Label>
                      <Input 
                        id="block_end_time" 
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="reason">Motivo</Label>
                  <Textarea 
                    id="reason" 
                    placeholder="Descrição opcional do bloqueio..."
                    value={formReason}
                    onChange={(e) => setFormReason(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateBlock} disabled={isSaving}>
                  {isSaving ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {blocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhuma exceção cadastrada</p>
              <p className="text-sm">Adicione feriados, férias ou outros bloqueios</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Aplica a</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blocks.map((block) => (
                  <TableRow key={block.id}>
                    <TableCell className="font-medium">{block.title}</TableCell>
                    <TableCell>
                      {formatDate(block.start_date)}
                      {block.start_date !== block.end_date && (
                        <> até {formatDate(block.end_date)}</>
                      )}
                    </TableCell>
                    <TableCell>
                      {block.professional_id ? (
                        <Badge variant="outline" className="gap-1">
                          <User className="h-3 w-3" />
                          {block.professional_name}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          Toda a clínica
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {block.all_day ? "Dia inteiro" : "Parcial"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {block.reason || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteBlockId(block.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteBlockId} onOpenChange={() => setDeleteBlockId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover exceção?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O período bloqueado voltará a ficar disponível para agendamentos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
