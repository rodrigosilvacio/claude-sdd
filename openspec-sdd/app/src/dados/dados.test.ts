import { describe, expect, it } from 'vitest'
import { CATALOGO } from './catalogo'
import { LAYOUT, resolverSlot } from './layout'

describe('dados semente', () => {
  it('tem 12 peças, 3 araras e 2 prateleiras', () => {
    expect(CATALOGO).toHaveLength(12)
    expect(LAYOUT.filter((m) => m.tipo === 'arara')).toHaveLength(3)
    expect(LAYOUT.filter((m) => m.tipo === 'prateleira')).toHaveLength(2)
  })

  it('todo slot referenciado por uma peça existe no layout', () => {
    for (const peca of CATALOGO) {
      expect(resolverSlot(peca.slotId), peca.id).toBeDefined()
    }
  })

  it('todo saldo semente é inteiro maior ou igual a zero', () => {
    for (const peca of CATALOGO) {
      expect(Number.isInteger(peca.estoqueSemente), peca.id).toBe(true)
      expect(peca.estoqueSemente, peca.id).toBeGreaterThanOrEqual(0)
    }
  })

  it('ids de peça e de slot são únicos e cada slot tem no máximo uma peça', () => {
    expect(new Set(CATALOGO.map((p) => p.id)).size).toBe(CATALOGO.length)
    expect(new Set(CATALOGO.map((p) => p.slotId)).size).toBe(CATALOGO.length)
    const slots = LAYOUT.flatMap((m) => m.slots.map((s) => s.id))
    expect(new Set(slots).size).toBe(slots.length)
  })

  it('resolverSlot retorna undefined para slot inexistente', () => {
    expect(resolverSlot('nao-existe')).toBeUndefined()
  })
})
