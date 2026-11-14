import { CATALOGO } from '../dados/catalogo'
import { LAYOUT, resolverSlot } from '../dados/layout'
import type { Peca } from '../dados/tipos'

export const CAMERA_INICIAL: [number, number, number] = [0, 4, 8]
export const ALVO_INICIAL: [number, number, number] = [0, 0.8, -0.3]

export function pecasPosicionadas(catalogo: Peca[] = CATALOGO) {
  const posicionadas = []
  for (const peca of catalogo) {
    const slot = resolverSlot(peca.slotId, LAYOUT)
    if (!slot) {
      console.warn(`[gemeo-digital] Peça "${peca.id}" sem posição válida no layout (slot "${peca.slotId}").`)
      continue
    }
    posicionadas.push({ peca, posicao: slot.posicao, rotacaoY: slot.movel.rotacaoY, tipoMovel: slot.movel.tipo })
  }
  return posicionadas
}
