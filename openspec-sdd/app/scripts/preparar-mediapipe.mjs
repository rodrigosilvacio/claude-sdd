// Copia o runtime WASM do MediaPipe e baixa o modelo de mãos para public/mediapipe,
// para que tudo seja servido localmente (nenhuma dependência de CDN em tempo de execução).
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const origemWasm = join(raiz, 'node_modules/@mediapipe/tasks-vision/wasm')
const destino = join(raiz, 'public/mediapipe')
const destinoWasm = join(destino, 'wasm')
const URL_MODELO =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

mkdirSync(destinoWasm, { recursive: true })
for (const arquivo of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) {
  copyFileSync(join(origemWasm, arquivo), join(destinoWasm, arquivo))
}

const caminhoModelo = join(destino, 'hand_landmarker.task')
if (!existsSync(caminhoModelo)) {
  try {
    const resposta = await fetch(URL_MODELO)
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`)
    writeFileSync(caminhoModelo, Buffer.from(await resposta.arrayBuffer()))
    console.log('[mediapipe] modelo de mãos baixado')
  } catch (erro) {
    console.warn(`[mediapipe] não foi possível baixar o modelo (${erro.message}). Os gestos ficarão indisponíveis até rodar "npm run preparar-mediapipe" com rede.`)
  }
}
console.log('[mediapipe] arquivos prontos em public/mediapipe')
