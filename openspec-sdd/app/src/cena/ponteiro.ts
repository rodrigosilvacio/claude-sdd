import { Raycaster, Vector2, Vector3, type Camera, type Object3D } from 'three'
import { create } from 'zustand'
import { useLoja, type OrigemSelecao } from '../store/loja'

export type FontePonteiro = 'mouse' | 'toque' | 'mao'

interface PonteiroStore {
  /** Peça sob o ponteiro ativo (mouse, toque ou mão). */
  destacada: string | null
  fonte: FontePonteiro | null
  definir: (destacada: string | null, fonte: FontePonteiro | null) => void
}

export const usePonteiro = create<PonteiroStore>()((set) => ({
  destacada: null,
  fonte: null,
  definir: (destacada, fonte) => set({ destacada, fonte }),
}))

/** Referências da cena registradas pelo componente <RegistroCena /> dentro do Canvas. */
interface RegistroCena {
  camera: Camera
  cena: Object3D
  elemento: HTMLElement
}

let registro: RegistroCena | null = null

export function registrarCena(r: RegistroCena | null) {
  registro = r
}

const raycaster = new Raycaster()
const ndc = new Vector2()

/**
 * Camada de ponteiro unificada: dada uma coordenada de tela (clientX/clientY),
 * devolve o id da peça visível naquele ponto, ou null. Mouse, toque e mão
 * usam esta mesma função.
 */
export function pecaEmPonto(clientX: number, clientY: number): string | null {
  if (!registro) return null
  const rect = registro.elemento.getBoundingClientRect()
  if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(ndc, registro.camera)
  for (const hit of raycaster.intersectObject(registro.cena, true)) {
    let obj: Object3D | null = hit.object
    while (obj) {
      const id = obj.userData?.pecaId as string | undefined
      if (id) return id
      obj = obj.parent
    }
  }
  return null
}

/** Atualiza o destaque a partir de uma coordenada de tela. */
export function apontar(clientX: number, clientY: number, fonte: FontePonteiro): string | null {
  const id = pecaEmPonto(clientX, clientY)
  const atual = usePonteiro.getState()
  if (atual.destacada !== id || atual.fonte !== fonte) atual.definir(id, id ? fonte : null)
  return id
}

export function limparDestaque(fonte: FontePonteiro) {
  if (usePonteiro.getState().fonte === fonte) usePonteiro.getState().definir(null, null)
}

/** Seleciona a peça no ponto, aplicando as regras de estoque. Retorna se houve peça no ponto. */
export function selecionarEmPonto(clientX: number, clientY: number, origem: OrigemSelecao): boolean {
  const id = pecaEmPonto(clientX, clientY)
  if (!id) return false
  useLoja.getState().selecionar(id, origem)
  return true
}

/** Projeta uma posição 3D para coordenadas de tela (usado por testes e2e). */
export function projetarParaTela(posicao: [number, number, number]): { x: number; y: number } | null {
  if (!registro) return null
  const rect = registro.elemento.getBoundingClientRect()
  const v = new Vector3(...posicao).project(registro.camera)
  return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height }
}

/** Posição atual da câmera (usado por testes e2e). */
export function posicaoCamera(): [number, number, number] | null {
  if (!registro) return null
  const p = registro.camera.position
  return [p.x, p.y, p.z]
}

/** Retângulo da cena na tela, ou null se a cena ainda não foi montada. */
export function retanguloCena(): DOMRect | null {
  return registro ? registro.elemento.getBoundingClientRect() : null
}
