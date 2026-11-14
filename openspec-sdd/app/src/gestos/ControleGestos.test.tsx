import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ListaCatalogo } from '../componentes/ListaCatalogo'
import { useLoja } from '../store/loja'
import { MENSAGENS_ERRO, _descartarDetectorEmCache, useGestos } from './controlador'
import { ControleGestos } from './ControleGestos'

const carregarDetector = vi.fn()
vi.mock('./detector', () => ({ carregarDetector: () => carregarDetector() }))

function streamFalso() {
  const track = { stop: vi.fn(), kind: 'video' }
  return { stream: { getTracks: () => [track] } as unknown as MediaStream, track }
}

const getUserMedia = vi.fn()

beforeEach(() => {
  Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia }, configurable: true })
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  carregarDetector.mockResolvedValue({ detectar: () => [], fechar: vi.fn() })
  useLoja.getState().resetar()
  _descartarDetectorEmCache()
})

afterEach(() => {
  act(() => useGestos.getState().desativar())
  useGestos.setState({ erro: null })
  getUserMedia.mockReset()
  carregarDetector.mockReset()
  vi.unstubAllGlobals()
})

async function ativarPelaInterface() {
  await userEvent.click(screen.getByRole('button', { name: /Ativar gestos/ }))
  await userEvent.click(screen.getByRole('button', { name: 'Permitir câmera' }))
}

describe('Requirement: Ativação da câmera por consentimento', () => {
  it('Scenario: Abertura da loja (câmera não é acessada)', () => {
    render(<ControleGestos />)
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /Ativar gestos/ })).toBeEnabled()
  })

  it('mostra o aviso de privacidade antes de pedir a câmera, e cancelar não acessa a câmera', async () => {
    render(<ControleGestos />)
    await userEvent.click(screen.getByRole('button', { name: /Ativar gestos/ }))
    expect(screen.getByRole('dialog')).toHaveTextContent('processado só neste dispositivo')
    expect(getUserMedia).not.toHaveBeenCalled()
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(getUserMedia).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Scenario: Usuário ativa gestos e concede permissão', async () => {
    getUserMedia.mockResolvedValue(streamFalso().stream)
    render(<ControleGestos />)
    await ativarPelaInterface()
    expect(await screen.findByTestId('camera-ativa')).toHaveTextContent('Câmera ativa')
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }))
    expect(carregarDetector).toHaveBeenCalledTimes(1)
    expect(useGestos.getState().estado).toBe('ativo')
  })
})

describe('Requirement: Desativação da câmera', () => {
  it('Scenario: Usuário desativa gestos (tracks param, indicador some, mouse segue)', async () => {
    const { stream, track } = streamFalso()
    getUserMedia.mockResolvedValue(stream)
    render(
      <>
        <ControleGestos />
        <ListaCatalogo />
      </>,
    )
    await ativarPelaInterface()
    await screen.findByTestId('camera-ativa')
    await userEvent.click(screen.getByRole('button', { name: 'Desativar gestos' }))
    expect(track.stop).toHaveBeenCalled()
    expect(screen.queryByTestId('camera-ativa')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Camiseta Básica' }))
    expect(useLoja.getState().saldos['camiseta-basica']).toBe(4)
  })
})

describe('Requirement: Falha ou indisponibilidade da câmera', () => {
  it('Scenario: Permissão negada', async () => {
    getUserMedia.mockRejectedValue(Object.assign(new Error('negado'), { name: 'NotAllowedError' }))
    render(
      <>
        <ControleGestos />
        <ListaCatalogo />
      </>,
    )
    await ativarPelaInterface()
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGENS_ERRO.negada)
    expect(screen.getByRole('button', { name: /Ativar gestos/ })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: 'Adicionar Camiseta Básica' }))
    expect(useLoja.getState().saldos['camiseta-basica']).toBe(4)
  })

  it('sem câmera conectada', async () => {
    getUserMedia.mockRejectedValue(Object.assign(new Error('x'), { name: 'NotFoundError' }))
    render(<ControleGestos />)
    await ativarPelaInterface()
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGENS_ERRO.semCamera)
  })

  it('navegador sem suporte à câmera', async () => {
    Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })
    render(<ControleGestos />)
    await ativarPelaInterface()
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGENS_ERRO.semSuporte)
  })

  it('Scenario: Modelo não carrega (câmera é liberada e o controle volta ao inicial)', async () => {
    const { stream, track } = streamFalso()
    getUserMedia.mockResolvedValue(stream)
    carregarDetector.mockRejectedValue(new Error('falhou'))
    render(<ControleGestos />)
    await ativarPelaInterface()
    expect(await screen.findByRole('alert')).toHaveTextContent(MENSAGENS_ERRO.modelo)
    expect(track.stop).toHaveBeenCalled()
    expect(useGestos.getState().estado).toBe('desligado')
    expect(screen.getByRole('button', { name: /Ativar gestos/ })).toBeEnabled()
  })
})
