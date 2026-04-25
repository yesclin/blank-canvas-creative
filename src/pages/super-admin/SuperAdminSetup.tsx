/**
 * Tela de seed do PRIMEIRO Super Admin.
 * Liberada apenas enquanto a tabela platform_admins estiver vazia.
 * O usuário logado que acessar primeiro vira Super Admin via RPC.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';

export default function SuperAdminSetup() {
  const navigate = useNavigate();
  const { email, totalAdmins, refresh, loading } = usePlatformAdmin();
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleClaim = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc('claim_first_platform_admin', {
        _full_name: name?.trim() || null,
      });
      if (error) throw error;
      toast.success('Você agora é Super Admin da plataforma.');
      await refresh();
      navigate('/super-admin', { replace: true });
    } catch (e: any) {
      const msg = e?.message?.includes('super_admin_already_exists')
        ? 'Já existe um Super Admin. Peça acesso a quem já administra a plataforma.'
        : 'Não foi possível promover este usuário a Super Admin.';
      toast.error(msg);
      console.error('[claim_first_platform_admin] error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Provisionar Super Admin</CardTitle>
          <CardDescription>
            Esta tela só está disponível porque ainda não existe nenhum administrador da plataforma.
            O usuário atual será promovido permanentemente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription className="text-xs">
              Você está logado como <strong>{email ?? '—'}</strong>. Se este não for o usuário correto,
              faça logout e entre com a conta apropriada antes de continuar.
            </AlertDescription>
          </Alert>

          {(totalAdmins ?? 0) > 0 ? (
            <Alert variant="destructive">
              <AlertDescription>
                Já existe Super Admin. Esta tela está bloqueada.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Nome de exibição (opcional)</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Time YesClin"
                />
              </div>
              <Button className="w-full" onClick={handleClaim} disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tornar-me Super Admin
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
