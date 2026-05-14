import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Loader2, Search, UserPlus, Users, ShieldCheck, ShieldOff, ShieldAlert,
  MoreHorizontal, History, Mail, Pencil, Power, Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { Navigate } from 'react-router-dom';

type Role = 'super_admin' | 'support' | 'operations' | 'saas_finance';
type Status = 'active' | 'inactive' | 'invited';

interface PlatformUser {
  id: string;
  user_id: string | null;
  email: string;
  full_name: string | null;
  role: Role;
  status: Status;
  notes: string | null;
  invited_by: string | null;
  invited_at: string | null;
  accepted_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'Super Admin',
  support: 'Suporte',
  operations: 'Operação',
  saas_finance: 'Financeiro SaaS',
};

const STATUS_LABEL: Record<Status, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  invited: 'Convite pendente',
};

function RoleBadge({ role }: { role: Role }) {
  const cls: Record<Role, string> = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-200',
    support: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-200',
    operations: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200',
    saas_finance: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200',
  };
  return <Badge variant="outline" className={cls[role]}>{ROLE_LABEL[role]}</Badge>;
}

function StatusBadge({ status }: { status: Status }) {
  const cls: Record<Status, string> = {
    active: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-200',
    inactive: 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300',
    invited: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-200',
  };
  return <Badge variant="outline" className={cls[status]}>{STATUS_LABEL[status]}</Badge>;
}

function formatDate(d: string | null) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return '—'; }
}

export default function SuperAdminUsers() {
  const { isPlatformAdmin, loading: authLoading, userId } = usePlatformAdmin();
  const [rows, setRows] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('support');
  const [inviteNotes, setInviteNotes] = useState('');
  const [inviting, setInviting] = useState(false);
  const [emailLinkedToClinic, setEmailLinkedToClinic] = useState(false);

  // Edit dialog
  const [editTarget, setEditTarget] = useState<PlatformUser | null>(null);
  const [editRole, setEditRole] = useState<Role>('support');
  const [editStatus, setEditStatus] = useState<Status>('active');
  const [editReason, setEditReason] = useState('');
  const [editing, setEditing] = useState(false);

  // Audit dialog
  const [auditTarget, setAuditTarget] = useState<PlatformUser | null>(null);
  const [auditRows, setAuditRows] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Toggle status confirm
  const [toggleTarget, setToggleTarget] = useState<PlatformUser | null>(null);
  const [toggleReason, setToggleReason] = useState('');
  const [toggling, setToggling] = useState(false);

  // Remove confirm
  const [removeTarget, setRemoveTarget] = useState<PlatformUser | null>(null);
  const [removeReason, setRemoveReason] = useState('');
  const [removing, setRemoving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Não foi possível carregar os usuários globais.');
    } else {
      setRows((data ?? []) as PlatformUser[]);
    }
    setLoading(false);
  };

  useEffect(() => { if (isPlatformAdmin) load(); }, [isPlatformAdmin]);

  // Detect if invite email already exists as clinic user
  useEffect(() => {
    const e = inviteEmail.trim().toLowerCase();
    if (!e || !/^.+@.+\..+$/.test(e)) { setEmailLinkedToClinic(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', e)
        .limit(1);
      if (!cancelled) setEmailLinkedToClinic(!!(data && data.length > 0));
    })();
    return () => { cancelled = true; };
  }, [inviteEmail]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== 'all' && r.role !== roleFilter) return false;
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        (r.full_name ?? '').toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
      );
    });
  }, [rows, search, roleFilter, statusFilter]);

  const stats = useMemo(() => ({
    total: rows.length,
    superAdmins: rows.filter((r) => r.role === 'super_admin' && r.status === 'active').length,
    support: rows.filter((r) => r.role === 'support' && r.status === 'active').length,
    inactive: rows.filter((r) => r.status === 'inactive').length,
  }), [rows]);

  const activeSuperAdmins = useMemo(
    () => rows.filter((r) => r.role === 'super_admin' && r.status === 'active'),
    [rows],
  );

  const isLastActiveSuperAdmin = (u: PlatformUser) =>
    u.role === 'super_admin' && u.status === 'active' && activeSuperAdmins.length <= 1;

  const openInvite = () => {
    setInviteEmail(''); setInviteName(''); setInviteRole('support'); setInviteNotes('');
    setEmailLinkedToClinic(false);
    setInviteOpen(true);
  };

  const submitInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !/^.+@.+\..+$/.test(email)) {
      toast.error('Informe um e-mail válido.'); return;
    }
    if (!inviteName.trim()) { toast.error('Informe o nome completo.'); return; }
    if (!inviteRole) { toast.error('Selecione o papel global.'); return; }

    setInviting(true);
    try {
      // duplicidade
      const { data: existing } = await supabase
        .from('platform_users')
        .select('id')
        .ilike('email', email)
        .limit(1);
      if (existing && existing.length > 0) {
        toast.error('Este e-mail já está cadastrado como usuário global.');
        setInviting(false);
        return;
      }

      // tenta vincular ao auth user existente (sem alterar nada)
      let linkedUserId: string | null = null;
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .limit(1)
        .maybeSingle();
      if (profile?.id) linkedUserId = profile.id;

      const { data: inserted, error } = await supabase
        .from('platform_users')
        .insert({
          email,
          full_name: inviteName.trim(),
          role: inviteRole,
          status: 'invited',
          notes: inviteNotes.trim() || null,
          invited_by: userId,
          user_id: linkedUserId,
        })
        .select('*')
        .single();

      if (error) throw error;

      await logPlatformAction({
        action: 'platform_user_invited',
        target_type: 'platform_user',
        target_id: inserted.id,
        metadata: { email, role: inviteRole, linked_clinic_user: !!linkedUserId },
      });

      toast.success('Usuário cadastrado como convite pendente.');
      setInviteOpen(false);
      load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? 'Não foi possível concluir a ação.');
    } finally {
      setInviting(false);
    }
  };

  const openEdit = (u: PlatformUser) => {
    setEditTarget(u);
    setEditRole(u.role);
    setEditStatus(u.status);
    setEditReason('');
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    if (!editReason.trim()) { toast.error('Informe o motivo da alteração.'); return; }

    // safety client-side
    const wasActiveSuper = editTarget.role === 'super_admin' && editTarget.status === 'active';
    const willBeActiveSuper = editRole === 'super_admin' && editStatus === 'active';
    if (wasActiveSuper && !willBeActiveSuper && activeSuperAdmins.length <= 1) {
      toast.error('Não é possível remover o único Super Admin ativo.');
      return;
    }

    setEditing(true);
    try {
      const changedRole = editRole !== editTarget.role;
      const changedStatus = editStatus !== editTarget.status;
      const { error } = await supabase
        .from('platform_users')
        .update({ role: editRole, status: editStatus })
        .eq('id', editTarget.id);
      if (error) throw error;

      if (changedRole) {
        await logPlatformAction({
          action: 'platform_user_role_updated',
          target_type: 'platform_user',
          target_id: editTarget.id,
          metadata: { from: editTarget.role, to: editRole, reason: editReason.trim() },
        });
      }
      if (changedStatus) {
        await logPlatformAction({
          action: 'platform_user_status_updated',
          target_type: 'platform_user',
          target_id: editTarget.id,
          metadata: { from: editTarget.status, to: editStatus, reason: editReason.trim() },
        });
      }

      toast.success('Papel atualizado com sucesso.');
      setEditTarget(null);
      load();
    } catch (e: any) {
      console.error(e);
      const msg = String(e?.message ?? '');
      if (msg.includes('last_super_admin')) {
        toast.error('Não é possível remover o único Super Admin ativo.');
      } else {
        toast.error('Não foi possível concluir a ação.');
      }
    } finally {
      setEditing(false);
    }
  };

  const openAudit = async (u: PlatformUser) => {
    setAuditTarget(u);
    setAuditLoading(true);
    setAuditRows([]);
    const { data } = await supabase
      .from('platform_audit_logs')
      .select('id, action, actor_email, metadata, created_at')
      .eq('target_type', 'platform_user')
      .eq('target_id', u.id)
      .order('created_at', { ascending: false })
      .limit(200);
    setAuditRows(data ?? []);
    setAuditLoading(false);
  };

  const openToggle = (u: PlatformUser) => {
    setToggleTarget(u);
    setToggleReason('');
  };

  const submitToggle = async () => {
    if (!toggleTarget) return;
    const wantActivate = toggleTarget.status !== 'active';
    if (!wantActivate && !toggleReason.trim()) {
      toast.error('Informe o motivo da alteração.'); return;
    }
    if (!wantActivate && isLastActiveSuperAdmin(toggleTarget)) {
      toast.error('Não é possível remover o único Super Admin ativo.'); return;
    }
    setToggling(true);
    try {
      const newStatus: Status = wantActivate ? 'active' : 'inactive';
      const { error } = await supabase
        .from('platform_users')
        .update({ status: newStatus })
        .eq('id', toggleTarget.id);
      if (error) throw error;

      await logPlatformAction({
        action: wantActivate ? 'platform_user_activated' : 'platform_user_deactivated',
        target_type: 'platform_user',
        target_id: toggleTarget.id,
        metadata: { reason: toggleReason.trim() || null },
      });

      toast.success(wantActivate ? 'Acesso ativado com sucesso.' : 'Acesso desativado com sucesso.');
      setToggleTarget(null);
      load();
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (msg.includes('last_super_admin')) {
        toast.error('Não é possível remover o único Super Admin ativo.');
      } else {
        toast.error('Não foi possível concluir a ação.');
      }
    } finally {
      setToggling(false);
    }
  };

  const submitRemove = async () => {
    if (!removeTarget) return;
    if (!removeReason.trim()) { toast.error('Informe o motivo da alteração.'); return; }
    if (isLastActiveSuperAdmin(removeTarget)) {
      toast.error('Não é possível remover o único Super Admin ativo.'); return;
    }
    setRemoving(true);
    try {
      const { error } = await supabase
        .from('platform_users')
        .delete()
        .eq('id', removeTarget.id);
      if (error) throw error;

      await logPlatformAction({
        action: 'platform_user_removed',
        target_type: 'platform_user',
        target_id: removeTarget.id,
        metadata: { email: removeTarget.email, role: removeTarget.role, reason: removeReason.trim() },
      });

      toast.success('Acesso global removido com sucesso.');
      setRemoveTarget(null);
      load();
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      if (msg.includes('last_super_admin')) {
        toast.error('Não é possível remover o único Super Admin ativo.');
      } else {
        toast.error('Não foi possível concluir a ação.');
      }
    } finally {
      setRemoving(false);
    }
  };

  const resendInvite = async (u: PlatformUser) => {
    try {
      await supabase
        .from('platform_users')
        .update({ invited_at: new Date().toISOString() })
        .eq('id', u.id);
      await logPlatformAction({
        action: 'platform_user_invite_resent',
        target_type: 'platform_user',
        target_id: u.id,
        metadata: { email: u.email },
      });
      toast.success('Convite reenviado com sucesso.');
      load();
    } catch {
      toast.error('Não foi possível concluir a ação.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  // Bloqueio adicional: apenas super_admin (já garantido por RLS no backend)
  if (!isPlatformAdmin) return <Navigate to="/super-admin" replace />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuários da plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Gestão de papéis globais (Super Admin, Suporte) e auditoria de acesso.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={Users} label="Total de usuários globais" value={stats.total} />
        <SummaryCard icon={ShieldAlert} label="Super Admins ativos" value={stats.superAdmins} accent="text-purple-600" />
        <SummaryCard icon={ShieldCheck} label="Usuários de suporte ativos" value={stats.support} accent="text-blue-600" />
        <SummaryCard icon={ShieldOff} label="Usuários inativos" value={stats.inactive} accent="text-muted-foreground" />
      </div>

      {/* Barra de ações */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou e-mail"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Papel" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os papéis</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                  <SelectItem value="operations">Operação</SelectItem>
                  <SelectItem value="saas_finance">Financeiro SaaS</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="invited">Convite pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={openInvite}>
              <UserPlus className="mr-2 h-4 w-4" /> Convidar usuário
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usuários globais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="font-medium">Nenhum usuário global cadastrado.</p>
              <p className="text-sm text-muted-foreground">
                Convide usuários para administrar a plataforma YesClin.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Papel global</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último acesso</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[60px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name ?? '—'}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell>{formatDate(u.last_login_at)}</TableCell>
                      <TableCell>{formatDate(u.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(u)}>
                              <Pencil className="mr-2 h-4 w-4" /> Editar papel
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openToggle(u)}>
                              <Power className="mr-2 h-4 w-4" />
                              {u.status === 'active' ? 'Desativar acesso' : 'Ativar acesso'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openAudit(u)}>
                              <History className="mr-2 h-4 w-4" /> Ver auditoria
                            </DropdownMenuItem>
                            {u.status === 'invited' && (
                              <DropdownMenuItem onClick={() => resendInvite(u)}>
                                <Mail className="mr-2 h-4 w-4" /> Reenviar convite
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => { setRemoveTarget(u); setRemoveReason(''); }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Remover acesso global
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Convidar usuário */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar usuário global</DialogTitle>
            <DialogDescription>
              Adicione um novo usuário ao painel Super Admin da plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
              {emailLinkedToClinic && (
                <p className="text-xs text-amber-600">
                  Este e-mail já pertence a um usuário de clínica. O acesso global será adicionado sem alterar o acesso da clínica.
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Papel global</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                  <SelectItem value="operations">Operação</SelectItem>
                  <SelectItem value="saas_finance">Financeiro SaaS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Observação interna (opcional)</Label>
              <Textarea
                value={inviteNotes}
                onChange={(e) => setInviteNotes(e.target.value)}
                placeholder="Ex.: contato do parceiro, motivo do acesso, etc."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>Cancelar</Button>
            <Button onClick={submitInvite} disabled={inviting}>
              {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar convite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Editar papel */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuário global</DialogTitle>
            <DialogDescription>{editTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Papel global</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as Role)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="support">Suporte</SelectItem>
                  <SelectItem value="operations">Operação</SelectItem>
                  <SelectItem value="saas_finance">Financeiro SaaS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={(v) => setEditStatus(v as Status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                  <SelectItem value="invited">Convite pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Motivo da alteração</Label>
              <Textarea value={editReason} onChange={(e) => setEditReason(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={editing}>Cancelar</Button>
            <Button onClick={submitEdit} disabled={editing}>
              {editing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auditoria */}
      <Dialog open={!!auditTarget} onOpenChange={(o) => !o && setAuditTarget(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Auditoria do usuário</DialogTitle>
            <DialogDescription>{auditTarget?.email}</DialogDescription>
          </DialogHeader>
          {auditLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : auditRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum registro de auditoria para este usuário.
            </p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/hora</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-xs">{formatDate(r.created_at)}</TableCell>
                      <TableCell className="text-xs">{r.action}</TableCell>
                      <TableCell className="text-xs">{r.actor_email ?? '—'}</TableCell>
                      <TableCell className="text-xs">
                        <pre className="whitespace-pre-wrap break-all text-[11px] text-muted-foreground">
                          {r.metadata && Object.keys(r.metadata).length > 0 ? JSON.stringify(r.metadata, null, 2) : '—'}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Toggle status */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(o) => !o && setToggleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.status === 'active' ? 'Desativar acesso' : 'Ativar acesso'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.status === 'active'
                ? 'Tem certeza que deseja desativar o acesso deste usuário ao painel Super Admin?'
                : 'Tem certeza que deseja reativar o acesso deste usuário ao painel Super Admin?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {toggleTarget?.status === 'active' && (
            <div className="space-y-1.5">
              <Label>Motivo</Label>
              <Textarea value={toggleReason} onChange={(e) => setToggleReason(e.target.value)} rows={2} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={toggling}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={submitToggle} disabled={toggling}>
              {toggling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remover */}
      <AlertDialog open={!!removeTarget} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso global</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação remove o acesso global do usuário à plataforma, mas não remove acessos que ele tenha dentro de clínicas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Textarea value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} rows={2} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={removing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={submitRemove}
              disabled={removing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover acesso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SummaryCard({
  icon: Icon, label, value, accent,
}: { icon: any; label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${accent ?? 'text-foreground'}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
