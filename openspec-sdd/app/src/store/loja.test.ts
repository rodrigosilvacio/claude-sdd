import { beforeEach, describe, expect, it } from 'vitest'
import { CATALOGO } from '../dados/catalogo'
import { CHAVE_PERSISTENCIA, VERSAO_PERSISTENCIA, criarStoreLoja } from './loja'

const ID = 'camiseta-basica' // saldo semente 5

beforeEach(() => localStorage.clear())

describe('Requirement: Persistência local do estado', () => {
  it('Scenario: Recarregar a página', () => {
    const antes = criarStoreLoja(CATALOGO, localStorage)
    antes.getState().selecionar(ID)
    antes.getState().selecionar(ID)
    expect(antes.getState().saldos[ID]).toBe(3)

    // Novo store simula a página recarregada lendo do mesmo localStorage.
    const depois = criarStoreLoja(CATALOGO, localStorage)
    expect(depois.getState().saldos[ID]).toBe(3)
    expect(depois.getState().carrinho[ID]).toBe(2)
  })

  it('Scenario: Estado salvo inválido (JSON corrompido)', () => {
    localStorage.setItem(CHAVE_PERSISTENCIA, '{isto não é json')
    const store = criarStoreLoja(CATALOGO, localStorage)
    expect(store.getState().saldos[ID]).toBe(5)
    expect(store.getState().carrinho).toEqual({})
  })

  it('Scenario: Estado salvo inválido (incompatível com o semente)', () => {
    localStorage.setItem(
      CHAVE_PERSISTENCIA,
      JSON.stringify({ state: { saldos: { [ID]: 99 }, carrinho: {} }, version: VERSAO_PERSISTENCIA }),
    )
    const store = criarStoreLoja(CATALOGO, localStorage)
    expect(store.getState().saldos[ID]).toBe(5)
  })

  it('Scenario: Estado salvo inválido (versão antiga)', () => {
    const valido = { saldos: Object.fromEntries(CATALOGO.map((p) => [p.id, p.estoqueSemente])), carrinho: {} }
    valido.saldos[ID] = 4
    localStorage.setItem(CHAVE_PERSISTENCIA, JSON.stringify({ state: valido, version: 0 }))
    const store = criarStoreLoja(CATALOGO, localStorage)
    expect(store.getState().saldos[ID]).toBe(5)
  })

  it('não persiste eventos de UI', () => {
    const store = criarStoreLoja(CATALOGO, localStorage)
    store.getState().selecionar(ID, 'mao')
    const salvo = JSON.parse(localStorage.getItem(CHAVE_PERSISTENCIA)!)
    expect(Object.keys(salvo.state).sort()).toEqual(['carrinho', 'saldos'])
  })
})

describe('store: ações e eventos de seleção', () => {
  it('registra evento aceito e recusado com origem', () => {
    const store = criarStoreLoja(CATALOGO, localStorage)
    store.getState().selecionar('jaqueta-jeans', 'mao') // saldo 1 -> 0
    expect(store.getState().ultimoEvento).toMatchObject({ pecaId: 'jaqueta-jeans', aceita: true, origem: 'mao' })
    store.getState().selecionar('jaqueta-jeans', 'mouse')
    expect(store.getState().ultimoEvento).toMatchObject({ aceita: false, motivo: 'ESGOTADO', origem: 'mouse', seq: 2 })
    expect(store.getState().saldos['jaqueta-jeans']).toBe(0)
  })

  it('resetar volta ao semente e esvazia o carrinho', () => {
    const store = criarStoreLoja(CATALOGO, localStorage)
    store.getState().selecionar(ID)
    store.getState().resetar()
    expect(store.getState().saldos[ID]).toBe(5)
    expect(store.getState().carrinho).toEqual({})
  })
})
