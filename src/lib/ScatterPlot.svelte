<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { base } from '$app/paths';

  // Configurações e constantes
  const CONFIG = {
    width: 800,
    height: 500,
    margin: { top: 20, right: 30, bottom: 60, left: 60 },
    playSpeed: 200,
    transitionDuration: 300,
    transitionEase: d3.easeQuadOut,
    pointRadius: 5,
    pointOpacity: 0.7,
    pointHighlightStroke: '#333',
    pointColor: d => d.population > 100000000 ? '#E63946' : 
                     d.population > 50000000 ? '#F4A261' : 'steelblue',
    lineColors: {
      gdp: '#457B9D',
      lex: '#E07A5F'
    },
    subplotSize: {
      width: 350,
      height: 175,
      margin: { top: 20, right: 20, bottom: 30, left: 40 }
    },
    gdpValueFormat: d => d >= 10000 ? d3.format('.0s')(d) : d3.format(',')(d),
    yearTickFormat: d3.format('d'),
    lexValueFormat: d3.format('.1f')
  };

  // Elementos do DOM
  let svgElement;
  let gdpPlot;
  let lexPlot;
  let yearSlider;
  let tooltipElement;
  
  // Estado da aplicação
  let allData = [];
  let years = [];
  let selectedYear;
  let dataLoaded = false;
  let playing = false;
  let playInterval;

  // Elementos D3
  let xScale, yScale, xAxis, yAxis, svg, yearText, highlightGroup;
  let tooltip;
  
  // Limites globais para escalas
  let globalYMin = 0;
  let globalYMax = 100;
  let globalXMin = 250;
  let globalXMax = 200000;
  
  // Variáveis para interação de arrasto
  let draggedCountry = null;
  let currentClosestHighlightPoint = null;
  
  // Estatísticas para exibir
  let totalCountries = 0;
  let averageLifeExpectancy = 0;
  let averageGDP = 0;

  // Função para processar os dados recebidos
  function processData(data) {
    // Adicionar campo de população aos dados (poderíamos obter de outra fonte)
    return data
      .filter(d => d.gdp > 0 && d.lex > 0)
      .map(d => ({
        ...d,
        // Simulação de dados de população (poderíamos carregar de um arquivo real)
        population: Math.round(Math.random() * 1000000000)
      }));
  }

  // Função para calcular estatísticas básicas
  function calculateStatistics(yearData) {
    totalCountries = yearData.length;
    averageLifeExpectancy = d3.mean(yearData, d => d.lex);
    averageGDP = d3.mean(yearData, d => d.gdp);
  }

  // Inicializar os gráficos D3
  function initializeCharts() {
    svg = d3.select(svgElement)
      .attr('width', CONFIG.width)
      .attr('height', CONFIG.height)
      .append('g')
      .attr('transform', `translate(${CONFIG.margin.left},${CONFIG.margin.top})`);

    // Escalas
    xScale = d3.scaleLog()
      .domain([globalXMin, globalXMax])
      .range([0, CONFIG.width - CONFIG.margin.left - CONFIG.margin.right]);
    
    yScale = d3.scaleLinear()
      .domain([globalYMin, globalYMax])
      .range([CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom, 0]);
    
    // Eixos
    xAxis = d3.axisBottom(xScale)
      .tickValues([500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000])
      .tickFormat(CONFIG.gdpValueFormat)
      .tickSize(0);
    
    yAxis = d3.axisLeft(yScale)
      .ticks((globalYMax - globalYMin) / 10)
      .tickFormat(d3.format('d'));

    // Adicionar eixos ao gráfico
    createAxes();
    
    // Adicionar título de ano
    yearText = svg.append('text')
      .attr('class', 'year-text')
      .attr('x', CONFIG.width - CONFIG.margin.left - CONFIG.margin.right)
      .attr('y', CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom - 10)
      .attr('text-anchor', 'end')
      .style('font-size', '2em')
      .style('font-weight', 'bold')
      .attr('fill', '#ccc');

    // Create tooltip appended to body
    tooltip = d3.select('body') // Append to body instead of parentNode
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0);
    
    // Layer para destacar pontos
    highlightGroup = svg.append('g').attr('class', 'highlight-layer');
  }

  // Criar eixos do gráfico principal
  function createAxes() {
    // Eixo X
    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom})`)
      .call(xAxis)
      .append('text')
        .attr('class', 'axis-label')
        .attr('x', (CONFIG.width - CONFIG.margin.left - CONFIG.margin.right) / 2)
        .attr('y', CONFIG.margin.bottom - 15)
        .attr('fill', 'currentColor')
        .style('text-anchor', 'middle')
        .text('PIB per Capita');

    // Eixo Y
    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom) / 2)
        .attr('y', -CONFIG.margin.left + 15)
        .attr('fill', 'currentColor')
        .style('text-anchor', 'middle')
        .text('Expectativa de Vida (Anos)');
  }

  // Funções para gerenciar drag & drop
  function dragstarted(event, d) {
    if (!dataLoaded) return;
    
    draggedCountry = d.country;
    currentClosestHighlightPoint = d;

    d3.select(this)
      .raise()
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .style("cursor", "grabbing");

    const countryHistory = allData.filter(p => p.country === draggedCountry && p.gdp > 0 && p.lex > 0);
    drawSubplots(countryHistory);

    // Diminuir opacidade dos outros pontos
    svg.selectAll('circle.data-point')
      .filter(c => c.country !== draggedCountry)
      .transition().duration(200).ease(CONFIG.transitionEase)
      .attr('opacity', 0.1);

    // Destacar pontos históricos do país
    highlightGroup.selectAll("*").remove();
    highlightGroup.selectAll(".highlight-point")
      .data(countryHistory, p => p.year)
      .enter().append("circle")
      .attr("class", "highlight-point")
      .attr("cx", p => xScale(p.gdp))
      .attr("cy", p => yScale(p.lex))
      .attr("r", 4)
      .attr("fill", "red")
      .attr("opacity", 0.6)
      .style("pointer-events", "none");
  }

  function dragged(event, d) {
    if (!draggedCountry) return;

    let minDistance = Infinity;
    let closestPoint = null;

    // Encontrar o ponto mais próximo da posição atual
    highlightGroup.selectAll(".highlight-point").each(function(p) {
      const markerX = +d3.select(this).attr("cx");
      const markerY = +d3.select(this).attr("cy");
      const [svgX, svgY] = d3.pointer(event, svg.node());
      const dist = Math.hypot(svgX - markerX, svgY - markerY);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = p;
      }
    });

    // Atualizar posição do ponto arrastado para o ponto histórico mais próximo
    if (closestPoint && currentClosestHighlightPoint?.year !== closestPoint.year) {
      currentClosestHighlightPoint = closestPoint;
      d3.select(this)
        .transition().duration(100).ease(CONFIG.transitionEase)
        .attr('cx', xScale(closestPoint.gdp))
        .attr('cy', yScale(closestPoint.lex));
    }
  }

  function dragended(event, d) {
    if (!draggedCountry) return;
    
    const finalPoint = currentClosestHighlightPoint;

    // Restaurar estilo do ponto
    d3.select(this)
      .attr("stroke", null)
      .attr("stroke-width", null)
      .style("cursor", "grab");
    
    // Limpar destaque
    highlightGroup.selectAll(".highlight-point").remove();
    
    // Restaurar opacidade de todos os pontos
    svg.selectAll('circle.data-point')
      .transition().duration(200).ease(CONFIG.transitionEase)
      .attr('opacity', CONFIG.pointOpacity);

    draggedCountry = null;
    currentClosestHighlightPoint = null;

    // Se for um ano diferente, atualizar para esse ano
    if (finalPoint && selectedYear !== finalPoint.year) {
      selectedYear = finalPoint.year;
      yearSlider.value = selectedYear;
    }
    
    updatePlot(selectedYear);
  }

  // Atualizar o gráfico principal para o ano selecionado
  function updatePlot(year) {
    if (!dataLoaded) return;
    
    const subset = allData.filter(d => d.year === year);
    calculateStatistics(subset);

    // Atualizar escalas e eixos
    yScale.domain([globalYMin, globalYMax]);
    svg.select('.y-axis')
      .transition().duration(CONFIG.transitionDuration).ease(CONFIG.transitionEase)
      .call(yAxis);
    svg.select('.x-axis')
      .transition().duration(CONFIG.transitionDuration).ease(CONFIG.transitionEase)
      .call(xAxis);

    // Atualizar linhas de grade
    updateGridLines();

    // Atualizar pontos de dados
    updateDataPoints(subset);

    // Atualizar texto do ano
    yearText.text(year);
  }

  // Atualizar linhas de grade
  function updateGridLines() {
    svg.selectAll('.grid').remove();
    
    // Linhas de grade horizontais - COMMENTED OUT
    /*
    svg.append('g').attr('class','grid')
      .call(d3.axisLeft(yScale)
        .ticks((globalYMax-globalYMin)/10)
        .tickSize(-CONFIG.width + CONFIG.margin.left + CONFIG.margin.right)
        .tickFormat(''))
      .selectAll('line')
      .attr('stroke','#e0e0e0');
    */
    
    // Linhas de grade verticais - COMMENTED OUT
    /*
    svg.append('g').attr('class','grid')
      .attr('transform',`translate(0,${CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom})`)
      .call(d3.axisBottom(xScale)
        .tickValues([500,1000,2000,4000,8000,16000,32000,64000,128000])
        .tickSize(-CONFIG.height + CONFIG.margin.top + CONFIG.margin.bottom)
        .tickFormat(''))
      .selectAll('line')
      .attr('stroke','#e0e0e0');
    */
  }

  // Atualizar pontos de dados
  function updateDataPoints(subset) {
    const pts = svg.selectAll('circle.data-point').data(subset, d => d.country);
    
    // Remover pontos que não existem mais
    pts.exit()
      .transition().duration(CONFIG.transitionDuration).ease(CONFIG.transitionEase)
      .attr('r', 0)
      .remove();
    
    // Adicionar novos pontos
    const enter = pts.enter().append('circle')
      .attr('class', 'data-point')
      .attr('opacity', 0)
      .attr('r', 0)
      .attr('cx', d => xScale(d.gdp))
      .attr('cy', d => yScale(d.lex))
      .style('cursor', 'grab')
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended))
      .on('mouseover', showTooltip)
      .on('mouseout', hideTooltip);
    
    // Atualizar todos os pontos
    enter.merge(pts)
      .transition().duration(CONFIG.transitionDuration).ease(CONFIG.transitionEase)
      .attr('cx', d => xScale(d.gdp))
      .attr('cy', d => yScale(d.lex))
      .attr('r', CONFIG.pointRadius)
      .attr('opacity', CONFIG.pointOpacity)
      .attr('fill', CONFIG.pointColor);
  }

  // Mostrar tooltip
  function showTooltip(event, d) {
    d3.select(event.currentTarget)
      .attr('stroke', CONFIG.pointHighlightStroke)
      .attr('stroke-width', 1.5);
    
    // Get element's position relative to viewport
    const rect = event.currentTarget.getBoundingClientRect();
    
    // Calculate position relative to the document
    const targetX = rect.left + rect.width / 2 + window.scrollX;
    const targetY = rect.top + window.scrollY;

    tooltip.style('opacity', 0.9)
      .html(
        `<strong>${d.country}</strong><br/>` +
        `Ano: ${d.year}<br/>` +
        `PIB: ${d3.format(',')(d.gdp)}<br/>` +
        `Expectativa de Vida: ${d.lex.toFixed(1)}<br/>` +
        `População: ${d3.format('.3s')(d.population)}`
      )
      // Position the tooltip using the calculated element position
      .style('left', `${targetX}px`) 
      .style('top', `${targetY}px`);
  }

  // Esconder tooltip
  function hideTooltip(event) {
    d3.select(event.currentTarget).attr('stroke', null);
    tooltip.style('opacity', 0);
  }

  // Alternar reprodução automática
  function togglePlay() {
    playing = !playing;
    
    if (playing) {
      playInterval = setInterval(() => {
        const i = years.indexOf(selectedYear);
        selectedYear = years[(i + 1) % years.length];
        yearSlider.value = selectedYear;
        updatePlot(selectedYear);
      }, CONFIG.playSpeed);
    } else {
      clearInterval(playInterval);
    }
  }

  // Desenhar subgráficos para a evolução histórica de um país
  function drawSubplots(countryHistory) {
    const { width, height, margin } = CONFIG.subplotSize;

    // Escala X para anos
    const x = d3.scaleLinear()
      .domain(d3.extent(countryHistory, d => d.year))
      .range([margin.left, width - margin.right]);

    // Escala Y para PIB
    const yGDP = d3.scaleLinear()
      .domain([0, d3.max(countryHistory, d => d.gdp) * 1.1]).nice()
      .range([height - margin.bottom, margin.top]);

    // Escala Y para expectativa de vida
    const yLex = d3.scaleLinear()
      .domain([
        Math.max(0, d3.min(countryHistory, d => d.lex) - 5), 
        Math.min(100, d3.max(countryHistory, d => d.lex) + 5)
      ])
      .range([height - margin.bottom, margin.top]);

    // Limpar gráficos existentes
    d3.select(gdpPlot).selectAll('*').remove();
    d3.select(lexPlot).selectAll('*').remove();

    // Criar gráfico de PIB
    const gdpSvg = d3.select(gdpPlot)
      .attr('width', width)
      .attr('height', height);

    // Adicionar eixos ao gráfico de PIB
    gdpSvg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(CONFIG.yearTickFormat));
    
    gdpSvg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yGDP).tickFormat(d => d >= 10000 ? d3.format('.0s')(d) : d3.format(',')(d)));

    // Adicionar linha ao gráfico de PIB
    gdpSvg.append('path')
      .datum(countryHistory)
      .attr('fill', 'none')
      .attr('stroke', CONFIG.lineColors.gdp)
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => yGDP(d.gdp))
      );

    // Adicionar pontos de dados ao gráfico de PIB
    gdpSvg.selectAll('.gdp-point')
      .data(countryHistory)
      .enter()
      .append('circle')
      .attr('class', 'gdp-point')
      .attr('cx', d => x(d.year))
      .attr('cy', d => yGDP(d.gdp))
      .attr('r', 2)
      .attr('fill', CONFIG.lineColors.gdp);

    // Adicionar título ao gráfico de PIB
    gdpSvg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top * 0.8)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.9em')
      .style('font-weight', 'bold')
      .text(`PIB per Capita (${countryHistory[0].country})`);

    // Criar gráfico de expectativa de vida
    const lexSvg = d3.select(lexPlot)
      .attr('width', width)
      .attr('height', height);

    // Adicionar eixos ao gráfico de expectativa de vida
    lexSvg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(CONFIG.yearTickFormat));
    
    lexSvg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yLex));

    // Adicionar linha ao gráfico de expectativa de vida
    lexSvg.append('path')
      .datum(countryHistory)
      .attr('fill', 'none')
      .attr('stroke', CONFIG.lineColors.lex)
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => yLex(d.lex))
      );

    // Adicionar pontos de dados ao gráfico de expectativa de vida
    lexSvg.selectAll('.lex-point')
      .data(countryHistory)
      .enter()
      .append('circle')
      .attr('class', 'lex-point')
      .attr('cx', d => x(d.year))
      .attr('cy', d => yLex(d.lex))
      .attr('r', 2)
      .attr('fill', CONFIG.lineColors.lex);

    // Adicionar título ao gráfico de expectativa de vida
    lexSvg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top * 0.8)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.9em')
      .style('font-weight', 'bold')
      .text(`Expectativa de Vida (${countryHistory[0].country})`);
  }

  // Inicialização quando o componente é montado
  onMount(async () => {
    try {
      // Carregar dados
      const data = await d3.csv(`${base}/gdp-life-expectancy.csv`, d => ({
        country: d.country,
        year: +d.year,
        gdp: +d.gdp,
        lex: +d.lex
      }));
      
      // Processar dados
      allData = processData(data);
      years = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => a - b);
      selectedYear = years[0];
      globalYMax = Math.ceil(d3.max(allData, d => d.lex) / 10) * 10;
      
      // Inicializar referência ao slider
      yearSlider = document.getElementById('year-slider');
      
      // Inicializar gráficos
      initializeCharts();
      
      // Sinalizar que dados foram carregados
      dataLoaded = true;
      
      // Atualizar gráfico para o ano inicial
      await tick(); // Aguardar próximo ciclo de renderização do Svelte
      updatePlot(selectedYear);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  });

  // Limpar intervalo de reprodução na desmontagem do componente
  function cleanup() {
    if (playInterval) {
      clearInterval(playInterval);
    }
  }

  // Monitorar mudança de ano selecionado
  $: if (dataLoaded && selectedYear) {
    updatePlot(selectedYear);
  }
</script>

<svelte:window on:beforeunload={cleanup}/>

<div class="visualization-container">
  <h2>PIB vs. Expectativa de Vida Mundial</h2>
  
  <div class="stats-panel">
    <div class="stat-box">
      <span class="stat-value">{totalCountries}</span>
      <span class="stat-label">Países</span>
    </div>
    <div class="stat-box">
      <span class="stat-value">{averageLifeExpectancy ? averageLifeExpectancy.toFixed(1) : "-"}</span>
      <span class="stat-label">Exp. Vida Média</span>
    </div>
    <div class="stat-box">
      <span class="stat-value">{averageGDP ? d3.format('$,.0f')(averageGDP) : "-"}</span>
      <span class="stat-label">PIB Médio</span>
    </div>
  </div>
  
  <div class="controls">
    <button on:click={togglePlay} class="control-button">
      {playing ? '⏸️ Pausar' : '▶️ Reproduzir'}
    </button>
    <input
      id="year-slider"
      type="range"
      min={years[0] || 1950}
      max={years[years.length - 1] || 2020}
      step="1"
      bind:value={selectedYear}
      on:input={e => updatePlot(+e.target.value)}
      class="year-slider"
    />
    <span class="year-label">{selectedYear}</span>
  </div>
  
  <div class="legend">
    <span class="legend-item">
      <span class="dot" style="background-color: #E63946;"></span>
      População &gt; 100M
    </span>
    <span class="legend-item">
      <span class="dot" style="background-color: #F4A261;"></span>
      População &gt; 50M
    </span>
    <span class="legend-item">
      <span class="dot" style="background-color: steelblue;"></span>
      População &lt; 50M
    </span>
    
  </div>
  
  <div class="chart-area">
    <div class="main-chart">
      <svg bind:this={svgElement}></svg>
      <div class="help-text">
        * Arraste um círculo para ver a trajetória histórica do país
      </div>
    </div>
  
    <div class="subplots">
      <svg bind:this={gdpPlot}></svg>
      <svg bind:this={lexPlot}></svg>
    </div>
  </div>
</div>

<style>
  .visualization-container {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    max-width: 1250px;
    margin: 0 auto;
    padding: 1rem;
  }
  
  h2 {
    text-align: center;
    margin: 0;
    font-size: 1.4em;
    color: #333;
  }
  
  .main-chart {
    position: relative;
    flex-shrink: 0;
  }
  
  svg {
    display: block;
    margin: 0.5em auto;
    background: #f9f9f9;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  
  :global(.axis-label) {
    font-size: 0.9em;
    font-weight: bold;
  }
  
  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1em;
    margin: 0.2em 0;
  }
  
  .control-button {
    background: #4c78a8;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 6px 12px;
    font-size: 13px;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .control-button:hover {
    background: #3a5c80;
  }
  
  .year-slider {
    flex-grow: 1;
    max-width: 400px;
    height: 6px;
    background: #ddd;
    border-radius: 3px;
    appearance: none;
    outline: none;
  }
  
  .year-slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    background: #4c78a8;
    cursor: pointer;
    border-radius: 50%;
  }
  
  .year-label {
    font-size: 1em;
    font-weight: bold;
    color: #333;
    min-width: 50px;
    text-align: center;
  }
  
  .tooltip {
    position: absolute;
    background: rgba(0,0,0,0.8);
    color: #fff;
    padding: 8px 10px;
    border-radius: 4px;
    pointer-events: none;
    font-size: 0.85em;
    z-index: 1000;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transform: translate(-50%, -110%);
    transition: opacity 0.2s;
  }
  
  .subplots {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  
  .subplots svg {
    background: #fff;
  }
  
  .help-text {
    text-align: center;
    font-size: 0.8em;
    color: #666;
    margin-top: 0.5em;
    font-style: italic;
  }
  
  .stats-panel {
    display: flex;
    justify-content: center;
    gap: 0.8em;
    margin: 0.2em 0;
  }
  
  .stat-box {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #f5f5f5;
    padding: 0.3em 0.6em;
    border-radius: 8px;
    border: 1px solid #ddd;
  }
  
  .stat-value {
    font-size: 1em;
    font-weight: bold;
    color: #333;
  }
  
  .stat-label {
    font-size: 0.65em;
    color: #666;
    margin-top: 0.2em;
  }
  
  .legend {
    display: flex;
    justify-content: center;
    gap: 0.8em;
    margin: 0;
    font-size: 0.8em;
  }
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4em;
  }
  
  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  
  .chart-area {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-top: 0.2em;
  }
</style>