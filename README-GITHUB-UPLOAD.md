# Publicação do BlazarLab V1.3.19

1. Faça backup da versão existente do repositório público.
2. Extraia `BlazarLab_v1.3.19-refinado.zip`.
3. Copie o conteúdo da pasta `blazarlab_v1.3.19/` para a raiz do repositório, mantendo `index.html` na raiz.
4. Publique na branch e pasta configuradas em GitHub Pages.
5. Após a publicação, teste os temas claro/escuro, o menu móvel, a navegação por teclado, as animações dos três métodos, tabelas dos gráficos, heatmaps, zoom, tela cheia e exportação PNG.

## Verificações locais

Com Node.js instalado, execute na pasta do projeto:

```sh
node --check blazarlab.js
node tests/site-integrity.cjs
node tests/png-theme-export.cjs
node tests/smoke-test.cjs
node tests/fullscreen-regression.cjs
node tests/accessibility-responsive.cjs
node tests/method-showcase.cjs
node tests/method-animation-regression.cjs
VIEWPORT_WIDTH=390 node tests/smoke-test.cjs
VIEWPORT_WIDTH=768 node tests/smoke-test.cjs
```

Os testes automatizados não substituem inspeção visual num navegador real e testes com leitores de tela. Recomenda-se validar em Safari/iOS/VoiceOver, Chrome/Android/TalkBack e navegador de desktop antes de declarar conformidade WCAG.
