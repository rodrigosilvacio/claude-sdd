import { describe, expect, it } from 'vitest'
import { CONFIG_GESTOS } from './config'
import { distanciaPinca, MaquinaPinca, PipelineGestos, Suavizador, type MaoDetectada, type Ponto } from './pipeline'

/**
 * Gera 21 landmarks sintéticos: pulso em (0.5, 0.8), base do médio 0.2 acima
 * (escala da mão = 0.2), ponta do indicador em (x, y) e polegar a `abertura * 0.2` do indicador.
 */
function mao(x: number, y: number, abertura: number, lado = 'Right'): MaoDetectada {
  const lm: Ponto[] = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.7 }))
  lm[0] = { x: 0.5, y: 0.8 }
  lm[9] = { x: 0.5, y: 0.6 }
  lm[8] = { x, y }
  lm[4] = { x: x + abertura * 0.2, y }
  return { lado, landmarks: lm }
}

const ABERTA = 0.8
const FECHADA = 0.1

describe('distanciaPinca', () => {
  it('normaliza pela escala da mão', () => {
    expect(distanciaPinca(mao(0.5, 0.5, 0.5).landmarks)).toBeCloseTo(0.5)
    expect(distanciaPinca(mao(0.5, 0.5, FECHADA).landmarks)).toBeCloseTo(FECHADA)
  })
})

describe('MaquinaPinca', () => {
  it('passa por aberta, próxima e fechada com histerese', () => {
    const m = new MaquinaPinca()
    expect(m.atualizar(0.8, 0).estado).toBe('aberta')
    expect(m.atualizar(0.3, 10)).toEqual({ estado: 'proxima', disparou: false })
    expect(m.atualizar(0.2, 20)).toEqual({ estado: 'fechada', disparou: true })
    // entre os limiares continua fechada (histerese)
    expect(m.atualizar(0.3, 30)).toEqual({ estado: 'fechada', disparou: false })
    expect(m.atualizar(0.5, 40).estado).toBe('aberta')
  })

  it('não dispara de novo antes de 600 ms mesmo reabrindo', () => {
    const m = new MaquinaPinca()
    expect(m.atualizar(0.1, 0).disparou).toBe(true)
    m.atualizar(0.8, 100)
    expect(m.atualizar(0.1, 300).disparou).toBe(false)
    // continua fechada após o bloqueio: precisa reabrir antes de valer de novo
    expect(m.atualizar(0.1, 900).disparou).toBe(false)
    m.atualizar(0.8, 950)
    expect(m.atualizar(0.1, 1000).disparou).toBe(true)
  })
})

describe('Suavizador', () => {
  it('aproxima gradualmente do alvo', () => {
    const s = new Suavizador(0.5)
    expect(s.aplicar({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 })
    expect(s.aplicar({ x: 1, y: 1 })).toEqual({ x: 0.5, y: 0.5 })
    expect(s.aplicar({ x: 1, y: 1 })).toEqual({ x: 0.75, y: 0.75 })
  })
})

/** Roda uma sequência de quadros a cada 33 ms e conta disparos. */
function rodar(p: PipelineGestos, quadros: MaoDetectada[][], inicio = 0) {
  let disparos = 0
  let ultima = p.processar([], inicio)
  quadros.forEach((maos, i) => {
    ultima = p.processar(maos, inicio + (i + 1) * 33)
    if (ultima.disparou) disparos++
  })
  return { disparos, ultima }
}

describe('Requirement: Cursor guiado pela mão', () => {
  it('Scenario: Mão detectada (movimento espelhado)', () => {
    const p = new PipelineGestos()
    const esquerdaNaCamera = p.processar([mao(0.2, 0.5, ABERTA)], 0).cursor!
    p.reiniciar()
    const direitaNaCamera = p.processar([mao(0.8, 0.5, ABERTA)], 0).cursor!
    // x pequeno na imagem da câmera = lado direito do usuário = direita da tela
    expect(esquerdaNaCamera.x).toBeGreaterThan(direitaNaCamera.x)
    expect(esquerdaNaCamera.y).toBeCloseTo(0.5)
  })

  it('cursor é suavizado e fica dentro de 0..1', () => {
    const p = new PipelineGestos()
    p.processar([mao(0.5, 0.5, ABERTA)], 0)
    const c = p.processar([mao(0.0, 1.0, ABERTA)], 33).cursor!
    expect(c.x).toBeGreaterThan(0.5)
    expect(c.x).toBeLessThan(1)
    for (let i = 0; i < 40; i++) p.processar([mao(0.0, 1.0, ABERTA)], 66 + i * 33)
    const final = p.processar([mao(0.0, 1.0, ABERTA)], 2000).cursor!
    expect(final.x).toBeCloseTo(1, 2)
    expect(final.y).toBeCloseTo(1, 2)
  })

  it('Scenario: Mão sai do campo (cursor some após 500 ms)', () => {
    const p = new PipelineGestos()
    p.processar([mao(0.5, 0.5, ABERTA)], 0)
    expect(p.processar([], 400).cursor).not.toBeNull()
    expect(p.processar([], 501).cursor).toBeNull()
  })

  it('Scenario: Mais de uma mão (mantém a primeira enquanto detectada)', () => {
    const p = new PipelineGestos()
    const a = p.processar([mao(0.2, 0.5, ABERTA, 'Right'), mao(0.8, 0.5, ABERTA, 'Left')], 0).cursor!
    // mesmo com a ordem invertida, continua seguindo a mão "Right"
    let c = a
    for (let i = 1; i <= 10; i++) c = p.processar([mao(0.8, 0.5, ABERTA, 'Left'), mao(0.2, 0.5, ABERTA, 'Right')], i * 33).cursor!
    expect(c.x).toBeCloseTo(a.x, 5)
  })
})

describe('Requirement: Uma seleção por gesto', () => {
  it('Scenario: Pinça mantida por 3 segundos conta 1', () => {
    const p = new PipelineGestos()
    const quadros = [...Array(5).fill([mao(0.5, 0.5, ABERTA)]), ...Array(91).fill([mao(0.5, 0.5, FECHADA)])]
    expect(rodar(p, quadros).disparos).toBe(1)
  })

  it('Scenario: Duas pinças distintas com mais de 600 ms contam 2', () => {
    const p = new PipelineGestos()
    const quadros = [
      ...Array(3).fill([mao(0.5, 0.5, ABERTA)]),
      ...Array(5).fill([mao(0.5, 0.5, FECHADA)]),
      ...Array(20).fill([mao(0.5, 0.5, ABERTA)]), // ~660 ms aberta
      ...Array(5).fill([mao(0.5, 0.5, FECHADA)]),
    ]
    expect(rodar(p, quadros).disparos).toBe(2)
  })

  it('pinça repetida rápido demais (< 600 ms) conta 1', () => {
    const p = new PipelineGestos()
    const quadros = [
      ...Array(2).fill([mao(0.5, 0.5, ABERTA)]),
      ...Array(3).fill([mao(0.5, 0.5, FECHADA)]),
      ...Array(3).fill([mao(0.5, 0.5, ABERTA)]),
      ...Array(3).fill([mao(0.5, 0.5, FECHADA)]),
    ]
    expect(rodar(p, quadros).disparos).toBe(1)
  })
})

describe('Requirement: Feedback do gesto', () => {
  it('Scenario: Pinça reconhecida muda o estado no mesmo quadro', () => {
    const p = new PipelineGestos()
    p.processar([mao(0.5, 0.5, ABERTA)], 0)
    expect(p.processar([mao(0.5, 0.5, 0.3)], 33).pinca).toBe('proxima')
    const s = p.processar([mao(0.5, 0.5, FECHADA)], 66)
    expect(s).toMatchObject({ pinca: 'fechada', disparou: true })
  })
})

it('config usa os valores do design', () => {
  expect(CONFIG_GESTOS).toMatchObject({ limiarFechar: 0.25, limiarAbrir: 0.4, bloqueioMs: 600, timeoutMaoMs: 500 })
})
