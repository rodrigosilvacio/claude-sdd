import { create } from 'zustand'
import { apontar, limparDestaque, retanguloCena, selecionarEmPonto } from '../cena/ponteiro'
import { CONFIG_GESTOS } from './config'
import type { DetectorMaos } from './detector'
import { PipelineGestos, type EstadoPinca, type MaoDetectada } from './pipeline'

export type EstadoGestos = 'desligado' | 'aviso' | 'carregando' | 'ativo'

interface GestosStore {
  estado: EstadoGestos
  erro: string | null
  /** Cursor normalizado (0..1) na área da cena. Só existe em memória, nunca é persistido. */
  cursor: { x: number; y: number } | null
  pinca: EstadoPinca
  stream: MediaStream | null
  pedirAtivacao: () => void
  cancelarAviso: () => void
  ativar: () => Promise<void>
  desativar: () => void
}

export const MENSAGENS_ERRO = {
  semSuporte: 'Seu navegador não permite usar a câmera aqui. Continue com mouse ou toque.',
  negada: 'Os gestos precisam da câmera e o acesso foi negado. Continue com mouse ou toque.',
  semCamera: 'Nenhuma câmera foi encontrada. Continue com mouse ou toque.',
  emUso: 'A câmera está em uso por outro aplicativo. Continue com mouse ou toque.',
  modelo: 'Gestos indisponíveis: não foi possível carregar o modelo de mãos. Continue com mouse ou toque.',
} as const

function mensagemDeErroCamera(erro: unknown): string {
  const nome = (erro as { name?: string })?.name
  if (nome === 'NotAllowedError' || nome === 'SecurityError') return MENSAGENS_ERRO.negada
  if (nome === 'NotFoundError' || nome === 'OverconstrainedError') return MENSAGENS_ERRO.semCamera
  if (nome === 'NotReadableError' || nome === 'AbortError') return MENSAGENS_ERRO.emUso
  return MENSAGENS_ERRO.semSuporte
}

let detectorPromessa: Promise<DetectorMaos> | null = null
let video: HTMLVideoElement | null = null
let quadro = 0
let ultimaInferencia = 0
const pipeline = new PipelineGestos()

/**
 * Detector roteirizado, só em builds de teste e2e (VITE_E2E=1): permite exercitar
 * câmera, cursor, pinça e seleção de ponta a ponta sem uma mão real na frente da webcam.
 */
let detectorSubstituto: DetectorMaos | null = null
if (import.meta.env.VITE_E2E === '1') {
  let maos: MaoDetectada[] = []
  ;(window as unknown as Record<string, unknown>).__gestos = {
    usarDetectorRoteirizado: () => {
      detectorSubstituto = { detectar: () => maos, fechar: () => undefined }
      detectorPromessa = null
    },
    definirMaos: (m: MaoDetectada[]) => {
      maos = m
    },
  }
}

function pararCamera(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop())
  if (video) {
    video.pause()
    video.srcObject = null
  }
}

function loop(detector: DetectorMaos) {
  const passo = (agora: number) => {
    const s = useGestos.getState()
    if (s.estado !== 'ativo' || !video) return
    quadro = requestAnimationFrame(passo)
    if (agora - ultimaInferencia < CONFIG_GESTOS.intervaloInferenciaMs || video.readyState < 2) return
    ultimaInferencia = agora

    let saida
    try {
      saida = pipeline.processar(detector.detectar(video, agora), agora)
    } catch {
      return // quadro descartado; o próximo tenta de novo
    }

    useGestos.setState({ cursor: saida.cursor, pinca: saida.pinca })
    const rect = retanguloCena()
    if (!saida.cursor || !rect) {
      limparDestaque('mao')
      return
    }
    const x = rect.left + saida.cursor.x * rect.width
    const y = rect.top + saida.cursor.y * rect.height
    apontar(x, y, 'mao')
    if (saida.disparou) selecionarEmPonto(x, y, 'mao')
  }
  quadro = requestAnimationFrame(passo)
}

export const useGestos = create<GestosStore>()((set, get) => ({
  estado: 'desligado',
  erro: null,
  cursor: null,
  pinca: 'aberta',
  stream: null,

  pedirAtivacao: () => set({ estado: 'aviso', erro: null }),
  cancelarAviso: () => set({ estado: 'desligado' }),

  ativar: async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      set({ estado: 'desligado', erro: MENSAGENS_ERRO.semSuporte })
      return
    }
    set({ estado: 'carregando', erro: null })

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
    } catch (e) {
      set({ estado: 'desligado', erro: mensagemDeErroCamera(e) })
      return
    }

    if (get().estado !== 'carregando') {
      pararCamera(stream)
      return
    }

    let detector: DetectorMaos
    try {
      detectorPromessa ??= detectorSubstituto
        ? Promise.resolve(detectorSubstituto)
        : import('./detector').then((m) => m.carregarDetector())
      detector = await detectorPromessa
    } catch {
      detectorPromessa = null
      pararCamera(stream)
      set({ estado: 'desligado', erro: MENSAGENS_ERRO.modelo, stream: null })
      return
    }

    // Usuário desativou enquanto carregava.
    if (get().estado !== 'carregando') {
      pararCamera(stream)
      return
    }

    video ??= Object.assign(document.createElement('video'), { muted: true, playsInline: true, autoplay: true })
    video.srcObject = stream
    await video.play().catch(() => undefined)

    pipeline.reiniciar()
    set({ estado: 'ativo', stream })
    loop(detector)
  },

  desativar: () => {
    cancelAnimationFrame(quadro)
    pararCamera(get().stream)
    pipeline.reiniciar()
    limparDestaque('mao')
    set({ estado: 'desligado', stream: null, cursor: null, pinca: 'aberta' })
  },
}))

/** Só para testes: descarta o detector em cache. */
export function _descartarDetectorEmCache() {
  detectorPromessa = null
}
