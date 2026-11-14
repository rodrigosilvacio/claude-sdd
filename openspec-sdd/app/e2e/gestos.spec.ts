import { expect, test, type Page } from '@playwright/test'
import { abrirLoja, pontoDaPeca } from './apoio'

declare global {
  interface Window {
    __gestos: { usarDetectorRoteirizado: () => void; definirMaos: (m: unknown[]) => void }
  }
}

const MARGEM = 0.1 // CONFIG_GESTOS.margemQuadro

/** Monta 21 landmarks com a ponta do indicador no ponto da tela pedido e a pinça aberta ou fechada. */
async function maoNaTela(page: Page, x: number, y: number, fechada: boolean) {
  const rect = (await page.getByTestId('cena').boundingBox())!
  const cx = (x - rect.x) / rect.width
  const cy = (y - rect.y) / rect.height
  // Inverso do mapeamento do pipeline (espelho + margem).
  const lx = 1 - MARGEM - cx * (1 - 2 * MARGEM)
  const ly = MARGEM + cy * (1 - 2 * MARGEM)
  const abertura = fechada ? 0.1 : 0.8
  const lm = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.7, z: 0 }))
  lm[0] = { x: 0.5, y: 0.8, z: 0 }
  lm[9] = { x: 0.5, y: 0.6, z: 0 }
  lm[8] = { x: lx, y: ly, z: 0 }
  lm[4] = { x: lx + abertura * 0.2, y: ly, z: 0 }
  await page.evaluate((landmarks) => window.__gestos.definirMaos([{ lado: 'Right', landmarks }]), lm)
}

async function ativarGestos(page: Page) {
  await page.getByRole('button', { name: /Ativar gestos/ }).click()
  await page.getByRole('button', { name: 'Permitir câmera' }).click()
  await expect(page.getByTestId('camera-ativa')).toBeVisible({ timeout: 20_000 })
}

test.describe('seleção por gestos com detector roteirizado', () => {
  test.beforeEach(async ({ page }) => {
    await abrirLoja(page)
    await page.evaluate(() => window.__gestos.usarDetectorRoteirizado())
    await ativarGestos(page)
  })

  test('cursor segue o indicador, destaca a peça e a pinça seleciona uma vez por gesto', async ({ page }) => {
    const { x, y } = await pontoDaPeca(page, 'vestido-preto') // saldo 6
    await maoNaTela(page, x, y, false)
    const cursor = page.getByTestId('cursor-mao')
    await expect(cursor).toBeVisible()
    await expect(page.getByTestId('tooltip-peca')).toContainText('Vestido Preto', { timeout: 3000 })

    // pinça mantida por mais de 1 s conta só 1
    await maoNaTela(page, x, y, true)
    await expect(cursor).toHaveAttribute('data-pinca', 'fechada')
    await expect(page.getByTestId('rotulo-vestido-preto')).toHaveText('5')
    await page.waitForTimeout(1200)
    await expect(page.getByTestId('rotulo-vestido-preto')).toHaveText('5')

    // abre, espera o bloqueio e fecha de novo: segunda seleção
    await maoNaTela(page, x, y, false)
    await expect(cursor).toHaveAttribute('data-pinca', 'aberta')
    await page.waitForTimeout(700)
    await maoNaTela(page, x, y, true)
    await expect(page.getByTestId('rotulo-vestido-preto')).toHaveText('4')
    await expect(page.getByTestId('carrinho-vestido-preto')).toContainText('x2')
  })

  test('pinça sobre peça esgotada mostra "Esgotado" e não altera o carrinho', async ({ page }) => {
    await page.getByRole('button', { name: 'Adicionar Saia Midi' }).click() // saldo 1 -> 0
    const { x, y } = await pontoDaPeca(page, 'saia-midi')
    await maoNaTela(page, x, y, false)
    await expect(page.getByTestId('tooltip-peca')).toContainText('Saia Midi', { timeout: 3000 })
    await maoNaTela(page, x, y, true)
    await expect(page.getByText('Esgotado: Saia Midi')).toBeVisible()
    await expect(page.getByTestId('contador-carrinho')).toContainText('1')
  })

  test('pinça fora de qualquer peça não seleciona', async ({ page }) => {
    const rect = (await page.getByTestId('cena').boundingBox())!
    await maoNaTela(page, rect.x + rect.width / 2, rect.y + rect.height - 30, false)
    await expect(page.getByTestId('cursor-mao')).toBeVisible()
    await maoNaTela(page, rect.x + rect.width / 2, rect.y + rect.height - 30, true)
    await page.waitForTimeout(300)
    await expect(page.getByTestId('contador-carrinho')).toContainText('0')
  })

  test('cursor some quando a mão sai do campo', async ({ page }) => {
    const { x, y } = await pontoDaPeca(page, 'vestido-preto')
    await maoNaTela(page, x, y, false)
    await expect(page.getByTestId('cursor-mao')).toBeVisible()
    await page.evaluate(() => window.__gestos.definirMaos([]))
    await expect(page.getByTestId('cursor-mao')).toHaveCount(0, { timeout: 2000 })
    await expect(page.getByTestId('tooltip-peca')).toHaveCount(0)
  })

  test('desativar libera a câmera e o mouse continua selecionando', async ({ page }) => {
    await page.getByRole('button', { name: 'Desativar gestos' }).click()
    await expect(page.getByTestId('camera-ativa')).toHaveCount(0)
    const ativas = await page.evaluate(() =>
      Array.from(document.querySelectorAll('video')).some((v) => (v.srcObject as MediaStream | null)?.active),
    )
    expect(ativas).toBe(false)
    const { x, y } = await pontoDaPeca(page, 'camiseta-basica')
    await page.mouse.click(x, y)
    await expect(page.getByTestId('rotulo-camiseta-basica')).toHaveText('4')
  })
})
