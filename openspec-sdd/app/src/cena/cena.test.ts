import { describe, expect, it, vi } from 'vitest'
import type { Peca } from '../dados/tipos'
import { CATALOGO } from '../dados/catalogo'
import { aparenciaPeca } from './aparencia'
import { pecasPosicionadas } from './posicionamento'

describe('Requirement: Layout espacial da loja', () => {
  it('Scenario: Cena carregada (cada peça aparece uma vez, na sua posição)', () => {
    const pecas = pecasPosicionadas(CATALOGO)
    expect(pecas.map((p) => p.peca.id)).toEqual(CATALOGO.map((p) => p.id))
  })

  it('Scenario: Peça sem posição válida gera aviso e fica fora da cena', () => {
    const aviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const fantasma: Peca = { ...CATALOGO[0], id: 'fantasma', slotId: 'slot-inexistente' }
    const pecas = pecasPosicionadas([...CATALOGO, fantasma])
    expect(pecas.find((p) => p.peca.id === 'fantasma')).toBeUndefined()
    expect(aviso).toHaveBeenCalledWith(expect.stringContaining('fantasma'))
    aviso.mockRestore()
  })
})

describe('Requirement: Indicador visual de estoque por peça', () => {
  it('Scenario: Peça esgotada na cena', () => {
    const a = aparenciaPeca('#ff0000', 0, false)
    expect(a.nivel).toBe('esgotado')
    expect(a.rotulo).toBe('Esgotado')
    expect(a.cor).not.toBe('#ff0000')
    expect(a.opacidade).toBeLessThan(1)
  })

  it('Scenario: Peça com saldo baixo', () => {
    expect(aparenciaPeca('#ff0000', 2, false)).toMatchObject({ nivel: 'baixo', rotulo: '2', cor: '#ff0000' })
    expect(aparenciaPeca('#ff0000', 1, false).nivel).toBe('baixo')
  })

  it('peça normal mantém cor e opacidade', () => {
    expect(aparenciaPeca('#ff0000', 5, false)).toMatchObject({ nivel: 'normal', rotulo: '5', opacidade: 1, escala: 1 })
  })

  it('Requirement: Destaque e confirmação da seleção (destaque)', () => {
    const a = aparenciaPeca('#ff0000', 5, true)
    expect(a.intensidadeEmissiva).toBeGreaterThan(0)
    expect(a.escala).toBeGreaterThan(1)
  })
})
