# Guia de desenvolvimento: Loja Gêmeo Digital

Aplicação da change OpenSpec `loja-estoque-mvp`: uma loja de roupas simulada em que cada peça selecionada baixa 1 unidade do estoque. A loja aparece como um gêmeo digital em 3D, e você pode selecionar as peças com a mão, pela webcam.

## Como rodar

```bash
npm install        # também prepara os arquivos do MediaPipe em public/mediapipe
npm run dev        # abre em http://localhost:5173
```

| Script | O que faz |
|---|---|
| `npm test` | testes unitários e de componente (Vitest) |
| `npm run test:e2e` | testes de ponta a ponta (Playwright) |
| `npm run build` | checagem de tipos e build estático em `dist/` |
| `npm run preparar-mediapipe` | copia o WASM e baixa o modelo de mãos de novo |

## Estoque

Regras definidas em `openspec/changes/loja-estoque-mvp/specs/estoque-carrinho/spec.md` e implementadas como funções puras em `src/dominio/estoque.ts`.

| Ação | Efeito | Recusa |
|---|---|---|
| Selecionar peça | saldo diminui 1, carrinho aumenta 1 | `ESGOTADO` quando o saldo é 0 |
| Remover 1 do carrinho | carrinho diminui 1, saldo aumenta 1; a linha some ao chegar a 0 | `FORA_DO_CARRINHO` |
| Esvaziar carrinho | todas as unidades do carrinho voltam ao saldo | nunca |
| Resetar loja | saldos voltam ao semente e o carrinho fica vazio | nunca |

Invariante garantida por teste de propriedade: **para toda peça, saldo + quantidade no carrinho = saldo semente**, e o saldo nunca fica negativo.

Exemplo (Camiseta Básica, semente 5): selecionar duas vezes deixa saldo 3 e carrinho 2; remover uma deixa saldo 4 e carrinho 1.

O estado (saldos e carrinho) fica salvo no `localStorage` do navegador, na chave `loja-estoque`. Se o estado salvo estiver corrompido, for de outra versão ou quebrar a invariante, ele é descartado e a loja volta ao semente.

Dados semente: `src/dados/catalogo.ts` (12 peças) e `src/dados/layout.ts` (3 araras e 2 prateleiras).

## Gêmeo digital

A cena 3D (`src/cena/`) mostra 3 araras e 2 prateleiras com as 12 peças nos seus lugares. Cada peça exibe o saldo atual:

| Estado | Quando | Aparência |
|---|---|---|
| Normal | saldo 3 ou mais | cor da peça, rótulo com o saldo |
| Saldo baixo | saldo 1 ou 2 | rótulo em âmbar |
| Esgotado | saldo 0 | peça acinzentada e translúcida, rótulo "Esgotado" |

- Arraste para girar, use a roda ou a pinça do trackpad para aproximar e afastar. "Vista inicial" volta ao enquadramento original.
- Clique ou toque numa peça para adicioná-la ao carrinho. Arrastar não seleciona.
- Passar o ponteiro sobre uma peça mostra nome, preço e saldo.
- A lista do catálogo, na lateral, é uma alternativa acessível à cena.

## Seleção por gestos

1. Clique em **✋ Ativar gestos** e leia o aviso de privacidade.
2. Clique em **Permitir câmera** e autorize no navegador.
3. Aponte com o **dedo indicador**: um círculo branco segue o seu dedo como num espelho, e a peça sob ele fica destacada.
4. **Junte polegar e indicador (pinça)** para selecionar. O círculo fica âmbar quando a pinça está quase fechada e roxo quando ela é reconhecida.
5. Cada pinça seleciona **uma** unidade. Para selecionar de novo, abra os dedos e repita (intervalo mínimo de 0,6 s).
6. **Desativar gestos** desliga a câmera na hora. Mouse e toque funcionam o tempo todo.

Requisitos e dicas:

- A câmera só funciona em `localhost` ou HTTPS (exigência dos navegadores). `npm run dev` já serve em `localhost`.
- Use luz frontal e um fundo sem muita informação. Mantenha a mão a uns 40 a 80 cm da câmera.
- Os limiares de pinça, a suavização e os tempos ficam em `src/gestos/config.ts`.
- Se a câmera for negada, não existir ou o modelo não carregar, a loja avisa o motivo e continua funcionando com mouse e toque.

### Privacidade (LGPD)

- A câmera fica **desligada por padrão** e só é acessada depois do aviso e do seu clique.
- O vídeo é processado **somente no navegador** pelo MediaPipe Hands. O modelo e o WASM são servidos pela própria aplicação (`public/mediapipe/`), sem CDN.
- Nenhum quadro, imagem ou coordenada da mão é gravado, enviado pela rede ou salvo no `localStorage`. Só o estoque e o carrinho são salvos.
- O teste `e2e/privacidade.spec.ts` verifica isso com o detector real rodando: nenhuma requisição externa, nenhum envio de dados e nada além do estado da loja no armazenamento.

## Testes

```bash
npm test
npx playwright install chromium   # só na primeira vez, se não houver Chromium do Playwright
PW_CHROMIUM_PATH=/caminho/do/chromium npm run test:e2e   # PW_CHROMIUM_PATH é opcional
```

Os testes e2e rodam sobre um build com `VITE_E2E=1`, que expõe ganchos de teste (`window.__gemeo` e `window.__gestos`). O Chromium usa uma câmera falsa (`--use-fake-device-for-media-stream`). Os cenários de gesto usam um detector roteirizado que injeta landmarks sintéticos, e o teste de privacidade usa o MediaPipe real. Builds normais (`npm run build`) não incluem esses ganchos.

## Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` (na raiz do repositório):

1. roda em todo push que altera `openspec-sdd/app/`, ou manualmente em **Actions → Run workflow**;
2. instala as dependências com `MEDIAPIPE_OBRIGATORIO=1` (se o modelo de mãos não baixar, o build falha em vez de publicar sem gestos);
3. roda lint e testes unitários;
4. gera o build com `VITE_BASE=/<nome-do-repositório>/` e confere que o modelo e o WASM estão no pacote;
5. publica no Pages **somente a partir do branch padrão** do repositório (ou por disparo manual).

Configuração única no GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

Endereço: `https://<usuário>.github.io/<repositório>/`. O Pages serve em HTTPS, então a câmera funciona.

Para testar localmente como no Pages:

```bash
VITE_BASE=/claude-sdd/ npm run build
VITE_BASE=/claude-sdd/ npx vite preview   # abre em http://localhost:4173/claude-sdd/
```

Cada visitante tem o próprio estoque, salvo no navegador dele. Não há backend.
