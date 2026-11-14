# Spec Delta

## Purpose

Controla o catálogo de roupas da loja simulada, o saldo de estoque de cada peça e o carrinho, garantindo que cada seleção baixe uma unidade e que o estoque nunca fique inconsistente.

## ADDED Requirements

### Requirement: Catálogo com estoque por peça
O sistema SHALL exibir um catálogo de peças carregado de dados semente, em que cada peça tem identificador único, nome, preço, posição na loja e saldo de estoque inteiro maior ou igual a zero.

#### Scenario: Primeira abertura da loja
- **GIVEN** que o usuário nunca abriu a loja neste navegador
- **WHEN** a loja é carregada
- **THEN** todas as peças dos dados semente são exibidas com o saldo de estoque semente
- **AND** o carrinho está vazio

### Requirement: Selecionar peça baixa uma unidade
O sistema SHALL, ao selecionar uma peça com saldo maior que zero, adicionar 1 unidade dela ao carrinho e reduzir o saldo dessa peça em exatamente 1, de forma atômica.

#### Scenario: Seleção de peça disponível
- **GIVEN** a peça "Camiseta Básica" com saldo 5 e nenhuma unidade no carrinho
- **WHEN** o usuário seleciona a peça
- **THEN** o saldo passa a 4
- **AND** o carrinho mostra "Camiseta Básica" com quantidade 1

#### Scenario: Seleção repetida da mesma peça
- **GIVEN** a peça "Camiseta Básica" com saldo 4 e quantidade 1 no carrinho
- **WHEN** o usuário seleciona a peça novamente
- **THEN** o saldo passa a 3
- **AND** a quantidade no carrinho passa a 2

### Requirement: Estoque zero bloqueia seleção
O sistema MUST impedir a seleção de peça com saldo zero, marcando-a como "Esgotado", e o saldo MUST nunca ficar negativo.

#### Scenario: Tentativa de selecionar peça esgotada
- **GIVEN** a peça "Jaqueta Jeans" com saldo 0
- **WHEN** o usuário tenta selecioná-la por qualquer meio de entrada
- **THEN** o saldo permanece 0
- **AND** o carrinho não é alterado
- **AND** a peça é exibida como "Esgotado"

#### Scenario: Última unidade selecionada
- **GIVEN** a peça "Jaqueta Jeans" com saldo 1
- **WHEN** o usuário seleciona a peça
- **THEN** o saldo passa a 0
- **AND** a peça passa a ser exibida como "Esgotado"

#### Scenario: Seleções simultâneas na última unidade
- **GIVEN** a peça "Jaqueta Jeans" com saldo 1
- **WHEN** duas seleções da peça chegam em sequência imediata (por exemplo, gesto e clique)
- **THEN** apenas uma seleção é aceita
- **AND** o saldo final é 0

### Requirement: Remover do carrinho devolve a unidade
O sistema SHALL, ao remover 1 unidade de uma peça do carrinho, devolver exatamente 1 unidade ao saldo dessa peça, e remover a linha do carrinho quando a quantidade chegar a zero.

#### Scenario: Remoção de uma unidade
- **GIVEN** a peça "Camiseta Básica" com saldo 3 e quantidade 2 no carrinho
- **WHEN** o usuário remove 1 unidade do carrinho
- **THEN** o saldo passa a 4
- **AND** a quantidade no carrinho passa a 1

#### Scenario: Remoção libera peça esgotada
- **GIVEN** a peça "Jaqueta Jeans" com saldo 0 e quantidade 1 no carrinho
- **WHEN** o usuário remove a unidade do carrinho
- **THEN** o saldo passa a 1
- **AND** a peça deixa de ser exibida como "Esgotado"
- **AND** a linha da peça sai do carrinho

### Requirement: Esvaziar carrinho
O sistema SHALL permitir esvaziar o carrinho, devolvendo ao estoque todas as unidades que estavam nele.

#### Scenario: Esvaziar carrinho com várias peças
- **GIVEN** um carrinho com 2 "Camiseta Básica" e 1 "Jaqueta Jeans"
- **WHEN** o usuário esvazia o carrinho
- **THEN** o saldo de "Camiseta Básica" aumenta em 2 e o de "Jaqueta Jeans" aumenta em 1
- **AND** o carrinho fica vazio

### Requirement: Conservação do estoque
O sistema MUST garantir, para toda peça e após qualquer operação, que saldo atual mais quantidade no carrinho seja igual ao saldo semente.

#### Scenario: Invariante após sequência de operações
- **GIVEN** qualquer sequência de seleções, remoções e esvaziamentos
- **WHEN** a sequência termina
- **THEN** para cada peça, saldo atual mais quantidade no carrinho é igual ao saldo semente

### Requirement: Persistência local do estado
O sistema SHALL preservar estoque e carrinho no navegador do usuário entre recarregamentos da página.

#### Scenario: Recarregar a página
- **GIVEN** a peça "Camiseta Básica" com saldo 3 e quantidade 2 no carrinho
- **WHEN** o usuário recarrega a página
- **THEN** o saldo continua 3
- **AND** o carrinho continua com quantidade 2

#### Scenario: Estado salvo inválido
- **GIVEN** que o estado salvo no navegador está corrompido ou incompatível com os dados semente
- **WHEN** a loja é carregada
- **THEN** o sistema descarta o estado salvo e carrega o estado semente

### Requirement: Resetar loja
O sistema SHALL oferecer a ação "Resetar loja", que após confirmação restaura todos os saldos ao valor semente e esvazia o carrinho.

#### Scenario: Reset confirmado
- **GIVEN** estoque e carrinho alterados
- **WHEN** o usuário aciona "Resetar loja" e confirma
- **THEN** todos os saldos voltam ao valor semente
- **AND** o carrinho fica vazio

#### Scenario: Reset cancelado
- **WHEN** o usuário aciona "Resetar loja" e cancela
- **THEN** estoque e carrinho permanecem inalterados
