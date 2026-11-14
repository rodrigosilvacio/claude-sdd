# Tasks

## 1. Setup do projeto

- [x] 1.1 Criar `openspec-sdd/app/` com Vite + React + TypeScript e verificar que `npm run dev` serve a página em `localhost`
- [x] 1.2 Adicionar dependências (zustand, three, @react-three/fiber, @react-three/drei, @mediapipe/tasks-vision, vitest, @testing-library/react, @playwright/test) e verificar que `npm install` e `npm run build` concluem sem erro
- [x] 1.3 Configurar scripts `test`, `test:e2e` e `lint` no `package.json` e verificar que `npm test` roda (mesmo sem testes) com saída zero
- [x] 1.4 Copiar modelo `hand_landmarker.task` e arquivos WASM do MediaPipe para `app/public/mediapipe/` e verificar que são servidos localmente pelo dev server

## 2. Domínio de estoque e carrinho

- [x] 2.1 Criar dados semente em `app/src/dados/catalogo.ts` e `app/src/dados/layout.ts` (12 peças, 3 araras, 2 prateleiras) e verificar com teste que todo slot referenciado existe e todo saldo é inteiro maior ou igual a zero
- [x] 2.2 Implementar funções puras `selecionar`, `remover`, `esvaziar` e `resetar` em `app/src/dominio/estoque.ts`, com recusa `ESGOTADO`, e verificar com testes Vitest cobrindo cada cenário da spec `estoque-carrinho`
- [x] 2.3 Adicionar teste de propriedade com sequências aleatórias de operações e verificar a invariante "saldo + carrinho = semente" e saldo nunca negativo
- [x] 2.4 Criar store Zustand com `persist` versionado e validação do estado salvo, e verificar com testes que recarregar mantém o estado e que estado corrompido cai no semente
- [x] 2.5 Documentar regras do domínio em `app/README.md` (seção Estoque) e verificar que os exemplos citados batem com os testes

## 3. Interface de carrinho e catálogo

- [x] 3.1 Implementar painel de carrinho (lista, quantidade, remover 1, esvaziar, contador) e verificar com Testing Library que remover devolve a unidade e esvaziar zera o carrinho
- [x] 3.2 Implementar lista do catálogo como alternativa acessível de seleção, com estado "Esgotado" desabilitado, e verificar com teste de componente
- [x] 3.3 Implementar "Resetar loja" com diálogo de confirmação e verificar com teste os cenários de reset confirmado e cancelado

## 4. Gêmeo digital da loja

- [x] 4.1 Montar a cena R3F com piso, araras e prateleiras a partir do layout semente e verificar visualmente que todas aparecem e que peça sem slot gera aviso no console
- [x] 4.2 Criar componente de peça que assina só o próprio saldo e exibe estados normal, saldo baixo e esgotado, e verificar com teste que muda de estado conforme o saldo
- [x] 4.3 Configurar `OrbitControls` com limites e botão "Vista inicial" e verificar manualmente que a câmera volta ao enquadramento inicial
- [x] 4.4 Implementar camada de ponteiro unificada (raycast por coordenada de tela) para clique e toque, com destaque, tooltip de nome/preço/saldo e animação de confirmação, e verificar que clicar em peça disponível baixa 1 e em esgotada mostra "Esgotado"
- [x] 4.5 Escrever teste Playwright que clica em peças na cena e verifica sincronização cena e carrinho em até 200 ms, incluindo remoção pelo carrinho liberando peça esgotada

## 5. Seleção por gestos

- [x] 5.1 Implementar `app/src/gestos/config.ts`, suavização EMA e máquina de pinça com histerese e bloqueio de 600 ms, e verificar com testes Vitest usando sequências sintéticas de landmarks (pinça mantida conta 1, duas pinças contam 2, mão ausente por 500 ms esconde cursor)
- [x] 5.2 Implementar controle "Ativar gestos" com aviso de privacidade, carregamento preguiçoso do `HandLandmarker`, indicador de câmera ativa e "Desativar gestos" que chama `stop()` em todas as tracks, e verificar com teste de componente usando `getUserMedia` simulado
- [ ] 5.3 Ligar o loop de detecção (`detectForVideo` em `requestAnimationFrame`, limitado a ~30 fps) ao cursor de mão na cena e à camada de ponteiro unificada, e verificar manualmente com webcam que a pinça seleciona a peça sob o cursor
- [ ] 5.4 Implementar feedback visual do cursor (aberta, próxima, fechada) e seleção da mão ativa única, e verificar manualmente com duas mãos no campo
- [x] 5.5 Tratar permissão negada, câmera indisponível, navegador sem suporte e falha do modelo com mensagens claras, e verificar com testes de componente que mouse e toque seguem funcionando
- [x] 5.6 Verificar privacidade com teste Playwright (câmera falsa) que monitora requisições de rede e `localStorage` durante o rastreamento e confirma ausência de quadros ou landmarks
- [x] 5.7 Documentar uso dos gestos, requisitos (localhost/HTTPS, iluminação) e aviso de privacidade em `app/README.md` e verificar que as instruções funcionam em uma máquina limpa

## 6. Integração final

- [x] 6.1 Rodar `npm test`, `npm run test:e2e` e `npm run build` e verificar que todos passam
- [ ] 6.2 Executar roteiro de demo ponta a ponta (selecionar por mouse, por pinça, esgotar peça, remover do carrinho, resetar loja) e verificar que cada passo bate com os cenários das três specs
- [x] 6.3 Rodar `openspec validate loja-estoque-mvp --strict` e verificar que não há erros nem avisos

## Workflow follow-up

- Arquivar a change com `/openspec-archive-change` após revisão, consolidando as três specs em `openspec/specs/`.
- Verificar o resultado arquivado com `openspec list --specs`.
