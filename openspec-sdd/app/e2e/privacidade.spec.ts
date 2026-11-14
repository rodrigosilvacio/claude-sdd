import { expect, test } from '@playwright/test'
import { abrirLoja } from './apoio'

test('Requirement: Privacidade do vídeo — nenhum quadro ou dado das mãos sai do navegador', async ({ page, baseURL }) => {
  test.setTimeout(90_000)
  await abrirLoja(page)
  await page.getByRole('button', { name: 'Adicionar Camiseta Básica' }).click() // grava o estado da loja

  const requisicoes: { url: string; metodo: string; corpo: number }[] = []
  page.on('request', (r) => requisicoes.push({ url: r.url(), metodo: r.method(), corpo: r.postDataBuffer()?.length ?? 0 }))

  // Detector real (MediaPipe) sobre a câmera falsa do Chromium.
  await page.getByRole('button', { name: /Ativar gestos/ }).click()
  await page.getByRole('button', { name: 'Permitir câmera' }).click()
  await expect(page.getByTestId('camera-ativa')).toBeVisible({ timeout: 60_000 })
  await page.waitForTimeout(3000) // vários quadros processados

  // Só o próprio servidor da loja foi acessado, e sem envio de dados.
  const origem = new URL(baseURL!).origin
  const externas = requisicoes.filter((r) => !r.url.startsWith(origem) && !r.url.startsWith('blob:') && !r.url.startsWith('data:'))
  expect(externas).toEqual([])
  expect(requisicoes.filter((r) => r.metodo !== 'GET' || r.corpo > 0)).toEqual([])
  // O modelo e o WASM vieram do servidor local.
  expect(requisicoes.some((r) => r.url.endsWith('/mediapipe/hand_landmarker.task'))).toBe(true)

  // Nada de quadros ou landmarks persistidos no navegador.
  const armazenado = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    sessao: Object.keys(sessionStorage),
    conteudo: localStorage.getItem('loja-estoque') ?? '',
  }))
  expect(armazenado.local).toEqual(['loja-estoque'])
  expect(armazenado.sessao).toEqual([])
  expect(armazenado.conteudo).not.toMatch(/landmark|cursor|pinca|data:image/i)
  expect(Object.keys(JSON.parse(armazenado.conteudo).state).sort()).toEqual(['carrinho', 'saldos'])

  await page.getByRole('button', { name: 'Desativar gestos' }).click()
  await expect(page.getByTestId('camera-ativa')).toHaveCount(0)
})
