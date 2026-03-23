import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { usePermissions } from '@/hooks/usePermissions';
import { toast } from 'sonner';

// Standard tab keys
export const MEDICAL_RECORD_TABS = [
  { key: 'resumo', label: 'Resumo' },
  { key: 'anamnese', label: 'Anamnese' },
  { key: 'evolucao', label: 'Evolução' },
  { key: 'diagnostico', label: 'Diagnóstico' },
  { key: 'procedimentos', label: 'Procedimentos' },
  { key: 'prescricoes', label: 'Prescrições' },
  { key: 'exames', label: 'Exames' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'consentimentos', label: 'Consentimentos' },
  { key: 'auditoria', label: 'Auditoria' },
] as const;

// Standard action keys
export const MEDICAL_RECORD_ACTIONS = [
  { key: 'upload_files', label: 'Upload de Arquivos' },
  { key: 'print_record', label: 'Imprimir Prontuário' },
  { key: 'export_pdf', label: 'Exportar PDF' },
  { key: 'sign_record', label: 'Assinar Registros' },
  { key: 'view_audit', label: 'Ver Auditoria' },
  { key: 'create_entry', label: 'Criar Entrada' },
  { key: 'edit_entry', label: 'Editar Entrada' },
  { key: 'delete_entry', label: 'Excluir Entrada' },
] as const;

export type TabKey = typeof MEDICAL_RECORD_TABS[number]['key'];
export type ActionKey = typeof MEDICAL_RECORD_ACTIONS[number]['key'];

export interface TabPermission {
  id?: string;
  clinic_id: string;
  role: string;
  tab_key: TabKey;
  can_view: boolean;
  can_edit: boolean;
  can_export: boolean;
  can_sign: boolean;
}

export interface ActionPermission {
  id?: string;
  clinic_id: string;
  role: string;
  action_key: ActionKey;
  allowed: boolean;
}

// Default permissions by role
const DEFAULT_TAB_PERMISSIONS: Record<string, Partial<Record<TabKey, Omit<TabPermission, 'id' | 'clinic_id' | 'role' | 'tab_key'>>>> = {
  owner: Object.fromEntries(MEDICAL_RECORD_TABS.map(t => [t.key, { can_view: true, can_edit: true, can_export: true, can_sign: true }])),
  admin: Object.fromEntries(MEDICAL_RECORD_TABS.map(t => [t.key, { can_view: true, can_edit: true, can_export: true, can_sign: true }])),
  profissional: Object.fromEntries(MEDICAL_RECORD_TABS.map(t => [t.key, { can_view: true, can_edit: true, can_export: true, can_sign: true }])),
  recepcionista: {
    resumo: { can_view: true, can_edit: false, can_export: false, can_sign: false },
    anamnese: { can_view: false, can_edit: false, can_export: false, can_sign: false },
    evolucao: { can_view: false, can_edit: false, can_export: false, can_sign: false },
    diagnostico: { can_view: false, can_edit: false, can_export: false, can_sign: false },
    procedimentos: { can_view: false, can_edit: false, can_export: false, can_sign: false },
    prescricoes: { can_view: false, can_edit: false, can_export: false, can_sign: false },
    exames: { can_view: false, can_edit: false, can_export: false, can_sign: false },
    documentos: { can_view: true, can_edit: false, can_export: false, can_sign: false },
    consentimentos: { can_view: true, can_edit: true, can_export: false, can_sign: false },
    auditoria: { can_view: false, can_edit: false, can_export: false, can_sign: false },
  },
};

const DEFAULT_ACTION_PERMISSIONS: Record<string, Partial<Record<ActionKey, boolean>>> = {
  owner: Object.fromEntries(MEDICAL_RECORD_ACTIONS.map(a => [a.key, true])),
  admin: Object.fromEntries(MEDICAL_RECORD_ACTIONS.map(a => [a.key, true])),
  profissional: Object.fromEntries(MEDICAL_RECORD_ACTIONS.map(a => [a.key, true])),
  recepcionista: {
    upload_files: false,
    print_record: false,
    export_pdf: false,
    sign_record: false,
    view_audit: false,
    create_entry: false,
    edit_entry: false,
    delete_entry: false,
  },
};

/**
 * Hook to manage medical record tab and action permissions for configuration.
 */
export function useMedicalRecordPermissions() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [tabPermissions, setTabPermissions] = useState<TabPermission[]>([]);
  const [actionPermissions, setActionPermissions] = useState<ActionPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch permissions for all roles
  const fetchPermissions = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);

    try {
      const [tabRes, actionRes] = await Promise.all([
        supabase
          .from('medical_record_tab_permissions')
          .select('*')
          .eq('clinic_id', clinic.id),
        supabase
          .from('medical_record_action_permissions')
          .select('*')
          .eq('clinic_id', clinic.id),
      ]);

      if (tabRes.error) throw tabRes.error;
      if (actionRes.error) throw actionRes.error;

      setTabPermissions(tabRes.data as TabPermission[]);
      setActionPermissions(actionRes.data as ActionPermission[]);
    } catch (err) {
      console.error('Error fetching permissions:', err);
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchPermissions();
    }
  }, [clinicLoading, clinic?.id, fetchPermissions]);

  // Get tab permissions for a specific role
  const getTabPermissionsForRole = useCallback((role: string): TabPermission[] => {
    const existing = tabPermissions.filter(p => p.role === role);
    
    // Merge with defaults for missing tabs
    return MEDICAL_RECORD_TABS.map(tab => {
      const found = existing.find(p => p.tab_key === tab.key);
      if (found) return found;

      // Return default
      const defaults = DEFAULT_TAB_PERMISSIONS[role]?.[tab.key] || { can_view: false, can_edit: false, can_export: false, can_sign: false };
      return {
        clinic_id: clinic?.id || '',
        role,
        tab_key: tab.key,
        ...defaults,
      };
    });
  }, [tabPermissions, clinic?.id]);

  // Get action permissions for a specific role
  const getActionPermissionsForRole = useCallback((role: string): ActionPermission[] => {
    const existing = actionPermissions.filter(p => p.role === role);
    
    return MEDICAL_RECORD_ACTIONS.map(action => {
      const found = existing.find(p => p.action_key === action.key);
      if (found) return found;

      const defaultAllowed = DEFAULT_ACTION_PERMISSIONS[role]?.[action.key] ?? false;
      return {
        clinic_id: clinic?.id || '',
        role,
        action_key: action.key,
        allowed: defaultAllowed,
      };
    });
  }, [actionPermissions, clinic?.id]);

  // Save tab permissions for a role
  const saveTabPermissions = useCallback(async (role: string, permissions: TabPermission[]) => {
    if (!clinic?.id) return false;
    setSaving(true);

    try {
      // Upsert each permission
      for (const perm of permissions) {
        const { error } = await supabase
          .from('medical_record_tab_permissions')
          .upsert({
            clinic_id: clinic.id,
            role: perm.role,
            tab_key: perm.tab_key,
            can_view: perm.can_view,
            can_edit: perm.can_edit,
            can_export: perm.can_export,
            can_sign: perm.can_sign,
          }, {
            onConflict: 'clinic_id,role,tab_key',
          });

        if (error) throw error;
      }

      toast.success('Permissões de abas salvas');
      await fetchPermissions();
      return true;
    } catch (err) {
      console.error('Error saving tab permissions:', err);
      toast.error('Erro ao salvar permissões');
      return false;
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, fetchPermissions]);

  // Save action permissions for a role
  const saveActionPermissions = useCallback(async (role: string, permissions: ActionPermission[]) => {
    if (!clinic?.id) return false;
    setSaving(true);

    try {
      for (const perm of permissions) {
        const { error } = await supabase
          .from('medical_record_action_permissions')
          .upsert({
            clinic_id: clinic.id,
            role: perm.role,
            action_key: perm.action_key,
            allowed: perm.allowed,
          }, {
            onConflict: 'clinic_id,role,action_key',
          });

        if (error) throw error;
      }

      toast.success('Permissões de ações salvas');
      await fetchPermissions();
      return true;
    } catch (err) {
      console.error('Error saving action permissions:', err);
      toast.error('Erro ao salvar permissões');
      return false;
    } finally {
      setSaving(false);
    }
  }, [clinic?.id, fetchPermissions]);

  // Initialize default permissions for a role
  const initializeDefaultsForRole = useCallback(async (role: string) => {
    if (!clinic?.id) return false;

    const tabPerms: TabPermission[] = MEDICAL_RECORD_TABS.map(tab => {
      const defaults = DEFAULT_TAB_PERMISSIONS[role]?.[tab.key] || { can_view: false, can_edit: false, can_export: false, can_sign: false };
      return {
        clinic_id: clinic.id,
        role,
        tab_key: tab.key,
        ...defaults,
      };
    });

    const actionPerms: ActionPermission[] = MEDICAL_RECORD_ACTIONS.map(action => ({
      clinic_id: clinic.id,
      role,
      action_key: action.key,
      allowed: DEFAULT_ACTION_PERMISSIONS[role]?.[action.key] ?? false,
    }));

    const tabResult = await saveTabPermissions(role, tabPerms);
    const actionResult = await saveActionPermissions(role, actionPerms);

    return tabResult && actionResult;
  }, [clinic?.id, saveTabPermissions, saveActionPermissions]);

  return {
    tabPermissions,
    actionPermissions,
    loading: loading || clinicLoading,
    saving,
    fetchPermissions,
    getTabPermissionsForRole,
    getActionPermissionsForRole,
    saveTabPermissions,
    saveActionPermissions,
    initializeDefaultsForRole,
  };
}

/**
 * Hook to check current user's medical record permissions for ENFORCEMENT.
 */
export function useCurrentUserMedicalRecordPermissions() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const { role, isAdmin, isLoading: permLoading } = usePermissions();
  const [tabPermissions, setTabPermissions] = useState<TabPermission[]>([]);
  const [actionPermissions, setActionPermissions] = useState<ActionPermission[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPermissions = useCallback(async () => {
    if (!clinic?.id || !role) return;
    setLoading(true);

    try {
      // Admins/owners have full access
      if (isAdmin) {
        setTabPermissions(MEDICAL_RECORD_TABS.map(tab => ({
          clinic_id: clinic.id,
          role: role,
          tab_key: tab.key,
          can_view: true,
          can_edit: true,
          can_export: true,
          can_sign: true,
        })));
        setActionPermissions(MEDICAL_RECORD_ACTIONS.map(action => ({
          clinic_id: clinic.id,
          role: role,
          action_key: action.key,
          allowed: true,
        })));
        setLoading(false);
        return;
      }

      const [tabRes, actionRes] = await Promise.all([
        supabase
          .from('medical_record_tab_permissions')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('role', role),
        supabase
          .from('medical_record_action_permissions')
          .select('*')
          .eq('clinic_id', clinic.id)
          .eq('role', role),
      ]);

      // Use fetched or defaults
      const tabData = (tabRes.data || []) as TabPermission[];
      const actionData = (actionRes.data || []) as ActionPermission[];

      // Merge with defaults
      const mergedTabs = MEDICAL_RECORD_TABS.map(tab => {
        const found = tabData.find(p => p.tab_key === tab.key);
        if (found) return found;
        const defaults = DEFAULT_TAB_PERMISSIONS[role]?.[tab.key] || { can_view: false, can_edit: false, can_export: false, can_sign: false };
        return { clinic_id: clinic.id, role, tab_key: tab.key, ...defaults };
      });

      const mergedActions = MEDICAL_RECORD_ACTIONS.map(action => {
        const found = actionData.find(p => p.action_key === action.key);
        if (found) return found;
        return { clinic_id: clinic.id, role, action_key: action.key, allowed: DEFAULT_ACTION_PERMISSIONS[role]?.[action.key] ?? false };
      });

      setTabPermissions(mergedTabs);
      setActionPermissions(mergedActions);
    } catch (err) {
      console.error('Error fetching my permissions:', err);
    } finally {
      setLoading(false);
    }
  }, [clinic?.id, role, isAdmin]);

  useEffect(() => {
    if (!clinicLoading && !permLoading && clinic?.id && role) {
      fetchMyPermissions();
    }
  }, [clinicLoading, permLoading, clinic?.id, role, fetchMyPermissions]);

  // Check if user can view a tab
  const canViewTab = useCallback((tabKey: TabKey): boolean => {
    if (isAdmin) return true;
    const perm = tabPermissions.find(p => p.tab_key === tabKey);
    return perm?.can_view ?? false;
  }, [tabPermissions, isAdmin]);

  // Check if user can edit a tab
  const canEditTab = useCallback((tabKey: TabKey): boolean => {
    if (isAdmin) return true;
    const perm = tabPermissions.find(p => p.tab_key === tabKey);
    return perm?.can_edit ?? false;
  }, [tabPermissions, isAdmin]);

  // Check if user can export a tab
  const canExportTab = useCallback((tabKey: TabKey): boolean => {
    if (isAdmin) return true;
    const perm = tabPermissions.find(p => p.tab_key === tabKey);
    return perm?.can_export ?? false;
  }, [tabPermissions, isAdmin]);

  // Check if user can sign in a tab
  const canSignTab = useCallback((tabKey: TabKey): boolean => {
    if (isAdmin) return true;
    const perm = tabPermissions.find(p => p.tab_key === tabKey);
    return perm?.can_sign ?? false;
  }, [tabPermissions, isAdmin]);

  // Check if user can perform an action
  const canPerformAction = useCallback((actionKey: ActionKey): boolean => {
    if (isAdmin) return true;
    const perm = actionPermissions.find(p => p.action_key === actionKey);
    return perm?.allowed ?? false;
  }, [actionPermissions, isAdmin]);

  // Get visible tabs
  const getVisibleTabs = useCallback(() => {
    return MEDICAL_RECORD_TABS.filter(tab => canViewTab(tab.key));
  }, [canViewTab]);

  // Log denied action
  const logDeniedAction = useCallback(async (actionKey: ActionKey, patientId?: string) => {
    if (!clinic?.id) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('access_logs').insert({
        clinic_id: clinic.id,
        user_id: user.id,
        action: `permission_denied:${actionKey}`,
        resource: patientId ? `patient:${patientId}` : 'medical_record',
      });
    } catch (err) {
      console.error('Error logging denied action:', err);
    }
  }, [clinic?.id]);

  return {
    loading: loading || clinicLoading || permLoading,
    tabPermissions,
    actionPermissions,
    canViewTab,
    canEditTab,
    canExportTab,
    canSignTab,
    canPerformAction,
    getVisibleTabs,
    logDeniedAction,
    isAdmin,
  };
}
