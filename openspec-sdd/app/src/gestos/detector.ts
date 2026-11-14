import type { MaoDetectada } from './pipeline'

/** Adaptador do MediaPipe HandLandmarker. Carregado sob demanda (só ao ativar gestos). */
export interface DetectorMaos {
  detectar: (video: HTMLVideoElement, timestampMs: number) => MaoDetectada[]
  fechar: () => void
}

// Arquivos servidos localmente (ver scripts/preparar-mediapipe.mjs): nada é buscado de terceiros.
const BASE = import.meta.env.BASE_URL
const CAMINHO_WASM = `${BASE}mediapipe/wasm`
const CAMINHO_MODELO = `${BASE}mediapipe/hand_landmarker.task`

export async function carregarDetector(): Promise<DetectorMaos> {
  const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
  const fileset = await FilesetResolver.forVisionTasks(CAMINHO_WASM)
  const criar = (delegate: 'GPU' | 'CPU') =>
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: CAMINHO_MODELO, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
    })

  let landmarker
  try {
    landmarker = await criar('GPU')
  } catch {
    landmarker = await criar('CPU')
  }

  return {
    detectar: (video, timestampMs) => {
      const r = landmarker.detectForVideo(video, timestampMs)
      return r.landmarks.map((landmarks, i) => ({
        lado: r.handedness[i]?.[0]?.categoryName ?? `mao-${i}`,
        landmarks,
      }))
    },
    fechar: () => landmarker.close(),
  }
}
