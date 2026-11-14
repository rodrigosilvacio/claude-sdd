import type { Movel, Slot, Vec3 } from './tipos'

function slotsArara(prefixo: string, quantidade: number): Slot[] {
  const espacamento = 0.7
  const inicio = -((quantidade - 1) * espacamento) / 2
  return Array.from({ length: quantidade }, (_, i) => ({
    id: `${prefixo}-s${i + 1}`,
    offset: [inicio + i * espacamento, 1.15, 0] as Vec3,
  }))
}

function slotsPrateleira(prefixo: string): Slot[] {
  // Dois níveis, duas posições por nível.
  const niveis = [0.55, 1.15]
  const colunas = [-0.45, 0.45]
  return niveis.flatMap((y, n) =>
    colunas.map((x, c) => ({
      id: `${prefixo}-n${n + 1}c${c + 1}`,
      offset: [x, y, 0] as Vec3,
    })),
  )
}

/** Layout semente da loja física: 3 araras e 2 prateleiras. */
export const LAYOUT: Movel[] = [
  { id: 'arara-1', tipo: 'arara', nome: 'Arara Camisetas', posicao: [-3, 0, -2], rotacaoY: 0, slots: slotsArara('arara-1', 3) },
  { id: 'arara-2', tipo: 'arara', nome: 'Arara Casacos', posicao: [0, 0, -2], rotacaoY: 0, slots: slotsArara('arara-2', 3) },
  { id: 'arara-3', tipo: 'arara', nome: 'Arara Vestidos', posicao: [3, 0, -2], rotacaoY: 0, slots: slotsArara('arara-3', 3) },
  { id: 'prateleira-1', tipo: 'prateleira', nome: 'Prateleira Calças', posicao: [-3.3, 0, 0.4], rotacaoY: 0.6, slots: slotsPrateleira('prateleira-1') },
  { id: 'prateleira-2', tipo: 'prateleira', nome: 'Prateleira Bermudas', posicao: [3.3, 0, 0.4], rotacaoY: -0.6, slots: slotsPrateleira('prateleira-2') },
]

export interface SlotResolvido {
  movel: Movel
  slot: Slot
  /** Posição absoluta do slot na cena. */
  posicao: Vec3
}

export function resolverSlot(slotId: string, layout: Movel[] = LAYOUT): SlotResolvido | undefined {
  for (const movel of layout) {
    const slot = movel.slots.find((s) => s.id === slotId)
    if (slot) {
      const cos = Math.cos(movel.rotacaoY)
      const sin = Math.sin(movel.rotacaoY)
      const [ox, oy, oz] = slot.offset
      const posicao: Vec3 = [
        movel.posicao[0] + ox * cos + oz * sin,
        movel.posicao[1] + oy,
        movel.posicao[2] - ox * sin + oz * cos,
      ]
      return { movel, slot, posicao }
    }
  }
  return undefined
}
