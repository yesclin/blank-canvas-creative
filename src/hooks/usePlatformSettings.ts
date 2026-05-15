import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logPlatformAction } from '@/lib/superAdminAudit';

export type SettingRow = {
  key: string;
  value: any;
  description: string | null;
  category: string;
  updated_at: string;
};

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  is_essential: boolean;
  is_premium: boolean;
  is_experimental: boolean;
  allow_clinic_override: boolean;
  impact_level: string;
  updated_at: string;
};

export type MaintenanceWindow = {
  id: string;
  title: string;
  message: string | null;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  allow_super_admin_access: boolean;
  allow_clinic_access: boolean;
  show_banner: boolean;
  created_at: string;
  updated_at: string;
};

export const DEFAULTS: Record<string, any> = {
  'platform.name': 'YesClin',
  'platform.support_email': 'suporte@yesclin.com',
  'platform.public_url': 'https://yesclin.com',
  'platform.app_url': 'https://app.yesclin.com',
  'platform.support_url': 'https://yesclin.com/suporte',
  'platform.timezone': 'America/Sao_Paulo',
  'platform.locale': 'pt-BR',
  'platform.currency': 'BRL',
  'platform.status': 'operational',
  'platform.primary_color': '#0F766E',
  'notice.enabled': false,
  'notice.title': '',
  'notice.message': '',
  'notice.severity': 'info',
  'notice.audience': 'all',
  'defaults.plan_slug': 'basic',
  'defaults.trial_days': 14,
  'defaults.max_professionals': 5,
  'defaults.max_patients': 500,
  'defaults.max_appointments_monthly': 1000,
  'defaults.max_storage_mb': 5000,
  'defaults.specialty': 'general',
  'defaults.create_owner_professional': true,
  'defaults.create_anamnesis_templates': true,
  'defaults.create_finance_categories': true,
  'defaults.create_appointment_statuses': true,
  'defaults.create_appointment_types': true,
  'defaults.create_payment_methods': true,
  'limits.min_professionals': 1,
  'limits.min_patients': 50,
  'limits.min_appointments': 100,
  'limits.min_storage_mb': 500,
  'limits.min_whatsapp_messages': 100,
  'limits.max_pending_invites': 20,
  'limits.max_users_per_clinic': 50,
  'limits.basic_specialties': 2,
  'limits.max_integrations': 10,
  'limits.default_max_professionals': 5,
  'limits.default_max_patients': 500,
  'limits.default_max_appointments_monthly': 1000,
  'security.session_timeout_minutes': 60,
  'security.require_strong_password': true,
  'security.require_email_confirmation': false,
  'security.lock_after_invalid_attempts': true,
  'security.max_invalid_attempts': 5,
  'security.lock_duration_minutes': 15,
  'security.allow_multi_session': true,
  'security.require_lgpd_onboarding': true,
  'security.lgpd_default_enforcement': true,
  'security.log_sensitive_access': true,
  'security.log_admin_actions': true,
  'security.require_2fa_for_admins': false,
  'security.password_min_length': 8,
  'audit.enabled': true,
  'audit.log_login': true,
  'audit.log_plan_change': true,
  'audit.log_subscription_change': true,
  'audit.log_permission_change': true,
  'audit.log_settings_change': true,
  'audit.retention_audit_days': 365,
  'audit.retention_access_days': 180,
  'audit.retention_occurrences_days': 730,
  'audit.alert_min_severity': 'warning',
  'audit.log_retention_days': 365,
  'audit.export_enabled': true,
  'integrations.whatsapp_provider': 'uazapi',
  'integrations.whatsapp_base_url': '',
  'integrations.global_webhook': '',
  'integrations.timeout_seconds': 30,
  'integrations.max_retries': 3,
  'integrations.retry_interval_seconds': 60,
  'integrations.email_enabled': true,
  'integrations.sms_enabled': false,
  'integrations.payment_gateway_enabled': false,
  'branding.brand_name': 'YesClin',
  'branding.logo_url': '',
  'branding.primary_color': '#0F766E',
  'branding.secondary_color': '#0EA5E9',
  'branding.accent_color': '#F59E0B',
  'branding.footer_text': '© YesClin',
  'branding.terms_url': 'https://yesclin.com/termos',
  'branding.privacy_url': 'https://yesclin.com/privacidade',
  'trial.duration_days': 14,
  'trial.auto_block_after_overdue_days': 7,
  'email.from_name': 'YesClin',
  'email.from_address': 'no-reply@yesclin.com',
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [a, b, c] = await Promise.allSettled([
      supabase.from('platform_settings' as any).select('*').order('category').order('key'),
      supabase.from('platform_feature_flags' as any).select('*').order('category').order('name'),
      supabase.from('platform_maintenance_windows' as any).select('*').order('created_at', { ascending: false }),
    ]);
    if (a.status === 'fulfilled' && !a.value.error) setSettings((a.value.data as any) ?? []);
    if (b.status === 'fulfilled' && !b.value.error) setFlags((b.value.data as any) ?? []);
    if (c.status === 'fulfilled' && !c.value.error) setWindows((c.value.data as any) ?? []);
    const errs = [a, b, c].filter((r) => r.status === 'rejected').map((r: any) => r.reason?.message).join(' / ');
    if (errs) setError(errs);
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const settingsMap = useMemo(() => {
    const m: Record<string, any> = {};
    for (const s of settings) m[s.key] = s.value;
    return m;
  }, [settings]);

  const updateSettings = useCallback(async (changes: Record<string, any>) => {
    const keys = Object.keys(changes);
    for (const key of keys) {
      const { error: err } = await supabase
        .from('platform_settings' as any)
        .update({ value: changes[key] })
        .eq('key', key);
      if (err) throw err;
    }
    await logPlatformAction({ action: 'platform_settings.update', metadata: { keys, count: keys.length } });
  }, []);

  const updateFeatureFlag = useCallback(async (id: string, patch: Partial<FeatureFlag>) => {
    const { error: err } = await supabase.from('platform_feature_flags' as any).update(patch).eq('id', id);
    if (err) throw err;
    await logPlatformAction({ action: 'platform_feature_flag.update', target_type: 'feature_flag', target_id: id, metadata: patch as any });
  }, []);

  const upsertMaintenance = useCallback(async (data: Partial<MaintenanceWindow>) => {
    if (data.id) {
      const { error: err } = await supabase.from('platform_maintenance_windows' as any).update(data).eq('id', data.id);
      if (err) throw err;
      await logPlatformAction({ action: 'platform_maintenance.update', target_type: 'maintenance', target_id: data.id });
    } else {
      const { error: err } = await supabase.from('platform_maintenance_windows' as any).insert(data as any);
      if (err) throw err;
      await logPlatformAction({ action: 'platform_maintenance.create', metadata: data as any });
    }
  }, []);

  const deleteMaintenance = useCallback(async (id: string) => {
    const { error: err } = await supabase.from('platform_maintenance_windows' as any).delete().eq('id', id);
    if (err) throw err;
    await logPlatformAction({ action: 'platform_maintenance.delete', target_type: 'maintenance', target_id: id });
  }, []);

  const resetToDefaults = useCallback(async () => {
    const changes: Record<string, any> = {};
    for (const s of settings) {
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, s.key)) {
        if (JSON.stringify(s.value) !== JSON.stringify(DEFAULTS[s.key])) {
          changes[s.key] = DEFAULTS[s.key];
        }
      }
    }
    if (Object.keys(changes).length > 0) {
      await updateSettings(changes);
      await logPlatformAction({ action: 'platform_settings.reset_defaults', metadata: { count: Object.keys(changes).length } });
    }
    await refetch();
  }, [settings, updateSettings, refetch]);

  return {
    settings, settingsMap, flags, windows,
    loading, error, refetch,
    updateSettings, updateFeatureFlag, upsertMaintenance, deleteMaintenance, resetToDefaults,
  };
}
