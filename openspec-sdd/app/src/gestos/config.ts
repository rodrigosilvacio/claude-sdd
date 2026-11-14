/** Constantes de ajuste fino do pipeline de gestos (ver design.md, D5). */
export const CONFIG_GESTOS = {
  /** Fator da média móvel exponencial do cursor (0..1). Maior = mais responsivo, menos suave. */
  alfaSuavizacao: 0.35,
  /** Distância normalizada polegar-indicador abaixo da qual a pinça fecha. */
  limiarFechar: 0.25,
  /** Distância normalizada acima da qual a pinça reabre (histerese). */
  limiarAbrir: 0.4,
  /** Intervalo mínimo entre duas seleções por pinça, em ms. */
  bloqueioMs: 600,
  /** Tempo sem mão detectada até esconder o cursor, em ms. */
  timeoutMaoMs: 500,
  /** Intervalo mínimo entre inferências, em ms (~30 fps). */
  intervaloInferenciaMs: 33,
  /**
   * Margem do quadro da câmera ignorada nas bordas: a área central (1 - 2 * margem)
   * é esticada para cobrir toda a cena, facilitando alcançar os cantos.
   */
  margemQuadro: 0.1,
} as const

export type ConfigGestos = typeof CONFIG_GESTOS

/** Índices dos landmarks do MediaPipe Hands usados pelo pipeline. */
export const LANDMARK = {
  PULSO: 0,
  POLEGAR_PONTA: 4,
  INDICADOR_PONTA: 8,
  MEDIO_BASE: 9,
} as const
