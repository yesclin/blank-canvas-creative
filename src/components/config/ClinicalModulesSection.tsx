import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { 
  Blocks, 
  RefreshCcw, 
  CalendarRange, 
  Gauge, 
  Syringe, 
  Upload, 
  MapPin, 
  Smile, 
  Ruler, 
  ArrowLeftRight, 
  FileCheck, 
  ClipboardList,
  AlertCircle,
  LucideIcon,
} from "lucide-react";
import { useSpecialties } from "@/hooks/useSpecialties";
import { 
  useSpecialtyModules, 
  useToggleSpecialtyModule, 
  useResetSpecialtyModules 
} from "@/hooks/useClinicalModules";
import { MODULE_CATEGORY_LABELS, ClinicalModuleCategory } from "@/types/clinical-modules";
import { toast } from "sonner";

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  CalendarRange,
  Gauge,
  Syringe,
  Upload,
  MapPin,
  Smile,
  Ruler,
  ArrowLeftRight,
  FileCheck,
  ClipboardList,
};

export function ClinicalModulesSection() {
  const { data: specialties = [], isLoading: loadingSpecialties } = useSpecialties();
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  
  const { data: modules = [], isLoading: loadingModules } = useSpecialtyModules(selectedSpecialtyId);
  const toggleModule = useToggleSpecialtyModule();
  const resetModules = useResetSpecialtyModules();

  const handleToggle = (moduleId: string, currentEnabled: boolean) => {
    if (!selectedSpecialtyId) return;
    
    toggleModule.mutate({
      specialtyId: selectedSpecialtyId,
      moduleId,
      isEnabled: !currentEnabled,
    });
  };

  const handleReset = () => {
    if (!selectedSpecialtyId) return;
    resetModules.mutate(selectedSpecialtyId);
    setConfirmReset(false);
  };

  // Group modules by category
  const groupedModules = modules.reduce((acc, module) => {
    const category = module.category as ClinicalModuleCategory;
    if (!acc[category]) acc[category] = [];
    acc[category].push(module);
    return acc;
  }, {} as Record<ClinicalModuleCategory, typeof modules>);

  const hasOverrides = modules.some(m => m.source === 'clinic_override');
  const selectedSpecialty = specialties.find(s => s.id === selectedSpecialtyId);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Blocks className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Módulos Funcionais</CardTitle>
                <CardDescription>
                  Configure quais funcionalidades estão disponíveis para cada especialidade
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Specialty Selector */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-sm">
              <Select
                value={selectedSpecialtyId || ""}
                onValueChange={(val) => setSelectedSpecialtyId(val || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma especialidade..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingSpecialties ? (
                    <div className="p-2">
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : specialties.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      Nenhuma especialidade cadastrada
                    </div>
                  ) : (
                    specialties.map((specialty) => (
                      <SelectItem key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {selectedSpecialtyId && hasOverrides && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setConfirmReset(true)}
                disabled={resetModules.isPending}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />
                Restaurar Padrões
              </Button>
            )}
          </div>

          {/* Module List */}
          {!selectedSpecialtyId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Blocks className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-1">
                Selecione uma especialidade
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                Escolha uma especialidade para configurar os módulos funcionais disponíveis no prontuário
              </p>
            </div>
          ) : loadingModules ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedModules).map(([category, categoryModules]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">
                    {MODULE_CATEGORY_LABELS[category as ClinicalModuleCategory]}
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {categoryModules.map((module) => {
                      const Icon = ICON_MAP[module.icon || ''] || Blocks;
                      
                      return (
                        <div
                          key={module.id}
                          className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            module.is_enabled 
                              ? 'bg-card border-primary/20' 
                              : 'bg-muted/30 border-muted'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                              module.is_enabled 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${
                                  !module.is_enabled && 'text-muted-foreground'
                                }`}>
                                  {module.name}
                                </span>
                                {module.source === 'clinic_override' && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Personalizado
                                  </Badge>
                                )}
                              </div>
                              {module.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {module.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={module.is_enabled}
                            onCheckedChange={() => handleToggle(module.id, module.is_enabled)}
                            disabled={toggleModule.isPending}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Restaurar configuração padrão?
            </AlertDialogTitle>
            <AlertDialogDescription>
              As personalizações de módulos para <strong>{selectedSpecialty?.name}</strong> serão 
              removidas e os padrões do sistema serão restaurados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
