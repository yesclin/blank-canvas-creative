import lisoImg from './liso.jpg';
import onduladoImg from './ondulado.jpg';
import crespoImg from './crespo.jpg';

/**
 * Mapping of capilar image placeholder keys to actual imported images.
 * Used by VisualOptionCardGrid to resolve image_placeholder_key → real URL.
 */
export const CAPILAR_IMAGES: Record<string, string> = {
  'estetica/capilar/liso': lisoImg,
  'estetica/capilar/ondulado': onduladoImg,
  'estetica/capilar/crespo': crespoImg,
};
