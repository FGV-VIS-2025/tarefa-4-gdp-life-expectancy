## Decisões de Design

Nosso objetivo principal foi criar uma forma **interativa e intuitiva** de visualizar a relação entre o PIB per capita e a expectativa de vida dos países ao longo do tempo. Devido à grande quantidade de anos disponíveis, a principal interação escolhida foi a navegação temporal por meio de uma linha do tempo deslizante. Além disso, o usuário pode arrastar os círculos (que representam os países) para visualizar sua trajetória histórica e observar a evolução de forma dinâmica. Abaixo estão os principais pontos que guiaram nossas escolhas de design:

### Escolha do Tema
- Buscamos representar **desenvolvimento socioeconômico** de forma visual e dinâmica.
- O eixo X representa o **PIB per capita (USD)**, enquanto o eixo Y mostra a **expectativa de vida (anos)**.

### Codificações Visuais
- Cada país é representado por um **círculo colorido**, onde:
  - A **cor** indica o continente (África, Américas, Ásia, Europa, Oceania).
  - A **posição** no gráfico reflete os valores de PIB per capita e expectativa de vida.
- Utilizamos **tamanhos uniformes** nos círculos para evitar distorções visuais e focar na posição e na cor como principais variáveis visuais.

### Interatividade
- Implementamos uma **linha do tempo deslizante** para navegar pelos anos disponíveis.
- Ao arrastar a bolinha de um país, é possível acompanhar sua **trajetória histórica** no gráfico.
- O usuário pode **filtrar continentes** para reduzir a densidade visual e focar em regiões específicas.
- O campo de busca permite **localizar países individualmente**, facilitando comparações específicas.

### Gráficos Complementares
- Ao selecionar um país, exibimos dois gráficos laterais com sua evolução histórica:
  - **PIB per capita ao longo do tempo**
  - **Expectativa de vida ao longo do tempo**
- Isso permite observar **tendências e eventos específicos** que impactaram o país.

### Técnicas de Animação
- Utilizamos animações suaves ao transitar entre anos para reforçar a sensação de continuidade temporal.
- O botão "Reproduzir" anima automaticamente os dados ao longo dos anos, criando uma experiência mais imersiva.

### Alternativas Consideradas
- Consideramos usar mapas, mas optamos pelo scatter plot por permitir comparações mais diretas entre países.
- Pensamos em usar gráficos de linha para todos os países ao longo do tempo, mas isso geraria excesso de informações visuais.
- Avaliamos também animações automáticas contínuas, mas decidimos manter o controle manual para não comprometer a usabilidade.


## Fontes e inspirações

- Como inspiração usamos esse exemplo do vega-lite: https://vega.github.io/vega-lite/examples/interactive_global_development.html

- Também nos inspiramos em visualizações do gapminder: https://www.gapminder.org/tools/#$chart-type=bubbles&url=v2

- Dados utilizados: https://www.gapminder.org/data/
