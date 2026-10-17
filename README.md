# BlazarLab — vitrine pública (v1.3.19)

O BlazarLab é uma vitrine pública de divulgação científica sobre três perspectivas complementares para analisar variabilidade de blazares: **Sample Entropy (SampEn)**, **Fisher–Shannon** e **MSE-WPE / Complexity Index (CI)**. A versão 1.3.19 mantém a trilha interativa e reduz o trabalho feito antes da primeira interação, adiando KDEs da população e a criação de tabelas acessíveis até serem necessárias. A exportação PNG continua respeitando o tema selecionado.

A página mantém temas claro e escuro, usando sinais sintéticos demonstrativos nas oito bandas de energia. Eles não substituem dados observacionais nem os cálculos da ferramenta interna. Os resultados publicados são identificados separadamente das demonstrações.

## Novidades V1.3.18
- Nova trilha didática: o que é um blazar, por que sua variabilidade importa e que tipos de informação podemos extrair das curvas de luz.
- Animações específicas para SampEn (bandas A e B e relação A/B), Fisher–Shannon (distribuição e gradiente) e MSE-WPE/CI (agregação em escalas). Clicar no corpo de um cartão também inicia sua simulação.
- Corrigida a visualização compacta do mapa de sensibilidade m × r: as dez tolerâncias agora cabem na largura móvel, sem deixar metade do gráfico escondida na rolagem horizontal.
- Animações com respeito à preferência de redução de movimento e descrições acessíveis.


- Três métodos com identificação tipográfica explícita e animações curtas acionadas por clique/toque tanto nos ícones quanto nos diagramas ilustrativos; foco de teclado e preferência por movimento reduzido respeitados.
- Cartões dos três manuscritos distribuídos como triângulo invertido em telas amplas, com adaptação para coluna única em telas estreitas.
- Links do menu indicam a seção ativa, e o botão móvel mantém as três barras empilhadas e se transforma em “X” quando aberto.
- Geometria dos gráficos baseada na largura do contêiner via `ResizeObserver`, com layout específico para a lente SampEn, rótulos curtos por banda e maior margem para o mapa m × r.
- Melhorado o contraste do rodapé, ampliadas áreas de toque e corrigido o espaçamento do título principal em telas estreitas.

- Corrigida a exportação de gráficos PNG para usar a paleta do tema ativo: fundo, grades, rótulos, eixos, tooltips e contornos.
- Cores explícitas de séries já renderizadas são adaptadas no arquivo exportado ao tema claro, sem alterar as cores de gradientes que codificam valores em heatmaps.
- Mantidas as melhorias de acessibilidade, responsividade, temas, sincronização multibanda e cálculos demonstrativos. Nenhuma fórmula científica foi alterada.

- Melhorada a navegação móvel: cabeçalho em grelha, seletor de tema e menu dimensionados para toque, e menu limitado à altura disponível.
- Botão do menu anuncia corretamente “Abrir navegação” / “Fechar navegação”, pode ser fechado por Escape e fecha após navegação ou clique fora.
- Reforçado o foco de teclado nos links, controles, seletores, tabelas e ferramentas de gráfico.
- Tabelas de dados geradas para gráficos agora incluem título/caption semântico, cabeçalhos de linha e região rolável acessível pelo teclado.
- Gráficos com controles SVG internos são identificados como grupos acessíveis, mantendo descrições e instruções.
- Implementada navegação por setas com foco móvel em heatmaps interativos (fonte × banda, banda × escala e sensibilidade multibanda).
- Corrigido o conflito em que as setas do zoom do SVG podiam interceptar a navegação por teclado dos elementos gráficos internos.
- A preferência de movimento reduzido é atualizada se a configuração do sistema mudar durante a sessão.
- Melhorada a legibilidade em telas estreitas, com títulos fluídos, textos auxiliares maiores e preservação da rolagem horizontal localizada para matrizes extensas.
- Preservados temas, métodos, fórmulas, parâmetros, dados demonstrativos, tabelas científicas, zoom, tela cheia e exportação PNG.

## Novidades V1.3.19 — desempenho em celulares
- A geração das curvas continua determinística, mas os cálculos KDE da população são executados em lotes ociosos após a primeira exibição.
- O trabalho de fundo pausa quando a página está oculta e retoma quando volta a ficar visível.
- As tabelas acessíveis só montam suas linhas quando o usuário abre “Consultar os dados em tabela”; tabelas abertas são atualizadas somente quando os dados mudam.
- A animação de pontos de Sample Entropy passou a ter duração finita. O cartão/ícone oferece feedback breve; o diagrama abre a simulação específica.
- Atualizado o teste móvel para a geometria final de 430 unidades do mapa m × r.

## Conteúdo do pacote

- `index.html` — página pública.
- `styles.css` — identidade visual, temas, acessibilidade visual e comportamento responsivo.
- `blazarlab.js` — visualizações, cálculos demonstrativos e interações.
- `assets/` — ícones e prévia para compartilhamento.
- `tests/` — verificações estáticas, testes de fumaça, tela cheia, acessibilidade e responsividade.
- `CHANGELOG.md`, `VERSION`, `LICENSE` — histórico, versão e licença.

## Publicação no GitHub Pages

1. Use o repositório separado do site público; não substitua a ferramenta interna.
2. Extraia o ZIP e envie os arquivos para a raiz do repositório (`index.html` na raiz).
3. Em **Settings → Pages**, escolha a branch principal e a pasta `/(root)`.
4. Teste os temas claro e escuro, navegação por teclado, heatmaps, zoom, reset, tela cheia e exportação PNG em desktop e celular.

## Testes locais

Com Node.js instalado, execute:

```sh
node --check blazarlab.js
node tests/site-integrity.cjs
node tests/performance-optimizations.cjs
node tests/png-theme-export.cjs
node tests/smoke-test.cjs
node tests/fullscreen-regression.cjs
node tests/accessibility-responsive.cjs
node tests/method-showcase.cjs
node tests/method-animation-regression.cjs
VIEWPORT_WIDTH=390 node tests/smoke-test.cjs
VIEWPORT_WIDTH=768 node tests/smoke-test.cjs
```

Os testes automatizados verificam estrutura, geração das visualizações, interações, regressões básicas e presença de recursos de acessibilidade. Eles não substituem testes visuais em navegadores e leitores de tela reais; esses testes manuais continuam necessários antes de declarar conformidade WCAG.

## Escopo científico

Os dados da galeria são sintéticos, reproduzíveis e identificados no site. Estatísticas resumidas nos cartões de resultados são apresentadas como resultados reportados nos estudos do grupo e não são recalculadas com os sinais sintéticos. Os coeficientes mostrados no painel comparativo descrevem associações, não causalidade; as três métricas não são equivalentes.
