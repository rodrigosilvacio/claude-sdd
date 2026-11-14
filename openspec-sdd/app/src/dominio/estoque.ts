import type { Peca } from '../dados/tipos'

/**
 * Estado de domínio da loja. Funções deste módulo são puras: recebem um estado
 * e devolvem um novo estado (ou o motivo da recusa), sem efeitos colaterais.
 */
export interface EstadoLoja {
  /** Saldo disponível por peça. */
  saldos: Record<string, number>
  /** Quantidade no carrinho por peça (somente peças com quantidade > 0). */
  carrinho: Record<string, number>
}

export type MotivoRecusa = 'ESGOTADO' | 'PECA_INEXISTENTE' | 'FORA_DO_CARRINHO'

export type Resultado = { ok: true; estado: EstadoLoja } | { ok: false; motivo: MotivoRecusa; estado: EstadoLoja }

export function criarEstadoSemente(catalogo: Peca[]): EstadoLoja {
  return {
    saldos: Object.fromEntries(catalogo.map((p) => [p.id, p.estoqueSemente])),
    carrinho: {},
  }
}

function recusa(estado: EstadoLoja, motivo: MotivoRecusa): Resultado {
  return { ok: false, motivo, estado }
}

/** Adiciona 1 unidade ao carrinho e baixa 1 do saldo. Recusa se o saldo for zero. */
export function selecionar(estado: EstadoLoja, pecaId: string): Resultado {
  if (!(pecaId in estado.saldos)) return recusa(estado, 'PECA_INEXISTENTE')
  const saldo = estado.saldos[pecaId]
  if (saldo <= 0) return recusa(estado, 'ESGOTADO')
  return {
    ok: true,
    estado: {
      saldos: { ...estado.saldos, [pecaId]: saldo - 1 },
      carrinho: { ...estado.carrinho, [pecaId]: (estado.carrinho[pecaId] ?? 0) + 1 },
    },
  }
}

/** Remove 1 unidade do carrinho e devolve 1 ao saldo. Remove a linha ao chegar a zero. */
export function remover(estado: EstadoLoja, pecaId: string): Resultado {
  if (!(pecaId in estado.saldos)) return recusa(estado, 'PECA_INEXISTENTE')
  const quantidade = estado.carrinho[pecaId] ?? 0
  if (quantidade <= 0) return recusa(estado, 'FORA_DO_CARRINHO')
  const carrinho = { ...estado.carrinho }
  if (quantidade === 1) delete carrinho[pecaId]
  else carrinho[pecaId] = quantidade - 1
  return {
    ok: true,
    estado: { saldos: { ...estado.saldos, [pecaId]: estado.saldos[pecaId] + 1 }, carrinho },
  }
}

/** Devolve ao estoque todas as unidades do carrinho e o esvazia. */
export function esvaziar(estado: EstadoLoja): Resultado {
  const saldos = { ...estado.saldos }
  for (const [id, quantidade] of Object.entries(estado.carrinho)) {
    saldos[id] = (saldos[id] ?? 0) + quantidade
  }
  return { ok: true, estado: { saldos, carrinho: {} } }
}

/** Restaura os saldos semente e esvazia o carrinho. */
export function resetar(catalogo: Peca[]): Resultado {
  return { ok: true, estado: criarEstadoSemente(catalogo) }
}

export function totalItensCarrinho(estado: EstadoLoja): number {
  return Object.values(estado.carrinho).reduce((soma, q) => soma + q, 0)
}

const ehInteiroNaoNegativo = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 0

/**
 * Verifica se um estado (por exemplo, lido do localStorage) é compatível com o catálogo:
 * mesmas peças, valores inteiros não negativos e conservação saldo + carrinho = semente.
 */
export function estadoValido(estado: unknown, catalogo: Peca[]): estado is EstadoLoja {
  if (typeof estado !== 'object' || estado === null) return false
  const { saldos, carrinho } = estado as Partial<EstadoLoja>
  if (typeof saldos !== 'object' || saldos === null || typeof carrinho !== 'object' || carrinho === null) return false

  const ids = new Set(catalogo.map((p) => p.id))
  if (Object.keys(saldos).length !== ids.size) return false
  for (const id of Object.keys(carrinho)) {
    if (!ids.has(id) || !ehInteiroNaoNegativo(carrinho[id]) || carrinho[id] === 0) return false
  }
  for (const peca of catalogo) {
    const saldo = saldos[peca.id]
    if (!ehInteiroNaoNegativo(saldo)) return false
    if (saldo + (carrinho[peca.id] ?? 0) !== peca.estoqueSemente) return false
  }
  return true
}
