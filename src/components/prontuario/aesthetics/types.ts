 // Tipos para o módulo de Estética / Harmonização Facial
 
 export type ProcedureType = 'toxin' | 'filler' | 'biostimulator';
 export type ViewType = 'frontal' | 'left_lateral' | 'right_lateral';
 export type SideType = 'left' | 'right' | 'center' | 'bilateral';
 export type ViewAngle = 'frontal' | 'left_profile' | 'right_profile' | 'left_45' | 'right_45';
 export type ConsentType = 'toxin' | 'filler' | 'biostimulator' | 'general';
export type MapType = 'general' | 'toxin';
export type ImageType = 'before' | 'after';

// Entidade pai: Mapa Facial
export interface FacialMap {
  id: string;
  clinic_id: string;
  patient_id: string;
  appointment_id?: string | null;
  professional_id?: string | null;
  map_type: MapType;
  general_notes?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
}
 
 export interface FacialMapApplication {
   id: string;
   clinic_id: string;
   patient_id: string;
   appointment_id?: string | null;
   professional_id?: string | null;
  facial_map_id?: string | null;
   procedure_type: ProcedureType;
   view_type: ViewType;
   position_x: number;
   position_y: number;
   muscle?: string | null;
   product_name: string;
   quantity: number;
   unit: string;
   side?: SideType | null;
   notes?: string | null;
   created_at: string;
   created_by?: string | null;
   updated_at: string;
 }
 
// Imagens vinculadas ao mapa facial
export interface FacialMapImage {
  id: string;
  clinic_id: string;
  facial_map_id: string;
  image_type: ImageType;
  image_url: string;
  image_date?: string | null;
  view_angle?: ViewAngle | null;
  notes?: string | null;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
}

 export interface AestheticBeforeAfter {
   id: string;
   clinic_id: string;
   patient_id: string;
   appointment_id?: string | null;
   procedure_id?: string | null;
   title: string;
   description?: string | null;
   procedure_type?: string | null;
   before_image_url?: string | null;
   before_image_date?: string | null;
   after_image_url?: string | null;
   after_image_date?: string | null;
   view_angle: ViewAngle;
   consent_for_marketing: boolean;
   created_at: string;
   created_by?: string | null;
   updated_at: string;
 }
 
 export interface AestheticConsentRecord {
   id: string;
   clinic_id: string;
   patient_id: string;
   appointment_id?: string | null;
   consent_type: ConsentType;
   term_title: string;
   term_content: string;
   term_version: string;
   accepted_at: string;
   ip_address?: string | null;
   user_agent?: string | null;
   signature_data?: string | null;
   created_by?: string | null;
 }
 
 // Labels
export const MAP_TYPE_LABELS: Record<MapType, string> = {
  general: 'Geral',
  toxin: 'Toxina Botulínica',
};

export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  before: 'Antes',
  after: 'Depois',
};

 export const PROCEDURE_TYPE_LABELS: Record<ProcedureType, string> = {
   toxin: 'Toxina Botulínica',
   filler: 'Preenchimento',
   biostimulator: 'Bioestimulador',
 };
 
 export const VIEW_TYPE_LABELS: Record<ViewType, string> = {
   frontal: 'Frontal',
   left_lateral: 'Lateral Esquerda',
   right_lateral: 'Lateral Direita',
 };
 
 export const SIDE_LABELS: Record<SideType, string> = {
   left: 'Esquerdo',
   right: 'Direito',
   center: 'Centro',
   bilateral: 'Bilateral',
 };
 
 export const VIEW_ANGLE_LABELS: Record<ViewAngle, string> = {
   frontal: 'Frontal',
   left_profile: 'Perfil Esquerdo',
   right_profile: 'Perfil Direito',
   left_45: '45° Esquerda',
   right_45: '45° Direita',
 };
 
 export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
   toxin: 'Toxina Botulínica',
   filler: 'Preenchimento Facial',
   biostimulator: 'Bioestimulador',
   general: 'Geral',
 };
 
 // Músculos faciais para toxina
export const FACIAL_MUSCLES: Array<{ id: string; name: string; region: string; description: string }> = [
  { id: 'frontalis', name: 'Frontal', region: 'Testa', description: 'Eleva as sobrancelhas e forma rugas horizontais na testa' },
  { id: 'procerus', name: 'Prócero', region: 'Glabela', description: 'Deprime a pele entre as sobrancelhas' },
  { id: 'corrugator', name: 'Corrugador do Supercílio', region: 'Glabela', description: 'Forma linhas verticais entre as sobrancelhas' },
  { id: 'orbicularis_oculi', name: 'Orbicular dos Olhos', region: 'Periorbital', description: 'Fecha as pálpebras e forma pés de galinha' },
  { id: 'nasalis', name: 'Nasal', region: 'Nariz', description: 'Comprime e dilata as narinas' },
  { id: 'levator_labii', name: 'Elevador do Lábio Superior', region: 'Nariz/Boca', description: 'Eleva o lábio superior e a asa do nariz' },
  { id: 'zygomaticus_major', name: 'Zigomático Maior', region: 'Bochecha', description: 'Puxa o canto da boca para cima (sorriso)' },
  { id: 'zygomaticus_minor', name: 'Zigomático Menor', region: 'Bochecha', description: 'Eleva o lábio superior' },
  { id: 'orbicularis_oris', name: 'Orbicular da Boca', region: 'Perioral', description: 'Fecha e projeta os lábios' },
  { id: 'depressor_anguli_oris', name: 'Depressor do Ângulo', region: 'Boca', description: 'Puxa o canto da boca para baixo' },
  { id: 'mentalis', name: 'Mentoniano', region: 'Queixo', description: 'Eleva e projeta o lábio inferior' },
  { id: 'platysma', name: 'Platisma', region: 'Pescoço', description: 'Tensiona a pele do pescoço' },
  { id: 'masseter', name: 'Masseter', region: 'Mandíbula', description: 'Músculo da mastigação' },
];
 
 // Produtos comuns
 export const COMMON_PRODUCTS = {
   toxin: [
     'Botox',
     'Dysport',
     'Xeomin',
     'Jeuveau',
     'Daxxify',
   ],
   filler: [
     'Juvederm Voluma',
     'Juvederm Volift',
     'Juvederm Volbella',
     'Restylane',
     'Restylane Lyft',
     'Radiesse',
     'Belotero',
   ],
   biostimulator: [
     'Sculptra',
     'Radiesse',
     'Ellansé',
   ],
 };