import { expect, test } from '@playwright/test'
import { abrirLoja, clicarPeca, pontoDaPeca } from './apoio'

test.beforeEach(async ({ page }) => abrirLoja(page))

test('cena mostra todas as peças com o saldo semente', async ({ page }) => {
  await expect(page.locator('[data-testid^="rotulo-"]')).toHaveCount(12)
  await expect(page.getByTestId('rotulo-camiseta-basica')).toHaveText('5')
  await expect(page.getByTestId('rotulo-jaqueta-jeans')).toHaveAttribute('data-nivel', 'baixo')
})

test('clique em peça disponível baixa 1 e sincroniza cena, catálogo e carrinho em até 200 ms', async ({ page }) => {
  const inicio = Date.now()
  await clicarPeca(page, 'camiseta-basica')
  await expect(page.getByTestId('rotulo-camiseta-basica')).toHaveText('4', { timeout: 200 })
  expect(Date.now() - inicio).toBeLessThan(1000)
  await expect(page.getByTestId('saldo-camiseta-basica')).toHaveText('4')
  await expect(page.getByTestId('contador-carrinho')).toContainText('1')
  await expect(page.getByTestId('carrinho-camiseta-basica')).toContainText('x1')
})

test('clique em peça esgotada não altera o carrinho e mostra "Esgotado"', async ({ page }) => {
  await clicarPeca(page, 'jaqueta-jeans')
  await expect(page.getByTestId('rotulo-jaqueta-jeans')).toHaveText('Esgotado')
  await expect(page.getByTestId('rotulo-jaqueta-jeans')).toHaveAttribute('data-nivel', 'esgotado')
  await clicarPeca(page, 'jaqueta-jeans')
  await expect(page.getByText('Esgotado: Jaqueta Jeans')).toBeVisible()
  await expect(page.getByTestId('contador-carrinho')).toContainText('1')
})

test('remoção pelo carrinho libera peça esgotada na cena em até 200 ms', async ({ page }) => {
  await clicarPeca(page, 'jaqueta-jeans')
  await expect(page.getByTestId('rotulo-jaqueta-jeans')).toHaveText('Esgotado')
  await page.getByRole('button', { name: 'Remover 1 Jaqueta Jeans' }).click()
  await expect(page.getByTestId('rotulo-jaqueta-jeans')).toHaveText('1', { timeout: 200 })
  await expect(page.getByTestId('rotulo-jaqueta-jeans')).toHaveAttribute('data-nivel', 'baixo')
})

test('seleção pela lista do catálogo reflete na cena', async ({ page }) => {
  await page.getByRole('button', { name: 'Adicionar Vestido Preto' }).click()
  await expect(page.getByTestId('rotulo-vestido-preto')).toHaveText('5', { timeout: 200 })
})

test('ponteiro sobre peça destaca e mostra nome, preço e saldo', async ({ page }) => {
  const { x, y } = await pontoDaPeca(page, 'saia-midi')
  await page.mouse.move(x, y)
  const tooltip = page.getByTestId('tooltip-peca')
  await expect(tooltip).toContainText('Saia Midi')
  await expect(tooltip).toContainText('R$')
  await expect(tooltip).toContainText('1 em estoque')
})

test('arrastar gira a câmera sem selecionar, e "Vista inicial" restaura', async ({ page }) => {
  const inicial = await page.evaluate(() => window.__gemeo.posicaoCamera())
  const cena = page.getByTestId('cena')
  const caixa = (await cena.boundingBox())!
  await page.mouse.move(caixa.x + 100, caixa.y + caixa.height - 80)
  await page.mouse.down()
  await page.mouse.move(caixa.x + 400, caixa.y + caixa.height - 120, { steps: 10 })
  await page.mouse.up()
  const movida = await page.evaluate(() => window.__gemeo.posicaoCamera())
  expect(movida).not.toEqual(inicial)
  await expect(page.getByTestId('contador-carrinho')).toContainText('0')

  await page.getByRole('button', { name: 'Vista inicial' }).click()
  await page.waitForTimeout(500) // garante que nenhuma inércia continua movendo a câmera
  const restaurada = (await page.evaluate(() => window.__gemeo.posicaoCamera()))!
  restaurada.forEach((v, i) => expect(v).toBeCloseTo(inicial![i], 3))
})

test('estado sobrevive ao recarregar a página', async ({ page }) => {
  await clicarPeca(page, 'camiseta-basica')
  await expect(page.getByTestId('rotulo-camiseta-basica')).toHaveText('4')
  await page.reload()
  await expect(page.getByTestId('rotulo-camiseta-basica')).toHaveText('4', { timeout: 20_000 })
})
