const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatarPreco = (valor: number) => moeda.format(valor)

/** Saldo de 1 ou 2 unidades é considerado baixo. */
export type NivelEstoque = 'normal' | 'baixo' | 'esgotado'

export function nivelEstoque(saldo: number): NivelEstoque {
  if (saldo <= 0) return 'esgotado'
  if (saldo <= 2) return 'baixo'
  return 'normal'
}
