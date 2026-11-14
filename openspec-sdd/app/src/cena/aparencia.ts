import { nivelEstoque, type NivelEstoque } from '../formato'

export interface AparenciaPeca {
  nivel: NivelEstoque
  cor: string
  opacidade: number
  emissiva: string
  intensidadeEmissiva: number
  escala: number
  rotulo: string
}

const COR_ESGOTADO = '#4b5563'
const COR_DESTAQUE = '#7c5cff'

/** Estado visual de uma peça no gêmeo digital, derivado do saldo e do destaque. */
export function aparenciaPeca(corBase: string, saldo: number, destacada: boolean): AparenciaPeca {
  const nivel = nivelEstoque(saldo)
  const esgotada = nivel === 'esgotado'
  return {
    nivel,
    cor: esgotada ? COR_ESGOTADO : corBase,
    opacidade: esgotada ? 0.35 : 1,
    emissiva: destacada ? COR_DESTAQUE : '#000000',
    intensidadeEmissiva: destacada ? 0.55 : 0,
    escala: destacada ? 1.06 : 1,
    rotulo: esgotada ? 'Esgotado' : String(saldo),
  }
}
