import { useState, useEffect } from 'react';
import { Palette, Save, Layout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { useVisualSettings, type LayoutMode, type LogoPosition } from '@/hooks/prontuario';

const PRESETS = [
  { name: 'Indigo', primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b' },
  { name: 'Esmeralda', primary: '#10b981', secondary: '#059669', accent: '#f97316' },
  { name: 'Rosa', primary: '#ec4899', secondary: '#db2777', accent: '#8b5cf6' },
  { name: 'Azul', primary: '#3b82f6', secondary: '#2563eb', accent: '#eab308' },
];

const LAYOUTS: { value: LayoutMode; label: string }[] = [
  { value: 'compact', label: 'Compacto' },
  { value: 'standard', label: 'Padrão' },
  { value: 'expanded', label: 'Expandido' },
];

export function VisualSection() {
  const { settings, defaults, loading, saving, save } = useVisualSettings();

  const [primary, setPrimary] = useState(defaults.primary_color);
  const [secondary, setSecondary] = useState(defaults.secondary_color);
  const [accent, setAccent] = useState(defaults.accent_color);
  const [layout, setLayout] = useState<LayoutMode>(defaults.layout);
  const [logoPosition, setLogoPosition] = useState<LogoPosition>(defaults.logo_position);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!loading && !initialized) {
      if (settings) {
        setPrimary(settings.primary_color);
        setSecondary(settings.secondary_color);
        setAccent(settings.accent_color);
        setLayout(settings.layout);
        setLogoPosition(settings.logo_position);
      }
      setInitialized(true);
    }
  }, [loading, settings, initialized]);

  const applyPreset = (p: typeof PRESETS[0]) => {
    setPrimary(p.primary);
    setSecondary(p.secondary);
    setAccent(p.accent);
  };

  const handleSave = () => {
    save({
      primary_color: primary,
      secondary_color: secondary,
      accent_color: accent,
      layout,
      logo_position: logoPosition,
    });
  };

  if (loading && !initialized) {
    return <Card><CardContent className="py-8"><Skeleton className="h-32 w-full" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" />Cores</CardTitle>
          <CardDescription>Personalize as cores do prontuário</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="mb-3 block">Paletas Pré-definidas</Label>
            <div className="flex flex-wrap gap-3">
              {PRESETS.map(p => (
                <button
                  key={p.name}
                  onClick={() => applyPreset(p)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted"
                >
                  <div className="flex gap-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.secondary }} />
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: p.accent }} />
                  </div>
                  <span className="text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Primária</Label>
              <div className="flex gap-2">
                <Input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="w-12 h-10 p-1" />
                <Input value={primary} onChange={e => setPrimary(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secundária</Label>
              <div className="flex gap-2">
                <Input type="color" value={secondary} onChange={e => setSecondary(e.target.value)} className="w-12 h-10 p-1" />
                <Input value={secondary} onChange={e => setSecondary(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Destaque</Label>
              <div className="flex gap-2">
                <Input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-12 h-10 p-1" />
                <Input value={accent} onChange={e => setAccent(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg border">
            <Label className="mb-3 block text-sm">Pré-visualização</Label>
            <div className="flex gap-4">
              <div className="px-4 py-2 rounded text-white font-medium" style={{ backgroundColor: primary }}>Primário</div>
              <div className="px-4 py-2 rounded text-white font-medium" style={{ backgroundColor: secondary }}>Secundário</div>
              <div className="px-4 py-2 rounded text-white font-medium" style={{ backgroundColor: accent }}>Destaque</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layout className="h-5 w-5" />Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={layout} onValueChange={v => setLayout(v as LayoutMode)} className="flex gap-4">
            {LAYOUTS.map(l => (
              <div
                key={l.value}
                onClick={() => setLayout(l.value)}
                className={`flex-1 p-4 border rounded-lg cursor-pointer text-center ${layout === l.value ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
              >
                <RadioGroupItem value={l.value} className="sr-only" />
                <span className="font-medium">{l.label}</span>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
