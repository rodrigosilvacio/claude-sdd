# Design

## Context

Projeto greenfield: `openspec-sdd/` contém apenas a estrutura do OpenSpec, sem código nem specs vigentes. Motivação e escopo em proposal.md; comportamento em `specs/estoque-carrinho`, `specs/gemeo-digital-loja` e `specs/selecao-por-gestos`.

Restrições que moldam a abordagem:

- Sem backend: tudo roda no navegador, para que a demo suba com um único comando.
- Câmera exige contexto seguro (`localhost` ou HTTPS) e consentimento explícito.
- Três meios de entrada (mouse, toque, mão) precisam respeitar exatamente as mesmas regras de estoque.

## Goals / Non-Goals

**Goals:**

- Uma única fonte da verdade para estoque e carrinho, consumida pela cena 3D, pelo painel de carrinho e pelo pipeline de gestos.
- Regras de estoque em funções puras, testáveis sem DOM, câmera ou WebGL.
- Rastreamento de mãos a pelo menos 20 fps em notebook comum, sem travar a renderização.

**Non-Goals:**

- Modelos 3D realistas de roupas: peças são primitivas estilizadas (cabide com plano colorido, pilha de caixas dobradas).
- Editor de layout da loja: o layout vem de arquivo semente.
- Calibração por usuário dos gestos além de constantes ajustáveis em código.

## Decisions

### D1. Stack: React + Vite + TypeScript, aplicação em `openspec-sdd/app/`

Vite dá servidor local em `localhost` (contexto seguro para câmera) e build estático. TypeScript ajuda a manter o contrato entre estoque, cena e gestos.
Alternativas: Next.js (SSR desnecessário, atrapalha APIs de câmera e WebGL); HTML puro (sem estrutura para três módulos interligados).

### D2. Estado: store Zustand com reducer puro de domínio

```
            +-------------------------------+
            |  dominio/estoque.ts (puro)    |
            |  selecionar / remover /       |
            |  esvaziar / resetar           |
            +---------------+---------------+
                            |
            +---------------v---------------+
            |   store (Zustand + persist)   | <--> localStorage
            +---+-----------+-----------+---+
                |           |           |
          +-----v---+ +-----v-----+ +---v----------+
          | Cena 3D | | Carrinho  | | Gestos       |
          | (R3F)   | | (painel)  | | (MediaPipe)  |
          +---------+ +-----------+ +--------------+
```

O domínio expõe funções `(estado, ação) => resultado` que retornam novo estado ou motivo de recusa (`ESGOTADO`, `PECA_INEXISTENTE`). Como o JavaScript do navegador é single-thread e cada ação é uma transição síncrona do store, duas seleções seguidas na última unidade são processadas em ordem e a segunda é recusada (cenário de seleções simultâneas).
Persistência via middleware `persist` com `version`; se a versão não bater ou a validação falhar (peça inexistente, saldo negativo, invariante de conservação quebrada), o estado salvo é descartado e o semente é carregado.
Alternativas: Redux Toolkit (mais cerimônia para o mesmo resultado); Context puro (re-render de toda a cena a cada mudança).

### D3. Gêmeo digital: three.js via React Three Fiber + drei

R3F integra a cena ao estado React; drei fornece `OrbitControls` com limites, `Html`/`Text` para rótulos de saldo e utilitários de raycasting. Cada peça é um componente que assina apenas o seu saldo no store (seletor por id), garantindo atualização abaixo de 200 ms sem re-render global.
Estados visuais: normal, saldo baixo (1 ou 2, cor de alerta), esgotado (dessaturado e rótulo "Esgotado"), destacado (contorno) e confirmação (pulso curto).
Layout semente em `app/src/dados/layout.ts`: araras e prateleiras com posição e slots; catálogo em `app/src/dados/catalogo.ts` referencia o slot de cada peça.
Alternativa: cena 2D em SVG/Canvas (mais simples, mas perde o caráter de gêmeo digital pedido).

### D4. Mapeamento de mãos: MediaPipe Tasks Vision `HandLandmarker`

Executa no navegador (WASM + GPU quando disponível), retorna 21 landmarks por mão e roda em modo `VIDEO` com `detectForVideo` no loop de `requestAnimationFrame`. Modelo e WASM ficam em `app/public/` para não depender de CDN em tempo de execução e reforçar que nada sai do dispositivo.
Alternativas: TensorFlow.js handpose (mais pesado e menos mantido); servidor Python com OpenCV (viola o requisito de processamento local e exige backend).

### D5. Do landmark à seleção: pipeline de gestos

```
 webcam --> HandLandmarker --> landmark 8 (indicador) --> espelha X --> suaviza (EMA)
                          \                                              |
                           \-> dist(4, 8) / tamanho da mão               v
                                     |                         cursor em tela (x, y)
                                     v                                   |
                            maquina de pinca                    raycast na cena
                                     |                                   |
                                     +------- evento "pinca" ------------+
                                                     |
                                                     v
                                      store.selecionar(pecaSobCursor)
```

- Cursor: coordenada normalizada do landmark 8, eixo X espelhado, suavizada por média móvel exponencial (alfa ~0,35), convertida em pixels do canvas e usada no mesmo raycaster do mouse. Assim mouse, toque e mão compartilham um único caminho de seleção.
- Pinça: distância entre landmarks 4 e 8 normalizada pela distância entre 0 e 9 (escala da mão), com histerese: fecha abaixo de 0,25 e só reabre acima de 0,40.
- Máquina de estados: `ABERTA -> PROXIMA -> FECHADA(dispara 1 seleção) -> ABERTA`, com bloqueio de 600 ms após disparo, atendendo "uma seleção por gesto".
- Mão ativa: a primeira detectada é mantida pelo índice de handedness enquanto continuar presente; perda por mais de 500 ms esconde o cursor.
- Constantes em `app/src/gestos/config.ts` para ajuste fino.

Alternativa de gesto: tempo de permanência (dwell) sobre a peça. Descartada como gatilho principal por gerar seleções acidentais enquanto o usuário só observa; pode virar opção futura de acessibilidade.

### D6. Privacidade e LGPD

O `<video>` existe apenas como fonte em memória (miniatura opcional e espelhada para o usuário se orientar). Nenhum quadro é desenhado em canvas persistente, enviado ou salvo; o store não guarda landmarks. Ao desativar, todas as tracks do `MediaStream` recebem `stop()`. O aviso antes do `getUserMedia` explica isso em linguagem simples.

### D7. Testes

- Vitest para o domínio de estoque (todos os cenários de `estoque-carrinho`, incluindo teste de propriedade da invariante de conservação com sequências aleatórias) e para a máquina de pinça/suavização com sequências de landmarks sintéticas.
- Testes de componente (Testing Library) para carrinho, mensagens de erro de câmera e controle de gestos, com `getUserMedia` e `HandLandmarker` simulados.
- Playwright para fluxo de ponta a ponta com mouse na cena e verificação de sincronização cena/carrinho; câmera simulada com `--use-fake-device-for-media-stream`.

## Risks / Trade-offs

- [Iluminação ruim ou fundo poluído reduz a precisão das mãos] → histerese na pinça, feedback visual de "pinça próxima" e mouse sempre disponível.
- [Pinça acidental durante movimento rápido] → bloqueio de 600 ms e exigência de abrir a mão antes de nova seleção.
- [Desempenho: WebGL e inferência competindo pela GPU] → inferência limitada a ~30 fps e desacoplada do render; sombras e pós-processamento desligados.
- [Modelo e WASM somam alguns MB] → carregamento preguiçoso só ao clicar em "Ativar gestos".
- [Navegador sem WebGL ou sem câmera] → mensagem clara e lista do catálogo como alternativa de seleção.
- [Estoque por peça, sem variação de tamanho] → simplificação consciente do MVP; o domínio usa `id` de peça como chave, o que permite migrar para SKU depois.

## Migration Plan

Não há sistema anterior. Deploy é `npm run build` gerando estático; rollback é voltar ao build anterior. Mudanças futuras no formato salvo incrementam a `version` do `persist`, e o estado antigo é descartado pela regra de estado inválido.

## Open Questions

- Paleta visual e identidade da loja (nome, cores) podem ser definidas depois sem impacto nas specs.
- Quantidade e mix de peças do catálogo semente (proposta inicial: 12 peças em 3 araras e 2 prateleiras).
