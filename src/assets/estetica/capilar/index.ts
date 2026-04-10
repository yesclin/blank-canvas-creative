import lisoImg from './liso.jpg';
import onduladoImg from './ondulado.jpg';
import crespoImg from './crespo.jpg';
import moniletrixImg from './moniletrix.jpg';
import tricorrexeInvaginataImg from './tricorrexe_invaginata.jpg';
import tricoclasiaImg from './tricoclasia.jpg';
import anagenoFrouxoImg from './anageno_frouxo.jpg';
import sindromeCabelosImg from './sindrome_cabelos.jpg';
import tricorrexeNodosaImg from './tricorrexe_nodosa.jpg';
import tricoptilosImg from './tricoptilose.jpg';
import triconodoseImg from './triconodose.jpg';
import hastePartidaImg from './haste_partida.jpg';

/**
 * Mapping of capilar image placeholder keys to actual imported images.
 * Used by VisualOptionCardGrid to resolve image_placeholder_key → real URL.
 */
export const CAPILAR_IMAGES: Record<string, string> = {
  'estetica/capilar/liso': lisoImg,
  'estetica/capilar/ondulado': onduladoImg,
  'estetica/capilar/crespo': crespoImg,
  'estetica/capilar/moniletrix': moniletrixImg,
  'estetica/capilar/tricorrexe_invaginata': tricorrexeInvaginataImg,
  'estetica/capilar/tricoclasia': tricoclasiaImg,
  'estetica/capilar/anageno_frouxo': anagenoFrouxoImg,
  'estetica/capilar/sindrome_cabelos': sindromeCabelosImg,
  'estetica/capilar/tricorrexe_nodosa': tricorrexeNodosaImg,
  'estetica/capilar/tricoptilose': tricoptilosImg,
  'estetica/capilar/triconodose': triconodoseImg,
  'estetica/capilar/haste_partida': hastePartidaImg,
};
