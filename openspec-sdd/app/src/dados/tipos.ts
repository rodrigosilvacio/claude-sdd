export type Vec3 = [number, number, number]

export type TipoMovel = 'arara' | 'prateleira'

export interface Slot {
  id: string
  /** Posição do slot relativa ao móvel. */
  offset: Vec3
}

export interface Movel {
  id: string
  tipo: TipoMovel
  nome: string
  posicao: Vec3
  /** Rotação em torno do eixo Y, em radianos. */
  rotacaoY: number
  slots: Slot[]
}

export type Categoria = 'camiseta' | 'camisa' | 'calca' | 'jaqueta' | 'vestido' | 'moletom' | 'bermuda' | 'saia'

export interface Peca {
  id: string
  nome: string
  categoria: Categoria
  preco: number
  /** Cor de exibição no gêmeo digital (hex). */
  cor: string
  /** Slot do layout onde a peça fica exposta. */
  slotId: string
  estoqueSemente: number
}
