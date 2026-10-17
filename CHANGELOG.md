## 1.3.19 — otimização de desempenho (2026-10-17)

- Métricas de Fisher–Shannon da população calculadas em tarefas ociosas, em lotes, após a primeira renderização.
- Tabelas acessíveis criadas somente quando abertas e mantidas atualizadas por revisão de dados.
- Animação SampEn com duração finita; ícone e diagrama têm níveis distintos de interação.
- Teste da geometria móvel atualizado. Nenhuma fórmula ou dado científico foi alterado.

## 1.3.18 — trilha didática e simulações por método

- Incluída uma introdução gradual: definição de blazar, motivação para estudar a variabilidade e perguntas que as curvas de luz permitem investigar.
- Adicionadas simulações acionáveis para Sample Entropy (pares B e subconjunto A), Fisher–Shannon (densidade e gradientes) e MSE-WPE/CI (coarse-graining em diferentes escalas).
- O cartão inteiro também pode acionar a simulação; os botões continuam oferecendo acesso direto a cada método.
- Corrigida a versão compacta do mapa m × r, que antes exigia rolagem horizontal e escondia colunas no celular.
- Mantidas as métricas de pesquisa e os resultados demonstrativos existentes; as novas contagens da simulação SampEn são explicitamente didáticas.

## 1.3.17 — refinamento da vitrine e responsividade

- Métodos com nomes destacados: Sample Entropy (SampEn), Fisher–Shannon e Multiscale Entropy (MSE-WPE / CI).
- Ícones e diagramas científicos agora respondem a clique/toque com animações SVG curtas, indicação de interação, foco visível e anúncio acessível; animações respeitam `prefers-reduced-motion`.
- Cartões de manuscritos em triângulo invertido em telas amplas; layout de uma coluna em celular/tablet estreito.
- Menu com indicação da seção ativa e botão móvel com barras corretamente empilhadas.
- Geometria responsiva guiada por largura do contêiner, via `ResizeObserver`, com ajustes de margens, títulos e rótulos nos gráficos SampEn, SampEn por banda e sensibilidade m × r.
- Contraste reforçado no rodapé escuro. Nenhuma fórmula científica ou dado demonstrativo foi alterado.
- Corrigido o espaçamento do título principal quando a quebra de linha é ocultada no celular; ajustadas áreas de toque de controles secundários e legibilidade dos passos da vitrine.
- Aumentada a altura útil das linhas do heatmap fonte × banda para que a área clicável se aproxime de 24 px sem remover nenhuma célula.
- Ampliada a bateria de testes locais e de CI para incluir exportação PNG, animações da vitrine e viewport de tablet (768 px).

# Changelog — BlazarLab público

## 1.3.19 — otimização de processamento e tabelas (2026-10-17)

- Separada a geração das curvas sintéticas dos cálculos populacionais mais pesados; métricas são calculadas em pequenos lotes ociosos após a renderização inicial.
- A fonte ativa mantém as métricas centrais disponíveis; as visualizações populacionais são redesenhadas ao fim do processamento de fundo.
- O cálculo em segundo plano pausa com a página oculta e retoma quando ela volta a ficar visível.
- Tabelas de dados só são construídas quando abertas e não são reconstruídas se os dados não mudaram.
- Pulsação da simulação SampEn limitada a três repetições; ícone/cartão e diagrama agora têm papéis diferentes.
- Atualizado o teste móvel para o viewBox de 430 unidades.
- Fórmulas e dados científicos não foram alterados; as métricas continuam sendo demonstrações sintéticas.

## V1.3.16 — exportação PNG consciente do tema (2026-10-16)

- Corrigida a exportação PNG para identificar o tema ativo no momento do clique.
- Fundo, grade, rótulos, eixos, tooltips, barras e contornos recebem cores adequadas ao tema claro ou escuro.
- Cores explícitas de séries conhecidas são adaptadas na exportação clara, incluindo rótulos claros herdados de uma renderização anterior; gradientes de heatmap que codificam valores são preservados.
- Nenhuma fórmula, parâmetro ou dado científico foi alterado. Mantida a base de acessibilidade e responsividade da versão mais recente recebida.

## V1.5.0 — acessibilidade e responsividade (2026-10-16)

- Reorganizado o cabeçalho em telas móveis para acomodar marca, seletor de tema e menu sem colisão em larguras estreitas.
- Ampliadas as áreas de toque e reforçado o foco visível em controles interativos.
- Atualizados o nome acessível e os estados do menu, com fechamento por Escape, clique externo e navegação interna.
- Melhoradas as tabelas alternativas dos gráficos com caption, cabeçalhos de linha e região de rolagem nomeada e focalizável.
- Distinguidos gráficos estáticos e SVGs com controles internos para melhorar a semântica acessível.
- Adicionada navegação com setas e foco móvel a heatmaps interativos e à grade de sensibilidade.
- Impedido que comandos de zoom por setas capturem eventos de teclado oriundos dos controles internos dos SVGs.
- Sincronizada a preferência de redução de movimento quando ela muda durante a sessão.
- Aprimorados tipografia e espaçamento em celulares, mantendo rolagem localizada para gráficos/matrizes que necessitam de largura.
- Adicionados testes de acessibilidade estrutural e responsividade; sem mudanças de fórmulas, parâmetros ou resultados científicos.


## V1.4.0 — temas claro/escuro e limpeza da seção de pesquisa (2026-10-16)

- Adicionada alternância de tema claro e escuro no cabeçalho com ícones de sol e lua, rótulos acessíveis e estado selecionado anunciado.
- Mantido o tema escuro atual como padrão; a escolha fica salva no navegador quando o armazenamento está disponível.
- Implementada a paleta clara `#FFFFFF`, `#F0F4F8`, `#70A9FF`, `#1D4ED8` e `#0F172A`, com ajustes de superfícies, tipografia, controles e gráficos.
- Removido o cartão “Trabalho conjunto” do manuscrito de síntese na seção de resumos.
- Removida a seção “Citação do projeto”, incluindo o BibTeX e o endereço provisório.
- Atualizados os testes de integridade e os guias de publicação.
- Nenhuma fórmula, dado ou parâmetro científico foi alterado.


## V1.3.15 — estabilidade de interação e refinamento visual (2026-10-16)

- Removidas as referências ativas à exportação CSV; a funcionalidade permanece ausente do site público.
- Corrigida a causa da reinicialização das barras de ferramentas durante eventos de resize/fullscreen: controles e listeners não são recriados em redimensionamentos comuns.
- Limitado o redesenho responsivo à passagem entre geometrias móvel e desktop, preservando o estado de zoom durante ciclos de tela cheia.
- Melhorado o acionamento de tela cheia nativa e fallback, com saída por Esc para o fallback.
- Refeitos o seletor de métodos e o painel de relações em cartões equilibrados, com hierarquia, contraste e comportamento móvel aprimorados.
- Atualizados README, guia GitHub Pages, citação, versão e testes.
- Nenhuma fórmula central de Sample Entropy, Fisher–Shannon ou WPE/CI foi alterada nesta versão.

## V1.3.14 — refinamento de interface
- Refinamentos iniciais dos seletores de métodos e do resumo das relações.
- Tentativa inicial de ajuste do ciclo de tela cheia; aprofundada e corrigida na V1.3.15.

## V1.3.13 — refinamento e regressão de exportação (2026-10-16)
- Restaurada a regra tipográfica `.method-question` removida na passagem para V1.3.0.
- A versão chegou a incluir exportação CSV dos dados sintéticos; ela foi removida a pedido na V1.3.14 e permanece ausente.
- Removido o cálculo de três séries introdutórias de código legado que já não eram usadas pelos painéis sincronizados multibanda.
- Nenhuma fórmula central de Sample Entropy, Fisher–Shannon ou WPE/CI foi alterada.

## V1.3.0 — exploração sincronizada multibanda (2026-10-16)
- Nova seleção compartilhada de fonte sintética e banda energética para as três metodologias.
- Heatmap de SampEn para 24 fontes sintéticas × oito bandas, com células selecionáveis.
- Heatmap WPE de oito bandas × oito escalas temporais e trajetória Fisher–Shannon da fonte ativa entre bandas.
- Conectadas seleções de banda às curvas, ao plano de informação e às relações métricas.
- Mapa de sensibilidade SampEn m × r com 50 combinações por banda e visão das oito bandas.
- Suporte móvel às matrizes e controles de zoom, tela cheia, PNG e tabelas acessíveis.
- Distinção explícita entre dados sintéticos e estatísticas publicadas de OVRO 15 GHz.

## V1.2.5 — estabilização, leitura móvel e sensibilidade SampEn
- Cartões educativos equilibrados, mapa m × r ampliado, interações e controles responsivos, tabelas acessíveis, metadados e testes automatizados.
