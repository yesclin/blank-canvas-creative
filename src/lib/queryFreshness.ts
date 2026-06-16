/**
 * Política central de "frescor" de dados.
 *
 * Estratégia: **stale-while-revalidate** em todo o app.
 *  - Sempre mostramos os dados em cache imediatamente (sem skeleton global).
 *  - Em paralelo, validamos se há versão mais recente no servidor.
 *  - Se vier algo novo, a UI atualiza sem piscar.
 *
 * Em vez de cada hook chutar um `staleTime`, importe um dos presets abaixo.
 * Isso garante consistência entre módulos e permite ajustar a política em
 * um único ponto.
 */

/** Dados praticamente imutáveis durante a sessão (specialties, system_procedures). */
export const STALE_VERY_LONG = 30 * 60_000; // 30 min

/** Estruturas estáveis: procedures, professionals, rooms, insurances, payment methods. */
export const STALE_STRUCTURE = 5 * 60_000; // 5 min

/** Listagens transacionais (pacientes, leads, estoque): mudam em horas. */
export const STALE_TRANSACTIONAL = 60_000; // 1 min

/** Dados quase em tempo real (agenda do dia, financeiro do dia, fila). */
export const STALE_REALTIME = 15_000; // 15 s

/** Sempre buscar fresco. Use com moderação — gera tráfego. */
export const STALE_ALWAYS = 0;

/** GC longo: mantém o cache disponível para retornos rápidos a uma tela. */
export const GC_DEFAULT = 30 * 60_000; // 30 min
