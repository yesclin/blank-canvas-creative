import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClinicData } from '@/hooks/useClinicData';
import { toast } from 'sonner';

export interface ConsentTerm {
  id: string;
  clinic_id: string;
  title: string;
  content: string;
  version: string;
  is_active: boolean;
  parent_term_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConsentTermInput {
  title: string;
  content: string;
  version?: string;
}

export function useConsentTerms() {
  const { clinic, isLoading: clinicLoading } = useClinicData();
  const [terms, setTerms] = useState<ConsentTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTerms = useCallback(async () => {
    if (!clinic?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('consent_terms')
        .select('*')
        .eq('clinic_id', clinic.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTerms((data || []) as ConsentTerm[]);
    } catch (err) {
      console.error('Error fetching consent terms:', err);
      toast.error('Erro ao carregar termos de consentimento');
    } finally {
      setLoading(false);
    }
  }, [clinic?.id]);

  useEffect(() => {
    if (!clinicLoading && clinic?.id) {
      fetchTerms();
    }
  }, [clinicLoading, clinic?.id, fetchTerms]);

  const createTerm = async (input: ConsentTermInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { error } = await supabase.from('consent_terms').insert({
        clinic_id: clinic.id,
        title: input.title,
        content: input.content,
        version: input.version || '1.0',
        is_active: false, // New terms start as inactive
      });

      if (error) throw error;
      await fetchTerms();
      toast.success('Termo criado com sucesso');
      return true;
    } catch (err) {
      console.error('Error creating consent term:', err);
      toast.error('Erro ao criar termo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const createNewVersion = async (parentTermId: string, input: ConsentTermInput): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      // Get parent term to calculate new version
      const parentTerm = terms.find(t => t.id === parentTermId);
      if (!parentTerm) throw new Error('Termo original não encontrado');

      // Calculate new version (increment minor version)
      const [major, minor] = parentTerm.version.split('.').map(Number);
      const newVersion = `${major}.${minor + 1}`;

      const { error } = await supabase.from('consent_terms').insert({
        clinic_id: clinic.id,
        title: input.title,
        content: input.content,
        version: newVersion,
        is_active: false,
        parent_term_id: parentTermId,
      });

      if (error) throw error;
      await fetchTerms();
      toast.success(`Nova versão ${newVersion} criada`);
      return true;
    } catch (err) {
      console.error('Error creating new version:', err);
      toast.error('Erro ao criar nova versão');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const activateTerm = async (termId: string): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      // Get the term to activate
      const termToActivate = terms.find(t => t.id === termId);
      if (!termToActivate) throw new Error('Termo não encontrado');

      // Deactivate all versions of the same term (by title or parent chain)
      const relatedTermIds = terms
        .filter(t => t.title === termToActivate.title || t.parent_term_id === termToActivate.parent_term_id || t.id === termToActivate.parent_term_id)
        .map(t => t.id);

      if (relatedTermIds.length > 0) {
        await supabase
          .from('consent_terms')
          .update({ is_active: false })
          .in('id', relatedTermIds);
      }

      // Activate the selected term
      const { error } = await supabase
        .from('consent_terms')
        .update({ is_active: true })
        .eq('id', termId);

      if (error) throw error;
      await fetchTerms();
      toast.success('Termo ativado com sucesso');
      return true;
    } catch (err) {
      console.error('Error activating term:', err);
      toast.error('Erro ao ativar termo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deactivateTerm = async (termId: string): Promise<boolean> => {
    if (!clinic?.id) return false;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('consent_terms')
        .update({ is_active: false })
        .eq('id', termId);

      if (error) throw error;
      await fetchTerms();
      toast.success('Termo desativado');
      return true;
    } catch (err) {
      console.error('Error deactivating term:', err);
      toast.error('Erro ao desativar termo');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getVersionHistory = (termId: string): ConsentTerm[] => {
    const term = terms.find(t => t.id === termId);
    if (!term) return [];

    // Find all versions of this term (same title or connected by parent_term_id)
    const versions = terms.filter(t => 
      t.title === term.title || 
      t.parent_term_id === termId ||
      t.id === term.parent_term_id ||
      (term.parent_term_id && t.parent_term_id === term.parent_term_id)
    );

    return versions.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  return {
    terms,
    loading: loading || clinicLoading,
    saving,
    fetchTerms,
    createTerm,
    createNewVersion,
    activateTerm,
    deactivateTerm,
    getVersionHistory,
  };
}
