import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, ShieldAlert, Smartphone, Trash2, Copy } from 'lucide-react';

type Factor = {
  id: string;
  friendly_name?: string | null;
  factor_type: string;
  status: string;
  created_at?: string;
};

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
};

export default function SuperAdminMfa() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadFactors = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
      toast.error('Não foi possível carregar seus autenticadores');
      setFactors([]);
    } else {
      setFactors(((data?.totp ?? []) as unknown as Factor[]) ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  const verifiedFactors = factors.filter((f) => f.status === 'verified');
  const isEnabled = verifiedFactors.length > 0;

  const startEnrollment = async () => {
    setEnrolling(true);
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: `Autenticador ${new Date().toLocaleDateString('pt-BR')}`,
    });
    setEnrolling(false);
    if (error || !data) {
      toast.error(error ? error.message : 'Não foi possível iniciar o cadastro');
      return;
    }
    setCode('');
    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
  };

  const cancelEnrollment = async () => {
    if (!enrollment) return;
    await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });
    setEnrollment(null);
    setCode('');
    void loadFactors();
  };

  const confirmEnrollment = async () => {
    if (!enrollment || code.trim().length !== 6) return;
    setVerifying(true);
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
    if (challenge.error || !challenge.data) {
      setVerifying(false);
      toast.error(challenge.error?.message ?? 'Não foi possível validar o código');
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: code.trim(),
    });
    setVerifying(false);
    if (error) {
      toast.error('Código inválido. Confira o app autenticador e tente novamente.');
      return;
    }
    toast.success('Verificação em 2 etapas ativada');
    setEnrollment(null);
    setCode('');
    void loadFactors();
  };

  const removeFactor = async (factorId: string) => {
    setRemovingId(factorId);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    setRemovingId(null);
    if (error) {
      toast.error(error.message ?? 'Não foi possível remover o autenticador');
      return;
    }
    toast.success('Autenticador removido');
    void loadFactors();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Segurança da conta</h1>
        <p className="text-sm text-muted-foreground">
          Verificação em 2 etapas (TOTP) da sua conta de Super Admin.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-base">Verificação em 2 etapas</CardTitle>
            <CardDescription>
              Use um app autenticador (Google Authenticator, Authy, 1Password) para gerar códigos de 6 dígitos.
            </CardDescription>
          </div>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isEnabled ? (
            <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20" variant="outline">
              <ShieldCheck className="h-3.5 w-3.5" /> Ativada
            </Badge>
          ) : (
            <Badge className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20" variant="outline">
              <ShieldAlert className="h-3.5 w-3.5" /> Não ativada
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <>
              {factors.length > 0 && (
                <div className="space-y-2">
                  <Label>Autenticadores cadastrados</Label>
                  <div className="divide-y rounded-md border">
                    {factors.map((factor) => (
                      <div key={factor.id} className="flex items-center justify-between gap-3 p-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {factor.friendly_name || 'Autenticador TOTP'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {factor.status === 'verified' ? 'Verificado' : 'Pendente de confirmação'}
                              {factor.created_at
                                ? ` · ${new Date(factor.created_at).toLocaleDateString('pt-BR')}`
                                : ''}
                            </p>
                          </div>
                        </div>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive" disabled={removingId === factor.id}>
                              {removingId === factor.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover autenticador?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sua conta ficará sem verificação em 2 etapas até você cadastrar outro autenticador.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => void removeFactor(factor.id)}
                              >
                                Remover
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {enrollment ? (
                <div className="space-y-4">
                  <Separator />
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <img
                      src={enrollment.qrCode}
                      alt="QR Code para cadastrar o autenticador"
                      className="h-44 w-44 shrink-0 rounded-md border bg-card p-2"
                    />
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        1. Escaneie o QR Code no seu app autenticador.
                        <br />
                        2. Digite abaixo o código de 6 dígitos gerado.
                      </p>
                      <div className="space-y-1">
                        <Label className="text-xs">Chave manual</Label>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-muted px-2 py-1 text-xs break-all">{enrollment.secret}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              void navigator.clipboard.writeText(enrollment.secret);
                              toast.success('Chave copiada');
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="mfa-code">Código de 6 dígitos</Label>
                        <Input
                          id="mfa-code"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="w-40 tracking-[0.3em]"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => void confirmEnrollment()} disabled={verifying || code.length !== 6}>
                          {verifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Confirmar e ativar
                        </Button>
                        <Button variant="outline" onClick={() => void cancelEnrollment()} disabled={verifying}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Button onClick={() => void startEnrollment()} disabled={enrolling}>
                  {enrolling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEnabled ? 'Cadastrar outro autenticador' : 'Cadastrar autenticador'}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
