# Spec Delta

## Purpose

Permite selecionar peças no gêmeo digital sem mouse, usando a webcam com mapeamento de mãos: o dedo indicador aponta e o gesto de pinça seleciona, com privacidade garantida por processamento local.

## ADDED Requirements

### Requirement: Ativação da câmera por consentimento
O sistema MUST manter a câmera desligada por padrão e só solicitar acesso a ela quando o usuário acionar "Ativar gestos", após exibir aviso de que o vídeo é processado apenas no dispositivo.

#### Scenario: Abertura da loja
- **WHEN** a loja é carregada
- **THEN** a câmera não é acessada
- **AND** o controle "Ativar gestos" está disponível

#### Scenario: Usuário ativa gestos e concede permissão
- **WHEN** o usuário aciona "Ativar gestos" e concede acesso à câmera
- **THEN** o rastreamento de mãos é iniciado
- **AND** um indicador visível mostra que a câmera está ativa

### Requirement: Desativação da câmera
O sistema SHALL permitir desligar os gestos a qualquer momento, encerrando o acesso à câmera e removendo o indicador de câmera ativa.

#### Scenario: Usuário desativa gestos
- **GIVEN** que os gestos estão ativos
- **WHEN** o usuário aciona "Desativar gestos"
- **THEN** a câmera é liberada e o indicador de câmera ativa desaparece
- **AND** mouse e toque continuam funcionando

### Requirement: Privacidade do vídeo
O sistema MUST processar os quadros da câmera exclusivamente no navegador, sem enviar, gravar ou armazenar imagens ou coordenadas das mãos fora da sessão em curso.

#### Scenario: Gestos ativos
- **GIVEN** que os gestos estão ativos
- **WHEN** o rastreamento está em execução
- **THEN** nenhuma requisição de rede contém quadros de vídeo ou dados das mãos
- **AND** nenhum quadro ou dado das mãos é persistido no navegador

### Requirement: Cursor guiado pela mão
O sistema SHALL exibir na cena um cursor que acompanha a ponta do dedo indicador da mão detectada, com movimento espelhado (como um espelho) e suavizado para evitar tremor.

#### Scenario: Mão detectada
- **GIVEN** que os gestos estão ativos
- **WHEN** uma mão aparece no campo da câmera
- **THEN** um cursor de mão aparece na cena na posição correspondente ao dedo indicador
- **AND** mover a mão para a direita do usuário move o cursor para a direita na tela

#### Scenario: Mão sai do campo
- **GIVEN** que o cursor de mão está visível
- **WHEN** nenhuma mão é detectada por mais de 500 ms
- **THEN** o cursor de mão desaparece e nenhuma peça fica destacada por ele

#### Scenario: Mais de uma mão
- **WHEN** duas mãos estão no campo da câmera
- **THEN** o sistema usa uma única mão como ponteiro e mantém essa escolha enquanto ela permanecer detectada

### Requirement: Seleção por gesto de pinça
O sistema SHALL selecionar a peça sob o cursor de mão quando o usuário aproximar polegar e indicador (pinça), aplicando as mesmas regras de estoque dos demais meios de entrada.

#### Scenario: Pinça sobre peça disponível
- **GIVEN** o cursor de mão sobre uma peça com saldo 3
- **WHEN** o usuário faz o gesto de pinça
- **THEN** a peça é adicionada ao carrinho e o saldo passa a 2

#### Scenario: Pinça sobre peça esgotada
- **GIVEN** o cursor de mão sobre uma peça com saldo 0
- **WHEN** o usuário faz o gesto de pinça
- **THEN** nada é adicionado ao carrinho
- **AND** o sistema exibe a mensagem "Esgotado"

#### Scenario: Pinça fora de qualquer peça
- **GIVEN** o cursor de mão sobre área sem peça
- **WHEN** o usuário faz o gesto de pinça
- **THEN** nenhuma seleção ocorre

### Requirement: Uma seleção por gesto
O sistema MUST contar no máximo uma seleção por gesto de pinça: a pinça só volta a selecionar depois que os dedos se afastam e um intervalo mínimo de 600 ms se passa.

#### Scenario: Pinça mantida
- **GIVEN** o cursor de mão sobre uma peça com saldo 5
- **WHEN** o usuário faz a pinça e a mantém fechada por 3 segundos
- **THEN** o saldo passa a 4, e não menos

#### Scenario: Duas pinças distintas
- **GIVEN** o cursor de mão sobre uma peça com saldo 5
- **WHEN** o usuário faz a pinça, abre os dedos e faz a pinça de novo após mais de 600 ms
- **THEN** o saldo passa a 3

### Requirement: Feedback do gesto
O sistema SHALL indicar visualmente no cursor de mão quando a pinça está próxima de fechar e quando foi reconhecida.

#### Scenario: Pinça reconhecida
- **WHEN** o sistema reconhece o gesto de pinça
- **THEN** o cursor de mão muda de estado visual no momento do reconhecimento

### Requirement: Falha ou indisponibilidade da câmera
O sistema MUST manter a loja totalmente utilizável por mouse e toque quando a câmera for negada, estiver indisponível, o navegador não suportar o rastreamento ou o modelo de mãos falhar ao carregar, informando o motivo ao usuário.

#### Scenario: Permissão negada
- **WHEN** o usuário aciona "Ativar gestos" e nega o acesso à câmera
- **THEN** o sistema exibe mensagem explicando que os gestos exigem a câmera
- **AND** a seleção por mouse e toque continua funcionando

#### Scenario: Modelo não carrega
- **WHEN** o modelo de detecção de mãos falha ao carregar
- **THEN** o sistema exibe mensagem de que os gestos estão indisponíveis
- **AND** o controle "Ativar gestos" volta ao estado inicial
