/**
 * ETAPA 8 — Testes de Consistência do Sistema de Especialidades
 * 
 * Checklist de validação ponta-a-ponta:
 * 1. Whitelist oficial é respeitada em todos os pontos
 * 2. Capabilities matrix cobre todas as especialidades oficiais
 * 3. Filtros de procedimento por especialidade
 * 4. Contexto do prontuário isolado do global
 * 5. Backend validation function coerente com whitelist
 */

import { describe, it, expect } from 'vitest';
import {
  OFFICIAL_SPECIALTIES,
  OFFICIAL_SPECIALTY_NAMES,
  isOfficialSpecialty,
  filterOfficialSpecialties,
  getSpecialtySlug,
} from '@/constants/officialSpecialties';
import {
  SPECIALTY_CAPABILITIES,
  getCapabilities,
  isBlockEnabled,
  getAnamnesisSlug,
  getDefaultModules,
} from '@/hooks/prontuario/specialtyCapabilities';

// ─── 1. WHITELIST OFICIAL ──────────────────────────────────────────────────

describe('Whitelist de Especialidades Oficiais', () => {
  it('deve conter exatamente 9 especialidades', () => {
    expect(OFFICIAL_SPECIALTIES).toHaveLength(9);
  });

  it('deve incluir todas as especialidades obrigatórias', () => {
    const expected = [
      'Clínica Geral',
      'Psicologia',
      'Nutrição',
      'Fisioterapia',
      'Pilates',
      'Estética / Harmonização Facial',
      'Odontologia',
      'Dermatologia',
      'Pediatria',
    ];
    expected.forEach(name => {
      expect(OFFICIAL_SPECIALTY_NAMES).toContain(name);
    });
  });

  it('deve rejeitar especialidades fora da whitelist', () => {
    expect(isOfficialSpecialty('Cardiologia')).toBe(false);
    expect(isOfficialSpecialty('Ortopedia')).toBe(false);
    expect(isOfficialSpecialty('')).toBe(false);
  });

  it('deve aceitar nomes com case diferente e espaços extras', () => {
    expect(isOfficialSpecialty('psicologia')).toBe(true);
    expect(isOfficialSpecialty(' Nutrição ')).toBe(true);
    expect(isOfficialSpecialty('ODONTOLOGIA')).toBe(true);
  });

  it('cada especialidade deve ter slug definido', () => {
    OFFICIAL_SPECIALTIES.forEach(s => {
      expect(s.slug).toBeTruthy();
      expect(s.slug).not.toContain(' ');
    });
  });

  it('getSpecialtySlug deve retornar null para nomes inválidos', () => {
    expect(getSpecialtySlug('Cardiologia')).toBeNull();
    expect(getSpecialtySlug('')).toBeNull();
  });

  it('filterOfficialSpecialties deve remover itens fora da whitelist', () => {
    const input = [
      { name: 'Psicologia', id: '1' },
      { name: 'Cardiologia', id: '2' },
      { name: 'Nutrição', id: '3' },
    ];
    const result = filterOfficialSpecialties(input);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toEqual(['Psicologia', 'Nutrição']);
  });
});

// ─── 2. CAPABILITIES MATRIX ────────────────────────────────────────────────

describe('Matriz de Capabilities por Especialidade', () => {
  const officialKeys = [
    'geral', 'psicologia', 'nutricao', 'fisioterapia',
    'pilates', 'estetica', 'odontologia', 'dermatologia', 'pediatria',
  ] as const;

  it('deve ter capabilities para todas as 9 especialidades oficiais', () => {
    officialKeys.forEach(key => {
      expect(SPECIALTY_CAPABILITIES[key]).toBeDefined();
      expect(SPECIALTY_CAPABILITIES[key].label).toBeTruthy();
    });
  });

  it('toda especialidade deve ter pelo menos "resumo" nos blocos', () => {
    officialKeys.forEach(key => {
      const cap = getCapabilities(key);
      const hasResumoLike = cap.enabledBlocks.some(b => b.includes('resumo'));
      expect(hasResumoLike).toBe(true);
    });
  });

  it('toda especialidade deve ter anamnesisSlug definido', () => {
    officialKeys.forEach(key => {
      expect(getAnamnesisSlug(key)).toBeTruthy();
    });
  });

  it('toda especialidade deve ter módulos padrão não vazios', () => {
    officialKeys.forEach(key => {
      expect(getDefaultModules(key).length).toBeGreaterThan(0);
    });
  });

  it('fallback para "geral" quando key é desconhecida', () => {
    const result = getCapabilities('inexistente' as any);
    expect(result.label).toBe('Clínica Geral');
  });

  // Specialty-specific checks
  it('Psicologia deve ter bloco "instrumentos"', () => {
    expect(isBlockEnabled('instrumentos', 'psicologia')).toBe(true);
  });

  it('Psicologia NÃO deve ter bloco "odontograma"', () => {
    expect(isBlockEnabled('odontograma', 'psicologia')).toBe(false);
  });

  it('Odontologia deve ter bloco "odontograma"', () => {
    expect(isBlockEnabled('odontograma', 'odontologia')).toBe(true);
  });

  it('Nutrição deve ter bloco "plano_alimentar"', () => {
    expect(isBlockEnabled('plano_alimentar', 'nutricao')).toBe(true);
  });

  it('Nutrição NÃO deve ter bloco "prescricoes"', () => {
    expect(isBlockEnabled('prescricoes', 'nutricao')).toBe(false);
  });

  it('Pediatria deve ter bloco "vacinacao"', () => {
    expect(isBlockEnabled('vacinacao', 'pediatria')).toBe(true);
  });

  it('Estética deve ter bloco "facial_map"', () => {
    expect(isBlockEnabled('facial_map', 'estetica')).toBe(true);
  });
});

// ─── 3. ISOLAMENTO DE CONTEXTO ────────────────────────────────────────────

describe('Isolamento de Contexto Especialidade', () => {
  it('cada especialidade produz conjunto único de blocos', () => {
    const psico = getCapabilities('psicologia').enabledBlocks;
    const nutri = getCapabilities('nutricao').enabledBlocks;
    const odonto = getCapabilities('odontologia').enabledBlocks;

    // Devem ser diferentes entre si
    expect(psico).not.toEqual(nutri);
    expect(nutri).not.toEqual(odonto);
    expect(psico).not.toEqual(odonto);
  });

  it('nenhum bloco exclusivo de uma especialidade aparece em outra incompatível', () => {
    // Odontograma é exclusivo de Odontologia entre as oficiais
    const nonOdonto = ['geral', 'psicologia', 'nutricao', 'fisioterapia', 'pilates', 'pediatria'] as const;
    nonOdonto.forEach(key => {
      expect(isBlockEnabled('odontograma', key)).toBe(false);
    });

    // Plano alimentar é exclusivo de Nutrição
    const nonNutri = ['geral', 'psicologia', 'fisioterapia', 'pilates', 'odontologia', 'pediatria'] as const;
    nonNutri.forEach(key => {
      expect(isBlockEnabled('plano_alimentar', key)).toBe(false);
    });
  });
});

// ─── 4. COERÊNCIA SLUG ↔ CAPABILITIES ─────────────────────────────────────

describe('Coerência Slug x Capabilities', () => {
  it('todo slug oficial deve mapear para uma capability válida', () => {
    const slugToKeyMap: Record<string, string> = {
      'clinica-geral': 'geral',
      'psicologia': 'psicologia',
      'nutricao': 'nutricao',
      'fisioterapia': 'fisioterapia',
      'pilates': 'pilates',
      'estetica-harmonizacao': 'estetica',
      'odontologia': 'odontologia',
      'dermatologia': 'dermatologia',
      'pediatria': 'pediatria',
    };

    OFFICIAL_SPECIALTIES.forEach(spec => {
      const capKey = slugToKeyMap[spec.slug];
      expect(capKey).toBeDefined();
      const cap = SPECIALTY_CAPABILITIES[capKey as keyof typeof SPECIALTY_CAPABILITIES];
      expect(cap).toBeDefined();
      expect(cap.anamnesisSlug).toBeTruthy();
    });
  });
});
