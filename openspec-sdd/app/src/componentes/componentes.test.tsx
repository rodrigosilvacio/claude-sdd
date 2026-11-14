import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { useLoja } from '../store/loja'
import { Carrinho, ContadorCarrinho } from './Carrinho'
import { ListaCatalogo } from './ListaCatalogo'
import { ResetarLoja } from './ResetarLoja'

beforeEach(() => {
  useLoja.getState().resetar()
})

const saldo = (id: string) => screen.getByTestId(`saldo-${id}`).textContent

describe('Carrinho', () => {
  it('remover 1 devolve a unidade ao estoque', async () => {
    const { selecionar } = useLoja.getState()
    selecionar('camiseta-basica')
    selecionar('camiseta-basica')
    render(
      <>
        <ListaCatalogo />
        <Carrinho />
      </>,
    )
    expect(saldo('camiseta-basica')).toBe('3')
    await userEvent.click(screen.getByRole('button', { name: 'Remover 1 Camiseta Básica' }))
    expect(saldo('camiseta-basica')).toBe('4')
    expect(within(screen.getByTestId('carrinho-camiseta-basica')).getByText('x1')).toBeInTheDocument()
  })

  it('remover a última unidade tira a linha e libera peça esgotada', async () => {
    useLoja.getState().selecionar('jaqueta-jeans')
    render(
      <>
        <ListaCatalogo />
        <Carrinho />
      </>,
    )
    expect(screen.getByRole('button', { name: 'Jaqueta Jeans esgotado' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Remover 1 Jaqueta Jeans' }))
    expect(screen.queryByTestId('carrinho-jaqueta-jeans')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar Jaqueta Jeans' })).toBeEnabled()
  })

  it('esvaziar zera o carrinho e devolve tudo', async () => {
    const { selecionar } = useLoja.getState()
    selecionar('camiseta-basica')
    selecionar('camiseta-basica')
    selecionar('jaqueta-jeans')
    render(
      <>
        <ContadorCarrinho />
        <ListaCatalogo />
        <Carrinho />
      </>,
    )
    expect(screen.getByTestId('contador-carrinho')).toHaveTextContent('3')
    await userEvent.click(screen.getByRole('button', { name: 'Esvaziar carrinho' }))
    expect(screen.getByText('Carrinho vazio')).toBeInTheDocument()
    expect(screen.getByTestId('contador-carrinho')).toHaveTextContent('0')
    expect(saldo('camiseta-basica')).toBe('5')
    expect(saldo('jaqueta-jeans')).toBe('1')
  })
})

describe('ListaCatalogo', () => {
  it('adicionar baixa 1 e peça esgotada fica desabilitada com selo', async () => {
    render(<ListaCatalogo />)
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Jaqueta Jeans' }))
    expect(saldo('jaqueta-jeans')).toBe('0')
    const linha = screen.getByTestId('catalogo-jaqueta-jeans')
    expect(within(linha).getByText('Esgotado')).toBeInTheDocument()
    expect(within(linha).getByRole('button')).toBeDisabled()
    expect(useLoja.getState().carrinho['jaqueta-jeans']).toBe(1)
  })

  it('mostra selo de saldo baixo para 1 ou 2 unidades', () => {
    render(<ListaCatalogo />)
    expect(within(screen.getByTestId('catalogo-camisa-linho')).getByText('Últimas')).toBeInTheDocument()
    expect(within(screen.getByTestId('catalogo-camiseta-basica')).queryByText('Últimas')).not.toBeInTheDocument()
  })
})

describe('ResetarLoja', () => {
  it('Scenario: Reset confirmado', async () => {
    useLoja.getState().selecionar('camiseta-basica')
    render(<ResetarLoja />)
    await userEvent.click(screen.getByRole('button', { name: 'Resetar loja' }))
    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar reset' }))
    expect(useLoja.getState().saldos['camiseta-basica']).toBe(5)
    expect(useLoja.getState().carrinho).toEqual({})
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Scenario: Reset cancelado', async () => {
    useLoja.getState().selecionar('camiseta-basica')
    render(<ResetarLoja />)
    await userEvent.click(screen.getByRole('button', { name: 'Resetar loja' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(useLoja.getState().saldos['camiseta-basica']).toBe(4)
    expect(useLoja.getState().carrinho['camiseta-basica']).toBe(1)
  })
})
