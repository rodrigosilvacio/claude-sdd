# Proposal

## Why

Precisamos de uma loja simulada de roupas que sirva de laboratório para avaliar o OpenSpec com um caso concreto e visual: estoque que reage a cada seleção, um gêmeo digital da loja que espelha esse estado em tempo real e seleção de peças sem mouse, por visão computacional com mapeamento de mãos. O projeto está vazio (nenhuma spec, nenhum código), então esta change estabelece a primeira fonte da verdade do sistema.

## What Changes

- Novo catálogo de roupas com estoque por peça, carregado a partir de dados semente.
- Regra de estoque "baixa ao selecionar": adicionar uma peça ao carrinho baixa 1 unidade; remover do carrinho devolve a unidade; estoque zero bloqueia a seleção e exibe "Esgotado".
- Carrinho com quantidade por peça e ação de esvaziar.
- Ação "Resetar loja" que restaura estoque e carrinho ao estado semente (substitui expiração de reserva no MVP).
- Gêmeo digital da loja: cena 3D navegável com araras e prateleiras, cada peça posicionada no seu lugar, mostrando estoque atual e estado esgotado em tempo real.
- Seleção por gestos: webcam com mapeamento de mãos controla um cursor na cena; gesto de pinça seleciona a peça apontada. Mouse e toque continuam funcionando como alternativa.
- Processamento de vídeo 100% local no navegador, com consentimento explícito para ligar a câmera.

## Capabilities

### New Capabilities

- `estoque-carrinho`: catálogo de peças, saldo de estoque por peça, carrinho e regras de baixa, devolução, bloqueio por esgotamento e reset.
- `gemeo-digital-loja`: representação visual navegável da loja física (araras, prateleiras, posição das peças) sincronizada em tempo real com o estoque.
- `selecao-por-gestos`: uso da webcam com mapeamento de mãos para apontar e selecionar peças no gêmeo digital, incluindo consentimento, feedback visual e fallback para mouse/toque.

### Modified Capabilities

Nenhuma (projeto sem specs vigentes).

## Impact

- Código novo em `openspec-sdd/app/`: aplicação web de página única, sem backend.
- Novas dependências de frontend: renderização 3D e modelo de detecção de mãos executado no navegador (detalhes em design.md).
- Acesso à câmera do usuário: exige contexto seguro (HTTPS ou localhost) e tratamento de privacidade (LGPD), sem gravar nem enviar imagens.
- Estado persistido apenas no navegador do usuário.

### Fora do escopo

- Pagamento, checkout real, pedidos e login.
- Estoque por variação (tamanho/cor), multiusuário e concorrência entre clientes.
- Expiração automática de reservas no carrinho.
- Backend, banco de dados e integração com ERP.
- Reconhecimento de peças reais por câmera (a visão computacional é só para as mãos).
