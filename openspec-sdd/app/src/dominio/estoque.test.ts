import { describe, expect, it } from 'vitest'
import type { Peca } from '../dados/tipos'
import { criarEstadoSemente, esvaziar, estadoValido, remover, resetar, selecionar, type EstadoLoja } from './estoque'

const peca = (id: string, nome: string, estoqueSemente: number): Peca => ({
  id,
  nome,
  categoria: 'camiseta',
  preco: 10,
  cor: '#fff',
  slotId: `${id}-slot`,
  estoqueSemente,
})

const CATALOGO_TESTE: Peca[] = [peca('camiseta', 'Camiseta Básica', 5), peca('jaqueta', 'Jaqueta Jeans', 1)]

function estado(saldos: Record<string, number>, carrinho: Record<string, number> = {}): EstadoLoja {
  return { saldos, carrinho }
}

function aplicar(r: ReturnType<typeof selecionar>): EstadoLoja {
  return r.estado
}

describe('Requirement: Catálogo com estoque por peça', () => {
  it('Scenario: Primeira abertura da loja', () => {
    const e = criarEstadoSemente(CATALOGO_TESTE)
    expect(e.saldos).toEqual({ camiseta: 5, jaqueta: 1 })
    expect(e.carrinho).toEqual({})
  })
})

describe('Requirement: Selecionar peça baixa uma unidade', () => {
  it('Scenario: Seleção de peça disponível', () => {
    const r = selecionar(estado({ camiseta: 5, jaqueta: 1 }), 'camiseta')
    expect(r.ok).toBe(true)
    expect(r.estado.saldos.camiseta).toBe(4)
    expect(r.estado.carrinho.camiseta).toBe(1)
  })

  it('Scenario: Seleção repetida da mesma peça', () => {
    const r = selecionar(estado({ camiseta: 4, jaqueta: 1 }, { camiseta: 1 }), 'camiseta')
    expect(r.estado.saldos.camiseta).toBe(3)
    expect(r.estado.carrinho.camiseta).toBe(2)
  })

  it('não altera o estado de entrada (função pura)', () => {
    const entrada = estado({ camiseta: 5, jaqueta: 1 })
    selecionar(entrada, 'camiseta')
    expect(entrada).toEqual(estado({ camiseta: 5, jaqueta: 1 }))
  })

  it('recusa peça inexistente', () => {
    const r = selecionar(estado({ camiseta: 5 }), 'nao-existe')
    expect(r).toMatchObject({ ok: false, motivo: 'PECA_INEXISTENTE' })
  })
})

describe('Requirement: Estoque zero bloqueia seleção', () => {
  it('Scenario: Tentativa de selecionar peça esgotada', () => {
    const entrada = estado({ camiseta: 5, jaqueta: 0 }, { jaqueta: 1 })
    const r = selecionar(entrada, 'jaqueta')
    expect(r).toMatchObject({ ok: false, motivo: 'ESGOTADO' })
    expect(r.estado).toBe(entrada)
    expect(r.estado.saldos.jaqueta).toBe(0)
  })

  it('Scenario: Última unidade selecionada', () => {
    const r = selecionar(estado({ camiseta: 5, jaqueta: 1 }), 'jaqueta')
    expect(r.ok).toBe(true)
    expect(r.estado.saldos.jaqueta).toBe(0)
  })

  it('Scenario: Seleções simultâneas na última unidade', () => {
    const primeira = selecionar(estado({ camiseta: 5, jaqueta: 1 }), 'jaqueta')
    const segunda = selecionar(primeira.estado, 'jaqueta')
    expect(primeira.ok).toBe(true)
    expect(segunda).toMatchObject({ ok: false, motivo: 'ESGOTADO' })
    expect(segunda.estado.saldos.jaqueta).toBe(0)
    expect(segunda.estado.carrinho.jaqueta).toBe(1)
  })
})

describe('Requirement: Remover do carrinho devolve a unidade', () => {
  it('Scenario: Remoção de uma unidade', () => {
    const r = remover(estado({ camiseta: 3, jaqueta: 1 }, { camiseta: 2 }), 'camiseta')
    expect(r.estado.saldos.camiseta).toBe(4)
    expect(r.estado.carrinho.camiseta).toBe(1)
  })

  it('Scenario: Remoção libera peça esgotada', () => {
    const r = remover(estado({ camiseta: 5, jaqueta: 0 }, { jaqueta: 1 }), 'jaqueta')
    expect(r.estado.saldos.jaqueta).toBe(1)
    expect('jaqueta' in r.estado.carrinho).toBe(false)
  })

  it('recusa remover peça que não está no carrinho', () => {
    const r = remover(estado({ camiseta: 5, jaqueta: 1 }), 'camiseta')
    expect(r).toMatchObject({ ok: false, motivo: 'FORA_DO_CARRINHO' })
    expect(r.estado.saldos.camiseta).toBe(5)
  })
})

describe('Requirement: Esvaziar carrinho', () => {
  it('Scenario: Esvaziar carrinho com várias peças', () => {
    const r = esvaziar(estado({ camiseta: 3, jaqueta: 0 }, { camiseta: 2, jaqueta: 1 }))
    expect(r.estado.saldos).toEqual({ camiseta: 5, jaqueta: 1 })
    expect(r.estado.carrinho).toEqual({})
  })
})

describe('Requirement: Resetar loja', () => {
  it('Scenario: Reset confirmado restaura o semente', () => {
    const r = resetar(CATALOGO_TESTE)
    expect(r.estado).toEqual({ saldos: { camiseta: 5, jaqueta: 1 }, carrinho: {} })
  })
})

describe('Requirement: Persistência local do estado (validação)', () => {
  it('aceita estado coerente com o catálogo', () => {
    const e = aplicar(selecionar(criarEstadoSemente(CATALOGO_TESTE), 'camiseta'))
    expect(estadoValido(e, CATALOGO_TESTE)).toBe(true)
  })

  it.each([
    ['nulo', null],
    ['texto', 'lixo'],
    ['sem carrinho', { saldos: { camiseta: 5, jaqueta: 1 } }],
    ['saldo negativo', { saldos: { camiseta: -1, jaqueta: 1 }, carrinho: {} }],
    ['saldo fracionado', { saldos: { camiseta: 4.5, jaqueta: 1 }, carrinho: {} }],
    ['peça a mais', { saldos: { camiseta: 5, jaqueta: 1, extra: 1 }, carrinho: {} }],
    ['peça faltando', { saldos: { camiseta: 5 }, carrinho: {} }],
    ['carrinho com peça desconhecida', { saldos: { camiseta: 5, jaqueta: 1 }, carrinho: { extra: 1 } }],
    ['invariante quebrada', { saldos: { camiseta: 5, jaqueta: 1 }, carrinho: { camiseta: 1 } }],
  ])('Scenario: Estado salvo inválido (%s)', (_, valor) => {
    expect(estadoValido(valor, CATALOGO_TESTE)).toBe(false)
  })
})
