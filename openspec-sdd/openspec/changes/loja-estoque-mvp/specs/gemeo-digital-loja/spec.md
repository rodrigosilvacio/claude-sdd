# Spec Delta

## Purpose

Oferece um gêmeo digital da loja física: uma representação espacial navegável das araras, prateleiras e peças, que espelha em tempo real o estado do estoque e serve de superfície de seleção.

## ADDED Requirements

### Requirement: Layout espacial da loja
O sistema SHALL renderizar uma cena tridimensional da loja contendo as araras e prateleiras definidas no layout semente, com cada peça do catálogo representada na posição que o layout atribui a ela.

#### Scenario: Cena carregada
- **WHEN** a loja é carregada
- **THEN** a cena exibe todas as araras e prateleiras do layout
- **AND** cada peça do catálogo aparece exatamente uma vez, na sua posição

#### Scenario: Peça sem posição válida
- **GIVEN** uma peça cuja posição não corresponde a nenhuma arara ou prateleira do layout
- **WHEN** a loja é carregada
- **THEN** a peça continua disponível na lista do catálogo
- **AND** o sistema registra um aviso no console indicando a peça sem posição

### Requirement: Navegação na cena
O sistema SHALL permitir ao usuário girar, aproximar e afastar a câmera da cena com mouse ou toque, dentro de limites que mantenham a loja visível, e oferecer um botão para voltar à vista inicial.

#### Scenario: Voltar à vista inicial
- **GIVEN** que o usuário moveu a câmera da cena
- **WHEN** o usuário aciona "Vista inicial"
- **THEN** a câmera volta à posição e ao enquadramento iniciais

### Requirement: Indicador visual de estoque por peça
O sistema SHALL exibir, junto a cada peça na cena, o saldo atual e um estado visual distinto para peças com saldo zero ("Esgotado") e para peças com saldo baixo (1 ou 2 unidades).

#### Scenario: Peça esgotada na cena
- **GIVEN** uma peça com saldo 0
- **WHEN** a cena é exibida
- **THEN** a peça aparece com o estado visual de esgotada e o rótulo "Esgotado"

#### Scenario: Peça com saldo baixo
- **GIVEN** uma peça com saldo 2
- **WHEN** a cena é exibida
- **THEN** a peça aparece com o estado visual de saldo baixo e o saldo "2"

### Requirement: Sincronização em tempo real com o estoque
O sistema MUST refletir na cena qualquer mudança de estoque, vinda de qualquer meio de entrada ou do carrinho, em até 200 ms e sem recarregar a página.

#### Scenario: Seleção reflete na cena
- **GIVEN** uma peça com saldo 3 exibida na cena
- **WHEN** o usuário seleciona a peça
- **THEN** o indicador da peça na cena passa a mostrar 2 em até 200 ms

#### Scenario: Remoção no carrinho reflete na cena
- **GIVEN** uma peça esgotada na cena com 1 unidade no carrinho
- **WHEN** o usuário remove a unidade pelo carrinho
- **THEN** a peça deixa de aparecer como esgotada na cena em até 200 ms

### Requirement: Seleção direta na cena
O sistema SHALL permitir selecionar uma peça clicando ou tocando nela na cena, aplicando as mesmas regras de estoque da seleção por qualquer outro meio.

#### Scenario: Clique em peça disponível
- **GIVEN** uma peça com saldo maior que zero
- **WHEN** o usuário clica na peça na cena
- **THEN** a peça é adicionada ao carrinho e o saldo baixa 1

#### Scenario: Clique em peça esgotada
- **GIVEN** uma peça com saldo 0
- **WHEN** o usuário clica na peça na cena
- **THEN** nada é adicionado ao carrinho
- **AND** o sistema exibe a mensagem "Esgotado"

### Requirement: Destaque e confirmação da seleção
O sistema SHALL destacar visualmente a peça sob o ponteiro ativo (mouse, toque ou mão) e exibir confirmação visual breve sempre que uma seleção for aceita.

#### Scenario: Ponteiro sobre peça
- **WHEN** o ponteiro ativo está sobre uma peça
- **THEN** a peça é destacada e seu nome, preço e saldo são exibidos

#### Scenario: Seleção aceita
- **WHEN** uma seleção é aceita
- **THEN** a peça exibe uma animação de confirmação
- **AND** o contador do carrinho é atualizado
