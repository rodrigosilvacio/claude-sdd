import { CONFIG_GESTOS, LANDMARK, type ConfigGestos } from './config'

/**
 * Pipeline puro de gestos: recebe o resultado do detector de mãos a cada quadro
 * e produz a posição do cursor (normalizada 0..1 na área da cena) e eventos de pinça.
 * Não depende de câmera, DOM ou MediaPipe, para ser testado com landmarks sintéticos.
 */

export interface Ponto {
  x: number
  y: number
  z?: number
}

export interface MaoDetectada {
  /** "Left" ou "Right", como reportado pelo detector. */
  lado: string
  landmarks: Ponto[]
}

export type EstadoPinca = 'aberta' | 'proxima' | 'fechada'

export interface SaidaQuadro {
  /** Cursor normalizado (0..1) na área da cena, já espelhado e suavizado; null sem mão. */
  cursor: { x: number; y: number } | null
  pinca: EstadoPinca
  /** true apenas no quadro em que uma pinça foi reconhecida e deve selecionar. */
  disparou: boolean
}

const dist = (a: Ponto, b: Ponto) => Math.hypot(a.x - b.x, a.y - b.y)

/** Distância polegar-indicador normalizada pelo tamanho da mão (pulso até base do médio). */
export function distanciaPinca(landmarks: Ponto[]): number {
  const escala = dist(landmarks[LANDMARK.PULSO], landmarks[LANDMARK.MEDIO_BASE]) || 1e-6
  return dist(landmarks[LANDMARK.POLEGAR_PONTA], landmarks[LANDMARK.INDICADOR_PONTA]) / escala
}

/** Máquina de estados da pinça com histerese e bloqueio: no máximo uma seleção por gesto. */
export class MaquinaPinca {
  private estado: EstadoPinca = 'aberta'
  private armada = true
  private ultimoDisparo = Number.NEGATIVE_INFINITY
  private readonly config: ConfigGestos

  constructor(config: ConfigGestos = CONFIG_GESTOS) {
    this.config = config
  }

  atualizar(distancia: number, agoraMs: number): { estado: EstadoPinca; disparou: boolean } {
    const { limiarFechar, limiarAbrir, bloqueioMs } = this.config
    let disparou = false

    if (this.estado === 'fechada') {
      // Só reabre acima do limiar de abertura (histerese).
      if (distancia > limiarAbrir) {
        this.estado = 'aberta'
        this.armada = true
      }
    } else if (distancia < limiarFechar) {
      this.estado = 'fechada'
      if (this.armada && agoraMs - this.ultimoDisparo >= bloqueioMs) {
        disparou = true
        this.ultimoDisparo = agoraMs
      }
      this.armada = false
    } else {
      this.estado = distancia <= limiarAbrir ? 'proxima' : 'aberta'
    }

    return { estado: this.estado, disparou }
  }

  reiniciar() {
    this.estado = 'aberta'
    this.armada = true
  }
}

/** Média móvel exponencial 2D. */
export class Suavizador {
  private atual: { x: number; y: number } | null = null
  private readonly alfa: number

  constructor(alfa: number) {
    this.alfa = alfa
  }

  aplicar(p: { x: number; y: number }) {
    this.atual = this.atual ? { x: this.atual.x + this.alfa * (p.x - this.atual.x), y: this.atual.y + this.alfa * (p.y - this.atual.y) } : { ...p }
    return this.atual
  }

  reiniciar() {
    this.atual = null
  }
}

const limitar = (v: number) => Math.min(1, Math.max(0, v))

export class PipelineGestos {
  private ladoAtivo: string | null = null
  private ultimaMaoMs = Number.NEGATIVE_INFINITY
  private ultimoCursor: { x: number; y: number } | null = null
  private ultimaPinca: EstadoPinca = 'aberta'
  private readonly pinca: MaquinaPinca
  private readonly suavizador: Suavizador
  private readonly config: ConfigGestos

  constructor(config: ConfigGestos = CONFIG_GESTOS) {
    this.config = config
    this.pinca = new MaquinaPinca(config)
    this.suavizador = new Suavizador(config.alfaSuavizacao)
  }

  processar(maos: MaoDetectada[], agoraMs: number): SaidaQuadro {
    const mao = this.escolherMao(maos, agoraMs)

    if (!mao) {
      // Mantém o último cursor por um curto período, para tolerar falhas pontuais de detecção.
      if (this.ultimoCursor && agoraMs - this.ultimaMaoMs <= this.config.timeoutMaoMs) {
        return { cursor: this.ultimoCursor, pinca: this.ultimaPinca, disparou: false }
      }
      this.reiniciar()
      return { cursor: null, pinca: 'aberta', disparou: false }
    }

    this.ultimaMaoMs = agoraMs
    const ponta = mao.landmarks[LANDMARK.INDICADOR_PONTA]
    const m = this.config.margemQuadro
    // Espelha X para o movimento parecer um espelho para o usuário.
    const bruto = { x: limitar((1 - ponta.x - m) / (1 - 2 * m)), y: limitar((ponta.y - m) / (1 - 2 * m)) }
    this.ultimoCursor = this.suavizador.aplicar(bruto)

    const { estado, disparou } = this.pinca.atualizar(distanciaPinca(mao.landmarks), agoraMs)
    this.ultimaPinca = estado
    return { cursor: this.ultimoCursor, pinca: estado, disparou }
  }

  /** Mantém a mesma mão como ponteiro enquanto ela continuar detectada. */
  private escolherMao(maos: MaoDetectada[], agoraMs: number): MaoDetectada | null {
    if (maos.length === 0) return null
    if (this.ladoAtivo) {
      const mesma = maos.find((m) => m.lado === this.ladoAtivo)
      if (mesma) return mesma
      // A mão ativa sumiu há pouco: não troca para a outra mão imediatamente.
      if (agoraMs - this.ultimaMaoMs <= this.config.timeoutMaoMs) return null
    }
    this.ladoAtivo = maos[0].lado
    this.suavizador.reiniciar()
    this.pinca.reiniciar()
    return maos[0]
  }

  reiniciar() {
    this.ladoAtivo = null
    this.ultimoCursor = null
    this.ultimaPinca = 'aberta'
    this.suavizador.reiniciar()
    this.pinca.reiniciar()
  }
}
