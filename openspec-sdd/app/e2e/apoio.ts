import { expect, type Page } from '@playwright/test'

declare global {
  interface Window {
    __gemeo: {
      projetarPeca: (id: string) => { x: number; y: number } | null
      posicaoCamera: () => [number, number, number] | null
    }
  }
}

export async function abrirLoja(page: Page) {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
  await expect(page.getByTestId('rotulo-jaqueta-jeans')).toBeVisible({ timeout: 20_000 })
  await page.waitForFunction(() => window.__gemeo?.projetarPeca('jaqueta-jeans') != null)
}

export async function pontoDaPeca(page: Page, id: string) {
  const pt = await page.evaluate((pid) => window.__gemeo.projetarPeca(pid), id)
  if (!pt) throw new Error(`peça ${id} sem projeção`)
  return pt
}

export async function clicarPeca(page: Page, id: string) {
  const { x, y } = await pontoDaPeca(page, id)
  await page.mouse.click(x, y)
}
