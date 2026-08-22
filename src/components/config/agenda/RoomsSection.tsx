import { useMemo, useState } from "react";
import { DoorOpen, Plus, Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { usePermissions } from "@/hooks/usePermissions";
import { useActiveClinicScope } from "@/hooks/useActiveClinicScope";
import { useProfessionals } from "@/hooks/useAgendaRealData";
import {
  useClinicRooms,
  useRoomAuthorizations,
  buildRoomAuthorizationMap,
  useManageClinicRooms,
} from "@/hooks/useClinicRooms";
import type { Room } from "@/types/agenda";

export function RoomsSection() {
  const { isOwner, isAdmin } = usePermissions();
  const canManage = isOwner || isAdmin;
  const { clinicId } = useActiveClinicScope();

  const { data: rooms = [], isLoading, isError, refetch } = useClinicRooms(true);
  const { data: authRows = [] } = useRoomAuthorizations();
  const { data: professionals = [] } = useProfessionals(clinicId);
  const { createRoom, updateRoom, deleteRoom, setRoomProfessionals } = useManageClinicRooms();

  const authMap = useMemo(() => buildRoomAuthorizationMap(authRows), [authRows]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([]);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setIsActive(true);
    setSelectedProfessionals([]);
    setDialogOpen(true);
  };

  const openEdit = (room: Room) => {
    setEditing(room);
    setName(room.name);
    setDescription(room.description || "");
    setIsActive(room.is_active);
    setSelectedProfessionals(authMap.get(room.id) || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Informe o nome da sala");
      return;
    }
    try {
      let roomId = editing?.id;
      if (editing) {
        await updateRoom.mutateAsync({ id: editing.id, name, description, is_active: isActive });
      } else {
        const created = await createRoom.mutateAsync({ name, description, is_active: isActive });
        roomId = created?.id;
      }
      if (roomId) {
        await setRoomProfessionals.mutateAsync({ roomId, professionalIds: selectedProfessionals });
      }
      setDialogOpen(false);
    } catch {
      /* toasts já tratados nos hooks */
    }
  };

  const toggleProfessional = (id: string) => {
    setSelectedProfessionals((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const professionalName = (id: string) =>
    professionals.find((p) => p.id === id)?.full_name || "Profissional";

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-primary" />
            Salas da Clínica
          </CardTitle>
          <CardDescription>
            Cadastre as salas utilizadas nos atendimentos e defina quais profissionais podem usá-las.
            Salas inativas não aparecem para novos agendamentos.
          </CardDescription>
        </div>
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Sala
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <div className="text-center py-8 space-y-3">
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar as salas.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-10">
            <DoorOpen className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium text-foreground">Nenhuma sala cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {canManage
                ? "Cadastre a primeira sala para poder vinculá-la aos agendamentos."
                : "Solicite ao administrador o cadastro das salas."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sala</TableHead>
                  <TableHead>Profissionais autorizados</TableHead>
                  <TableHead>Status</TableHead>
                  {canManage && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => {
                  const authorized = authMap.get(room.id) || [];
                  return (
                    <TableRow key={room.id}>
                      <TableCell>
                        <div className="font-medium">{room.name}</div>
                        {room.description && (
                          <div className="text-xs text-muted-foreground">{room.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {authorized.length === 0 ? (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Users className="h-3 w-3" /> Todos os profissionais
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {authorized.map((id) => (
                              <Badge key={id} variant="secondary" className="text-xs">
                                {professionalName(id)}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {canManage ? (
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={room.is_active}
                              onCheckedChange={(checked) =>
                                updateRoom.mutate({ id: room.id, is_active: checked })
                              }
                            />
                            <span className="text-xs text-muted-foreground">
                              {room.is_active ? "Ativa" : "Inativa"}
                            </span>
                          </div>
                        ) : (
                          <Badge variant={room.is_active ? "default" : "outline"}>
                            {room.is_active ? "Ativa" : "Inativa"}
                          </Badge>
                        )}
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(room)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRoomToDelete(room)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90dvh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Sala" : "Nova Sala"}</DialogTitle>
            <DialogDescription>
              Defina o nome, a descrição e os profissionais autorizados a utilizar a sala.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div className="space-y-2">
              <Label htmlFor="room-name">Nome da sala *</Label>
              <Input
                id="room-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Sala 1 — Procedimentos"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-description">Descrição / observação</Label>
              <Textarea
                id="room-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Equipamentos, andar, restrições de uso..."
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <Label>Sala ativa</Label>
                <p className="text-xs text-muted-foreground">
                  Salas inativas não aparecem em novos agendamentos.
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="space-y-2">
              <Label>Profissionais autorizados</Label>
              <p className="text-xs text-muted-foreground">
                Se nenhum for selecionado, todos os profissionais da clínica podem usar a sala.
              </p>
              <div className="space-y-2 rounded-md border p-3 max-h-52 overflow-y-auto">
                {professionals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum profissional cadastrado.
                  </p>
                ) : (
                  professionals.map((professional) => (
                    <label
                      key={professional.id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedProfessionals.includes(professional.id)}
                        onCheckedChange={() => toggleProfessional(professional.id)}
                      />
                      {professional.full_name}
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={createRoom.isPending || updateRoom.isPending || setRoomProfessionals.isPending}
            >
              {editing ? "Salvar alterações" : "Cadastrar sala"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir sala</AlertDialogTitle>
            <AlertDialogDescription>
              A sala <strong>{roomToDelete?.name}</strong> será excluída definitivamente.
              Se existirem agendamentos vinculados, a exclusão será bloqueada para preservar
              o histórico — nesse caso, inative a sala.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roomToDelete) deleteRoom.mutate(roomToDelete.id);
                setRoomToDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
