import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Settings, LayoutList, FileText, Palette, Shield, Lock, FormInput, AlertTriangle, Stethoscope, ClipboardList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useEnabledSpecialties } from '@/hooks/useEnabledSpecialties';
import { TabsSection, TemplatesSection, VisualSection, SecuritySection, PermissionsSection, CustomFieldsSection } from '@/components/config/prontuario';
import { AnamnesisModelsSection } from '@/components/config/prontuario/AnamnesisModelsSection';

const TABS = [
  { id: 'tabs', label: 'Abas', icon: LayoutList, description: 'Visibilidade e ordem' },
  { id: 'templates', label: 'Modelos', icon: FileText, description: 'Anamnese, evolução, etc.' },
  { id: 'anamnesis', label: 'Anamnese', icon: ClipboardList, description: 'Modelos de anamnese' },
  { id: 'custom-fields', label: 'Campos', icon: FormInput, description: 'Campos personalizados', badge: 'Novo' },
  { id: 'visual', label: 'Visual', icon: Palette, description: 'Cores e layout' },
  { id: 'permissions', label: 'Permissões', icon: Lock, description: 'Acesso por perfil', badge: 'RBAC' },
  { id: 'security', label: 'Segurança', icon: Shield, description: 'LGPD e bloqueios', badge: 'LGPD' },
];

export default function ConfigProntuario() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Read query params for deep-link from prontuario
  const qsSpecialtyId = searchParams.get('especialidade_id');
  const qsTipo = searchParams.get('tipo');
  const qsAction = searchParams.get('action');
  const qsReturn = searchParams.get('return');

  const [activeTab, setActiveTab] = useState(() => {
    if (qsTipo === 'anamnese') return 'anamnesis';
    return 'tabs';
  });
  const { data: specialties = [], isLoading: loadingSpecialties } = useEnabledSpecialties();
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(qsSpecialtyId);

  // Sync specialty from query param when specialties load
  useEffect(() => {
    if (qsSpecialtyId && specialties.length > 0) {
      const exists = specialties.some(s => s.id === qsSpecialtyId);
      if (exists) {
        setSelectedSpecialtyId(qsSpecialtyId);
      }
    }
  }, [qsSpecialtyId, specialties]);

  // Callback for AnamnesisModelsSection to signal creation complete → return to prontuario
  const handleModelCreated = useCallback(() => {
    if (qsReturn === 'prontuario' && qsSpecialtyId) {
      navigate(`/app/prontuario?especialidade_id=${qsSpecialtyId}`);
    }
  }, [qsReturn, qsSpecialtyId, navigate]);

  // Auto-select first specialty when loaded
  const effectiveSpecialtyId = selectedSpecialtyId && specialties.some(s => s.id === selectedSpecialtyId)
    ? selectedSpecialtyId
    : specialties.length > 0 ? specialties[0].id : null;

  const selectedSpecialty = specialties.find(s => s.id === effectiveSpecialtyId) || null;
  const isBlocked = !loadingSpecialties && specialties.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Modelos de Prontuário
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure abas, modelos de documentos, campos personalizados e permissões por especialidade
        </p>
      </div>

      {/* Specialty Selector */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground whitespace-nowrap">
            <Stethoscope className="h-4 w-4 text-primary" />
            Especialidade ativa:
          </div>
          {loadingSpecialties ? (
            <div className="h-9 w-48 bg-muted animate-pulse rounded-md" />
          ) : isBlocked ? (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Nenhuma especialidade ativa. Ative em Configurações &gt; Clínica.
            </div>
          ) : (
            <Select
              value={effectiveSpecialtyId || ''}
              onValueChange={(val) => setSelectedSpecialtyId(val)}
            >
              <SelectTrigger className="w-[280px] bg-background">
                <SelectValue placeholder="Selecione uma especialidade" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      {s.color && (
                        <span
                          className="h-2.5 w-2.5 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                      )}
                      {s.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {selectedSpecialty && (
            <Badge variant="secondary" className="text-xs">
              {selectedSpecialty.area || 'Geral'}
            </Badge>
          )}
        </CardContent>
      </Card>

      {isBlocked ? (
        <Card>
          <CardContent className="text-center py-16">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Módulo bloqueado</p>
            <p className="text-muted-foreground">
              Nenhuma especialidade ativa encontrada. Ative pelo menos uma especialidade em{' '}
              <span className="font-medium text-primary">Configurações &gt; Clínica</span> para configurar o prontuário.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-2 lg:grid-cols-7 h-auto gap-2 bg-transparent p-0">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex flex-col items-center gap-1.5 p-3 h-auto border rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card hover:bg-muted border-border'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{tab.label}</span>
                    {tab.badge && (
                      <Badge variant={isActive ? 'secondary' : 'outline'} className="text-[10px] px-1 py-0">
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                  <span className={`text-[10px] hidden lg:block ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {tab.description}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="tabs" className="m-0">
            <TabsSection specialtyId={effectiveSpecialtyId || undefined} />
          </TabsContent>

          <TabsContent value="templates" className="m-0">
            <TemplatesSection specialtyId={effectiveSpecialtyId || undefined} />
          </TabsContent>

          <TabsContent value="anamnesis" className="m-0">
            <AnamnesisModelsSection 
              specialtyId={effectiveSpecialtyId || undefined} 
              initialAction={qsTipo === 'anamnese' ? (qsAction as any) : undefined}
              onModelCreated={handleModelCreated}
            />
          </TabsContent>

          <TabsContent value="custom-fields" className="m-0">
            <CustomFieldsSection specialtyId={effectiveSpecialtyId || undefined} />
          </TabsContent>

          <TabsContent value="visual" className="m-0">
            <VisualSection />
          </TabsContent>

          <TabsContent value="permissions" className="m-0">
            <PermissionsSection />
          </TabsContent>

          <TabsContent value="security" className="m-0">
            <SecuritySection />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
