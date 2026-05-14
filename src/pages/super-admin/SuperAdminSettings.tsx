import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logPlatformAction } from '@/lib/superAdminAudit';

type SettingRow = {
  key: string;
  value: any;
  description: string | null;
  category: string;
  updated_at: string;
};

const CATEGORIES: { id: string; label: string; description: string }[] = [
  { id: 'branding', label: 'Plataforma', description: 'Identidade e dados públicos da plataforma' },
  { id: 'trial', label: 'Trial', description: 'Política de período de teste e bloqueios' },
  { id: 'limits', label: 'Limites padrão', description: 'Valores aplicados a clínicas sem override' },
  { id: 'security', label: 'Segurança', description: 'Sessão, senha e autenticação' },
  { id: 'audit', label: 'Auditoria', description: 'Retenção e exportação de logs' },
  { id: 'email', label: 'E-mail', description: 'Remetente padrão para mensagens transacionais' },
];

function inferType(v: any): 'boolean' | 'number' | 'string' {
  if (typeof v === 'boolean') return 'boolean';
  if (typeof v === 'number') return 'number';
  return 'string';
}

export default function SuperAdminSettings() {
  const [rows, setRows] = useState<SettingRow[]>([]);
  const [draft, setDraft] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('platform_settings' as any)
        .select('*')
        .order('category')
        .order('key');
      if (err) throw err;
      const list = (data as any as SettingRow[]) ?? [];
      setRows(list);
      const map: Record<string, any> = {};
      list.forEach((r) => { map[r.key] = r.value; });
      setDraft(map);
    } catch (e: any) {
      setError(e.message ?? 'Falha ao carregar configurações.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const dirtyKeys = useMemo(() => {
    return rows.filter((r) => JSON.stringify(r.value) !== JSON.stringify(draft[r.key])).map((r) => r.key);
  }, [rows, draft]);

  const save = async () => {
    if (dirtyKeys.length === 0) return;
    setSaving(true);
    try {
      for (const key of dirtyKeys) {
        const { error: err } = await supabase
          .from('platform_settings' as any)
          .update({ value: draft[key] })
          .eq('key', key);
        if (err) throw err;
      }
      await logPlatformAction({
        action: 'platform_settings.update',
        metadata: { keys: dirtyKeys, count: dirtyKeys.length },
      });
      toast.success(`${dirtyKeys.length} configuração(ões) salva(s).`);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  const grouped = useMemo(() => {
    const g: Record<string, SettingRow[]> = {};
    for (const r of rows) {
      (g[r.category] ??= []).push(r);
    }
    return g;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações da plataforma</h1>
          <p className="text-sm text-muted-foreground">
            Parâmetros globais aplicáveis a toda a plataforma. Não se confundem com configurações por clínica.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading || saving}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recarregar
          </Button>
          <Button size="sm" onClick={() => void save()} disabled={dirtyKeys.length === 0 || saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando…' : `Salvar${dirtyKeys.length ? ` (${dirtyKeys.length})` : ''}`}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falha ao carregar</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma configuração registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={CATEGORIES[0].id} className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>{c.label}</TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((c) => (
            <TabsContent key={c.id} value={c.id} className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{c.label}</CardTitle>
                  <CardDescription>{c.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(grouped[c.id] ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma configuração nesta seção.</p>
                  ) : (
                    grouped[c.id].map((r) => {
                      const type = inferType(r.value);
                      const current = draft[r.key];
                      return (
                        <div key={r.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start border-b pb-4 last:border-b-0 last:pb-0">
                          <div className="md:col-span-1">
                            <Label className="text-sm font-medium">{r.description ?? r.key}</Label>
                            <p className="text-xs text-muted-foreground font-mono mt-1">{r.key}</p>
                          </div>
                          <div className="md:col-span-2">
                            {type === 'boolean' ? (
                              <Switch
                                checked={!!current}
                                onCheckedChange={(v) => setDraft((d) => ({ ...d, [r.key]: v }))}
                              />
                            ) : type === 'number' ? (
                              <Input
                                type="number"
                                value={current ?? ''}
                                onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value === '' ? null : Number(e.target.value) }))}
                                className="max-w-xs"
                              />
                            ) : (
                              <Input
                                value={current ?? ''}
                                onChange={(e) => setDraft((d) => ({ ...d, [r.key]: e.target.value }))}
                                className="max-w-md"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Escopo</AlertTitle>
        <AlertDescription>
          Estas configurações afetam toda a plataforma. Configurações por clínica continuam isoladas em <code>clinic_*_settings</code>.
        </AlertDescription>
      </Alert>
    </div>
  );
}
