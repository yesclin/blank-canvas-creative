// Configuration hooks (for Configurações > Prontuário)
export { useTabs, type TabConfig } from './useTabs';
export { useSpecialtyTabs, type SpecialtyTab } from './useSpecialtyTabs';
export { useTemplates, type Template, type TemplateInput, type TemplateType, type TemplateScope } from './useTemplates';
export { useFields, type Field, type FieldInput, type FieldType } from './useFields';
export { useDefaultTemplates } from './useDefaultTemplates';
export { useVisualSettings, type VisualSettings, type VisualSettingsInput, type LayoutMode, type LogoPosition } from './useVisualSettings';
export { useSecurity, type SecuritySettings, type SecurityInput } from './useSecurity';
export { useCustomProntuarioFields, type CustomProntuarioField, type CustomFieldInput, type CustomFieldType } from './useCustomProntuarioFields';

// Usage hooks (for Prontuário module)
export { useProntuarioConfig, type VisualConfig, type SecurityConfig } from './useProntuarioConfig';
export { useMedicalRecordEntries, type MedicalRecordEntry, type EntryInput } from './useMedicalRecordEntries';
export { useMedicalRecordFiles, type MedicalRecordFile, type FileInput } from './useMedicalRecordFiles';
export { useProntuarioData, type PatientRecord, type ClinicalAlert } from './useProntuarioData';
export { useMedicalRecordSignatures, type MedicalRecordSignature } from './useMedicalRecordSignatures';

// Clinical Timeline
export { useClinicalTimeline } from './useClinicalTimeline';

// Active Appointment (for edit control)
export { useActiveAppointment, useCanEditMedicalRecord, type ActiveAppointment } from './useActiveAppointment';

// Appointment Images (multi-upload gallery)
export { useAppointmentImages, type AppointmentImage, type ImageClassification } from './useAppointmentImages';

// Active Specialty (for tab filtering by specialty)
export { useActiveSpecialty, mapSpecialtyNameToKey, type SpecialtyKey, type SpecialtyOption } from './useActiveSpecialty';
export { 
  BASE_TABS, 
  SPECIALTY_TABS, 
  SPECIALTY_LABELS,
  YESCLIN_CLINICAL_BLOCKS,
  getVisibleTabsForSpecialty, 
  isTabVisibleForSpecialty,
  getClinicalBlockLabel,
  type ClinicalBlockKey,
} from './specialtyTabsConfig';

// Yesclin Supported Specialties (controlled system list)
export {
  YESCLIN_SUPPORTED_SPECIALTIES,
  YESCLIN_SPECIALTY_LABELS,
  getEnabledBlocksForSpecialty,
  isBlockEnabledForSpecialty,
  resolveSpecialtyKey,
  type YesclinSpecialty,
} from './yesclinSpecialties';

// Active Medical Record Modules (specialty-based module filtering)
export { 
  useActiveMedicalRecordModules, 
  useIsModuleAvailable 
} from './useActiveMedicalRecordModules';

// Specialty Capabilities (central mapping: blocks + modules + anamnesis)
export { useSpecialtyCapabilities, type SpecialtyCapabilitiesResult } from './useSpecialtyCapabilities';
export { 
  SPECIALTY_CAPABILITIES,
  getCapabilities,
  isBlockEnabled,
  getAnamnesisSlug,
  getDefaultModules,
  type SpecialtyCapability,
} from './specialtyCapabilities';

// Resolved Anamnesis Template (procedure → default → fallback)
export { useResolvedAnamnesisTemplate, type ResolvedTemplate, type TemplateOption } from './useResolvedAnamnesisTemplate';

// Intelligent Medical Record Context (appointment-based context with validations)
export {
  useIntelligentMedicalRecordContext,
  useCanSelectSpecialty,
  useSpecialtySelectionBlockedReason,
  type MedicalRecordContext,
} from './useIntelligentMedicalRecordContext';

// Clinical Data Access Control (patient-level security + logging)
export {
  useClinicalDataAccess as usePatientClinicalDataAccess,
  useLogMedicalRecordView,
  type ClinicalAccessAction,
} from './useClinicalDataAccess';

// Permission hooks (for granular access control)
export {
  useMedicalRecordPermissions,
  useCurrentUserMedicalRecordPermissions,
  MEDICAL_RECORD_TABS,
  MEDICAL_RECORD_ACTIONS,
  type TabPermission,
  type ActionPermission,
  type TabKey,
  type ActionKey,
} from './useMedicalRecordPermissions';
