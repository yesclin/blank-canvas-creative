/**
 * Extended field type definitions for dynamic anamnese templates.
 */

export interface VisualCardOption {
  id: string;
  label: string;
  description?: string;
  image_placeholder_key?: string;
  image_url?: string | null;
  allow_future_upload?: boolean;
  display_order?: number;
}

export interface FieldConfig {
  columns?: number;
  selection?: 'single' | 'multiple';
  options?: VisualCardOption[];
  rows?: { id: string; label: string; description?: string; extra?: string }[];
  selects?: { id: string; label: string; options: string[] }[];
  sections?: { id: string; label: string; fields: string[] }[];
  unit?: string;
  min?: number;
  max?: number;
  autoCalculate?: string;
  placeholder?: string;
  accept?: string;
}

export interface DynamicField {
  id: string;
  type:
    | 'rich_text'
    | 'textarea'
    | 'text'
    | 'number'
    | 'radio'
    | 'select'
    | 'visual_card_grid'
    | 'clinical_table_choice'
    | 'select_row'
    | 'accordion_measurements'
    | 'bmi_calculator'
    | 'image_carousel'
    | 'image_upload'
    | 'body_type_selector'
    | 'body_type_carousel'
    | 'fitzpatrick_scale';
  label: string;
  section?: string;
  required?: boolean;
  config?: FieldConfig;
  options?: string[];
  placeholder?: string;
}

export type DynamicFormValues = Record<string, unknown>;
