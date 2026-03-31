// WHO Child Growth Standards 0-60 months (0-5 years)
// Simplified percentile data: P3, P15, P50, P85, P97
// Source: WHO Child Growth Standards (simplified/approximated for clinical display)

export interface WHODataPoint {
  age_months: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

// ========== WEIGHT-FOR-AGE (kg) ==========

export const WEIGHT_BOYS: WHODataPoint[] = [
  { age_months: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.4 },
  { age_months: 1, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.8 },
  { age_months: 2, p3: 4.3, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.1 },
  { age_months: 3, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.2, p97: 8.0 },
  { age_months: 4, p3: 5.6, p15: 6.2, p50: 7.0, p85: 7.8, p97: 8.7 },
  { age_months: 5, p3: 6.0, p15: 6.7, p50: 7.5, p85: 8.4, p97: 9.3 },
  { age_months: 6, p3: 6.4, p15: 7.1, p50: 7.9, p85: 8.8, p97: 9.8 },
  { age_months: 9, p3: 7.1, p15: 7.9, p50: 8.9, p85: 9.9, p97: 10.9 },
  { age_months: 12, p3: 7.7, p15: 8.6, p50: 9.6, p85: 10.8, p97: 11.8 },
  { age_months: 15, p3: 8.3, p15: 9.2, p50: 10.3, p85: 11.5, p97: 12.6 },
  { age_months: 18, p3: 8.8, p15: 9.8, p50: 10.9, p85: 12.2, p97: 13.4 },
  { age_months: 24, p3: 9.7, p15: 10.8, p50: 12.2, p85: 13.6, p97: 15.0 },
  { age_months: 30, p3: 10.5, p15: 11.8, p50: 13.3, p85: 14.9, p97: 16.4 },
  { age_months: 36, p3: 11.3, p15: 12.7, p50: 14.3, p85: 16.2, p97: 17.8 },
  { age_months: 42, p3: 12.0, p15: 13.5, p50: 15.3, p85: 17.3, p97: 19.1 },
  { age_months: 48, p3: 12.7, p15: 14.3, p50: 16.3, p85: 18.5, p97: 20.5 },
  { age_months: 54, p3: 13.4, p15: 15.1, p50: 17.3, p85: 19.6, p97: 21.8 },
  { age_months: 60, p3: 14.1, p15: 15.9, p50: 18.3, p85: 20.8, p97: 23.2 },
];

export const WEIGHT_GIRLS: WHODataPoint[] = [
  { age_months: 0, p3: 2.4, p15: 2.8, p50: 3.2, p85: 3.7, p97: 4.2 },
  { age_months: 1, p3: 3.2, p15: 3.6, p50: 4.2, p85: 4.8, p97: 5.5 },
  { age_months: 2, p3: 3.9, p15: 4.5, p50: 5.1, p85: 5.8, p97: 6.6 },
  { age_months: 3, p3: 4.5, p15: 5.2, p50: 5.8, p85: 6.6, p97: 7.5 },
  { age_months: 4, p3: 5.0, p15: 5.7, p50: 6.4, p85: 7.3, p97: 8.2 },
  { age_months: 5, p3: 5.4, p15: 6.1, p50: 6.9, p85: 7.8, p97: 8.8 },
  { age_months: 6, p3: 5.7, p15: 6.5, p50: 7.3, p85: 8.2, p97: 9.3 },
  { age_months: 9, p3: 6.5, p15: 7.3, p50: 8.2, p85: 9.3, p97: 10.4 },
  { age_months: 12, p3: 7.0, p15: 7.9, p50: 8.9, p85: 10.1, p97: 11.3 },
  { age_months: 15, p3: 7.6, p15: 8.5, p50: 9.6, p85: 10.9, p97: 12.1 },
  { age_months: 18, p3: 8.1, p15: 9.1, p50: 10.2, p85: 11.6, p97: 12.9 },
  { age_months: 24, p3: 9.0, p15: 10.2, p50: 11.5, p85: 13.0, p97: 14.6 },
  { age_months: 30, p3: 9.9, p15: 11.1, p50: 12.7, p85: 14.4, p97: 16.2 },
  { age_months: 36, p3: 10.8, p15: 12.1, p50: 13.9, p85: 15.8, p97: 17.8 },
  { age_months: 42, p3: 11.6, p15: 13.0, p50: 15.0, p85: 17.2, p97: 19.4 },
  { age_months: 48, p3: 12.3, p15: 13.9, p50: 16.1, p85: 18.5, p97: 21.0 },
  { age_months: 54, p3: 13.0, p15: 14.8, p50: 17.2, p85: 19.9, p97: 22.6 },
  { age_months: 60, p3: 13.7, p15: 15.7, p50: 18.2, p85: 21.2, p97: 24.2 },
];

// ========== LENGTH/HEIGHT-FOR-AGE (cm) ==========

export const HEIGHT_BOYS: WHODataPoint[] = [
  { age_months: 0, p3: 46.1, p15: 47.5, p50: 49.9, p85: 51.8, p97: 53.7 },
  { age_months: 1, p3: 50.8, p15: 52.2, p50: 54.7, p85: 56.7, p97: 58.6 },
  { age_months: 2, p3: 54.4, p15: 55.9, p50: 58.4, p85: 60.6, p97: 62.4 },
  { age_months: 3, p3: 57.3, p15: 58.8, p50: 61.4, p85: 63.5, p97: 65.5 },
  { age_months: 4, p3: 59.7, p15: 61.2, p50: 63.9, p85: 66.0, p97: 68.0 },
  { age_months: 5, p3: 61.7, p15: 63.2, p50: 65.9, p85: 68.0, p97: 70.1 },
  { age_months: 6, p3: 63.3, p15: 65.0, p50: 67.6, p85: 69.8, p97: 71.9 },
  { age_months: 9, p3: 67.5, p15: 69.2, p50: 72.0, p85: 74.2, p97: 76.5 },
  { age_months: 12, p3: 71.0, p15: 72.8, p50: 75.7, p85: 78.1, p97: 80.5 },
  { age_months: 15, p3: 74.1, p15: 76.0, p50: 79.1, p85: 81.7, p97: 84.2 },
  { age_months: 18, p3: 76.9, p15: 78.9, p50: 82.3, p85: 85.0, p97: 87.7 },
  { age_months: 24, p3: 81.7, p15: 84.1, p50: 87.8, p85: 90.9, p97: 93.9 },
  { age_months: 30, p3: 85.6, p15: 88.2, p50: 92.2, p85: 95.5, p97: 98.7 },
  { age_months: 36, p3: 89.0, p15: 91.9, p50: 96.1, p85: 99.8, p97: 103.1 },
  { age_months: 42, p3: 92.0, p15: 95.1, p50: 99.7, p85: 103.6, p97: 107.2 },
  { age_months: 48, p3: 94.9, p15: 98.1, p50: 103.3, p85: 107.2, p97: 111.0 },
  { age_months: 54, p3: 97.8, p15: 101.1, p50: 106.7, p85: 110.7, p97: 114.6 },
  { age_months: 60, p3: 100.7, p15: 104.1, p50: 110.0, p85: 114.2, p97: 118.0 },
];

export const HEIGHT_GIRLS: WHODataPoint[] = [
  { age_months: 0, p3: 45.4, p15: 46.8, p50: 49.1, p85: 51.0, p97: 52.9 },
  { age_months: 1, p3: 49.8, p15: 51.2, p50: 53.7, p85: 55.6, p97: 57.6 },
  { age_months: 2, p3: 53.0, p15: 54.4, p50: 57.1, p85: 59.1, p97: 61.1 },
  { age_months: 3, p3: 55.6, p15: 57.1, p50: 59.8, p85: 61.9, p97: 64.0 },
  { age_months: 4, p3: 57.8, p15: 59.3, p50: 62.1, p85: 64.3, p97: 66.4 },
  { age_months: 5, p3: 59.6, p15: 61.2, p50: 64.0, p85: 66.2, p97: 68.5 },
  { age_months: 6, p3: 61.2, p15: 62.8, p50: 65.7, p85: 68.0, p97: 70.3 },
  { age_months: 9, p3: 65.3, p15: 67.0, p50: 70.1, p85: 72.6, p97: 75.0 },
  { age_months: 12, p3: 68.9, p15: 70.8, p50: 74.0, p85: 76.7, p97: 79.2 },
  { age_months: 15, p3: 72.0, p15: 73.9, p50: 77.5, p85: 80.2, p97: 83.0 },
  { age_months: 18, p3: 74.9, p15: 77.0, p50: 80.7, p85: 83.6, p97: 86.5 },
  { age_months: 24, p3: 80.0, p15: 82.2, p50: 86.4, p85: 89.6, p97: 92.5 },
  { age_months: 30, p3: 84.0, p15: 86.6, p50: 91.1, p85: 94.6, p97: 97.7 },
  { age_months: 36, p3: 87.4, p15: 90.4, p50: 95.1, p85: 99.0, p97: 102.7 },
  { age_months: 42, p3: 90.4, p15: 93.6, p50: 98.8, p85: 103.0, p97: 107.0 },
  { age_months: 48, p3: 93.4, p15: 96.7, p50: 102.7, p85: 106.8, p97: 111.0 },
  { age_months: 54, p3: 96.4, p15: 99.9, p50: 106.2, p85: 110.5, p97: 114.7 },
  { age_months: 60, p3: 99.4, p15: 103.0, p50: 109.4, p85: 114.0, p97: 118.2 },
];

// ========== HEAD CIRCUMFERENCE-FOR-AGE (cm) ==========

export const HC_BOYS: WHODataPoint[] = [
  { age_months: 0, p3: 31.9, p15: 33.0, p50: 34.5, p85: 35.8, p97: 36.9 },
  { age_months: 1, p3: 34.9, p15: 36.0, p50: 37.3, p85: 38.4, p97: 39.6 },
  { age_months: 2, p3: 36.8, p15: 37.9, p50: 39.1, p85: 40.3, p97: 41.5 },
  { age_months: 3, p3: 38.1, p15: 39.3, p50: 40.5, p85: 41.7, p97: 42.9 },
  { age_months: 4, p3: 39.2, p15: 40.4, p50: 41.6, p85: 42.8, p97: 44.0 },
  { age_months: 5, p3: 40.1, p15: 41.2, p50: 42.6, p85: 43.8, p97: 44.9 },
  { age_months: 6, p3: 40.9, p15: 42.0, p50: 43.3, p85: 44.6, p97: 45.8 },
  { age_months: 9, p3: 42.3, p15: 43.4, p50: 44.8, p85: 46.1, p97: 47.4 },
  { age_months: 12, p3: 43.5, p15: 44.5, p50: 46.1, p85: 47.4, p97: 48.6 },
  { age_months: 18, p3: 44.7, p15: 45.9, p50: 47.4, p85: 48.8, p97: 50.0 },
  { age_months: 24, p3: 45.5, p15: 46.6, p50: 48.3, p85: 49.5, p97: 50.8 },
  { age_months: 36, p3: 46.6, p15: 47.7, p50: 49.5, p85: 50.8, p97: 52.0 },
  { age_months: 48, p3: 47.3, p15: 48.4, p50: 50.3, p85: 51.5, p97: 52.7 },
  { age_months: 60, p3: 47.7, p15: 48.8, p50: 50.7, p85: 52.0, p97: 53.2 },
];

export const HC_GIRLS: WHODataPoint[] = [
  { age_months: 0, p3: 31.5, p15: 32.4, p50: 33.9, p85: 35.1, p97: 36.2 },
  { age_months: 1, p3: 34.2, p15: 35.2, p50: 36.5, p85: 37.7, p97: 38.9 },
  { age_months: 2, p3: 35.8, p15: 36.9, p50: 38.3, p85: 39.5, p97: 40.7 },
  { age_months: 3, p3: 37.1, p15: 38.1, p50: 39.5, p85: 40.8, p97: 42.0 },
  { age_months: 4, p3: 38.1, p15: 39.1, p50: 40.6, p85: 41.8, p97: 43.0 },
  { age_months: 5, p3: 38.9, p15: 40.0, p50: 41.5, p85: 42.7, p97: 43.9 },
  { age_months: 6, p3: 39.6, p15: 40.7, p50: 42.2, p85: 43.5, p97: 44.6 },
  { age_months: 9, p3: 41.2, p15: 42.2, p50: 43.8, p85: 45.1, p97: 46.3 },
  { age_months: 12, p3: 42.2, p15: 43.3, p50: 44.9, p85: 46.3, p97: 47.5 },
  { age_months: 18, p3: 43.6, p15: 44.6, p50: 46.2, p85: 47.6, p97: 48.8 },
  { age_months: 24, p3: 44.3, p15: 45.4, p50: 47.2, p85: 48.5, p97: 49.8 },
  { age_months: 36, p3: 45.5, p15: 46.6, p50: 48.5, p85: 49.8, p97: 51.0 },
  { age_months: 48, p3: 46.1, p15: 47.2, p50: 49.3, p85: 50.5, p97: 51.7 },
  { age_months: 60, p3: 46.5, p15: 47.7, p50: 49.7, p85: 51.0, p97: 52.2 },
];

// ========== BMI-FOR-AGE ==========

export const BMI_BOYS: WHODataPoint[] = [
  { age_months: 0, p3: 11.0, p15: 12.2, p50: 13.4, p85: 14.8, p97: 16.2 },
  { age_months: 3, p3: 13.6, p15: 14.7, p50: 16.2, p85: 17.5, p97: 18.7 },
  { age_months: 6, p3: 14.0, p15: 15.0, p50: 16.6, p85: 17.9, p97: 19.0 },
  { age_months: 9, p3: 13.8, p15: 14.8, p50: 16.3, p85: 17.7, p97: 18.9 },
  { age_months: 12, p3: 13.4, p15: 14.4, p50: 15.8, p85: 17.3, p97: 18.5 },
  { age_months: 18, p3: 12.9, p15: 13.8, p50: 15.3, p85: 16.7, p97: 18.0 },
  { age_months: 24, p3: 12.7, p15: 13.6, p50: 15.0, p85: 16.4, p97: 17.7 },
  { age_months: 36, p3: 12.4, p15: 13.3, p50: 14.7, p85: 16.2, p97: 17.6 },
  { age_months: 48, p3: 12.3, p15: 13.2, p50: 14.5, p85: 16.1, p97: 17.5 },
  { age_months: 60, p3: 12.1, p15: 13.0, p50: 14.4, p85: 16.0, p97: 17.6 },
];

export const BMI_GIRLS: WHODataPoint[] = [
  { age_months: 0, p3: 10.8, p15: 12.0, p50: 13.3, p85: 14.6, p97: 15.8 },
  { age_months: 3, p3: 13.2, p15: 14.2, p50: 15.7, p85: 17.0, p97: 18.2 },
  { age_months: 6, p3: 13.5, p15: 14.5, p50: 16.0, p85: 17.3, p97: 18.5 },
  { age_months: 9, p3: 13.3, p15: 14.3, p50: 15.8, p85: 17.2, p97: 18.5 },
  { age_months: 12, p3: 12.9, p15: 13.9, p50: 15.4, p85: 16.9, p97: 18.2 },
  { age_months: 18, p3: 12.5, p15: 13.4, p50: 14.8, p85: 16.3, p97: 17.7 },
  { age_months: 24, p3: 12.2, p15: 13.2, p50: 14.6, p85: 16.0, p97: 17.5 },
  { age_months: 36, p3: 12.0, p15: 13.0, p50: 14.4, p85: 15.9, p97: 17.5 },
  { age_months: 48, p3: 11.8, p15: 12.8, p50: 14.2, p85: 15.8, p97: 17.6 },
  { age_months: 60, p3: 11.7, p15: 12.7, p50: 14.1, p85: 15.8, p97: 17.7 },
];

// Helper to estimate percentile from WHO data
export function estimatePercentile(value: number, ageMonths: number, data: WHODataPoint[]): number | undefined {
  // Find surrounding data points
  let lower = data[0];
  let upper = data[data.length - 1];
  
  for (let i = 0; i < data.length - 1; i++) {
    if (ageMonths >= data[i].age_months && ageMonths <= data[i + 1].age_months) {
      lower = data[i];
      upper = data[i + 1];
      break;
    }
  }
  
  if (ageMonths > data[data.length - 1].age_months) return undefined;
  
  // Interpolate percentile values for the given age
  const ratio = upper.age_months === lower.age_months ? 0 : 
    (ageMonths - lower.age_months) / (upper.age_months - lower.age_months);
  
  const p3 = lower.p3 + ratio * (upper.p3 - lower.p3);
  const p15 = lower.p15 + ratio * (upper.p15 - lower.p15);
  const p50 = lower.p50 + ratio * (upper.p50 - lower.p50);
  const p85 = lower.p85 + ratio * (upper.p85 - lower.p85);
  const p97 = lower.p97 + ratio * (upper.p97 - lower.p97);
  
  if (value <= p3) return 1;
  if (value <= p15) return 3 + ((value - p3) / (p15 - p3)) * 12;
  if (value <= p50) return 15 + ((value - p15) / (p50 - p15)) * 35;
  if (value <= p85) return 50 + ((value - p50) / (p85 - p50)) * 35;
  if (value <= p97) return 85 + ((value - p85) / (p97 - p85)) * 12;
  return 99;
}

export function getGrowthClassification(percentile: number): { label: string; color: string; severity: 'normal' | 'attention' | 'alert' } {
  if (percentile < 3) return { label: 'Muito baixo', color: 'text-red-600', severity: 'alert' };
  if (percentile < 15) return { label: 'Baixo', color: 'text-orange-600', severity: 'attention' };
  if (percentile <= 85) return { label: 'Adequado', color: 'text-green-600', severity: 'normal' };
  if (percentile <= 97) return { label: 'Alto', color: 'text-orange-600', severity: 'attention' };
  return { label: 'Muito alto', color: 'text-red-600', severity: 'alert' };
}
