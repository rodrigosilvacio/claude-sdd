import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { CATALOGO } from '../dados/catalogo'
import { criarEstadoSemente, esvaziar, estadoValido, remover, selecionar, type EstadoLoja } from './estoque'

const ids = CATALOGO.map((p) => p.id)

const operacao = fc.oneof(
  fc.record({ tipo: fc.constant('selecionar' as const), id: fc.constantFrom(...ids, 'inexistente') }),
  fc.record({ tipo: fc.constant('remover' as const), id: fc.constantFrom(...ids, 'inexistente') }),
  fc.record({ tipo: fc.constant('esvaziar' as const) }),
)

type Operacao = { tipo: 'selecionar' | 'remover'; id: string } | { tipo: 'esvaziar' }

function aplicar(estado: EstadoLoja, op: Operacao): EstadoLoja {
  if (op.tipo === 'esvaziar') return esvaziar(estado).estado
  return op.tipo === 'selecionar' ? selecionar(estado, op.id).estado : remover(estado, op.id).estado
}

describe('Requirement: Conservação do estoque', () => {
  it('Scenario: Invariante após sequência de operações', () => {
    fc.assert(
      fc.property(fc.array(operacao, { maxLength: 200 }), (ops) => {
        let estado = criarEstadoSemente(CATALOGO)
        for (const op of ops) {
          estado = aplicar(estado, op)
          for (const peca of CATALOGO) {
            const saldo = estado.saldos[peca.id]
            expect(saldo).toBeGreaterThanOrEqual(0)
            expect(saldo + (estado.carrinho[peca.id] ?? 0)).toBe(peca.estoqueSemente)
          }
        }
        expect(estadoValido(estado, CATALOGO)).toBe(true)
      }),
      { numRuns: 300 },
    )
  })
})
