/**
 * Central registry for visual card images.
 * Maps image_placeholder_key → imported image URL.
 * Add new entries here as images are created for each specialty/template.
 */
import { CAPILAR_IMAGES } from '@/assets/estetica/capilar';
import { CORPORAL_IMAGES } from '@/assets/estetica/corporal';

const IMAGE_REGISTRY: Record<string, string> = {
  ...CAPILAR_IMAGES,
  ...CORPORAL_IMAGES,
};

/**
 * Resolve an image_placeholder_key to an actual image URL.
 * Returns undefined if no image is registered for the key.
 */
export function resolveCardImage(key: string | undefined | null): string | undefined {
  if (!key) return undefined;
  return IMAGE_REGISTRY[key];
}
