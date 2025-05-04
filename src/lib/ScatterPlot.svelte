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
    pointColor: d => {
      switch(d.continent) {
        case 'Africa': return '#d73027'; 
        case 'Americas': return '#4575b4'; 
        case 'Asia': return '#2e7d32';
        case 'Europe': return '#6a1b9a'; 
        case 'Oceania': return '#fdd835';
        default: return '#666';
      }
    },
    lineColors: {
      gdp: '#457B9D',
      lex: '#E07A5F',
      history: '#666'
    },
    subplotSize: {
      width: 350,
      height: 175,
      margin: { top: 20, right: 20, bottom: 30, left: 40 }
    },
    gdpValueFormat: d => d >= 10000 ? d3.format('.0s')(d) : d3.format(',')(d),
    yearTickFormat: d3.format('d'),
    lexValueFormat: d3.format('.1f'),
    hoverScale: 1.5, // Scale factor for hover effect
    hoverStrokeWidth: 2,
    hoverStrokeColor: '#000'
  };

  // Mapeamento de países para continentes
  const countryToContinent = {
    // África
    'Angola': 'Africa', 'Benin': 'Africa', 'Botswana': 'Africa', 'Burkina Faso': 'Africa',
    'Burundi': 'Africa', 'Cameroon': 'Africa', 'Cape Verde': 'Africa', 'Central African Republic': 'Africa',
    'Chad': 'Africa', 'Comoros': 'Africa', 'Congo': 'Africa', 'Cote d\'Ivoire': 'Africa',
    'Democratic Republic of Congo': 'Africa', 'Djibouti': 'Africa', 'Egypt': 'Africa',
    'Equatorial Guinea': 'Africa', 'Eritrea': 'Africa', 'Ethiopia': 'Africa', 'Gabon': 'Africa',
    'Gambia': 'Africa', 'Ghana': 'Africa', 'Guinea': 'Africa', 'Guinea-Bissau': 'Africa',
    'Kenya': 'Africa', 'Lesotho': 'Africa', 'Liberia': 'Africa', 'Libya': 'Africa',
    'Madagascar': 'Africa', 'Malawi': 'Africa', 'Mali': 'Africa', 'Mauritania': 'Africa',
    'Mauritius': 'Africa', 'Morocco': 'Africa', 'Mozambique': 'Africa', 'Namibia': 'Africa',
    'Niger': 'Africa', 'Nigeria': 'Africa', 'Rwanda': 'Africa', 'Sao Tome and Principe': 'Africa',
    'Senegal': 'Africa', 'Seychelles': 'Africa', 'Sierra Leone': 'Africa', 'Somalia': 'Africa',
    'South Africa': 'Africa', 'South Sudan': 'Africa', 'Sudan': 'Africa', 'Swaziland': 'Africa',
    'Tanzania': 'Africa', 'Togo': 'Africa', 'Tunisia': 'Africa', 'Uganda': 'Africa',
    'Zambia': 'Africa', 'Zimbabwe': 'Africa',

    // Américas
    'Argentina': 'Americas', 'Bolivia': 'Americas', 'Brazil': 'Americas', 'Chile': 'Americas',
    'Colombia': 'Americas', 'Costa Rica': 'Americas', 'Cuba': 'Americas', 'Dominican Republic': 'Americas',
    'Ecuador': 'Americas', 'El Salvador': 'Americas', 'Guatemala': 'Americas', 'Haiti': 'Americas',
    'Honduras': 'Americas', 'Jamaica': 'Americas', 'Mexico': 'Americas', 'Nicaragua': 'Americas',
    'Panama': 'Americas', 'Paraguay': 'Americas', 'Peru': 'Americas', 'Trinidad and Tobago': 'Americas',
    'Uruguay': 'Americas', 'Venezuela': 'Americas', 'Canada': 'Americas', 'USA': 'Americas',

    // Ásia
    'Afghanistan': 'Asia', 'Armenia': 'Asia', 'Azerbaijan': 'Asia', 'Bahrain': 'Asia',
    'Bangladesh': 'Asia', 'Bhutan': 'Asia', 'Brunei': 'Asia', 'Cambodia': 'Asia',
    'China': 'Asia', 'Cyprus': 'Asia', 'Georgia': 'Asia', 'India': 'Asia',
    'Indonesia': 'Asia', 'Iran': 'Asia', 'Iraq': 'Asia', 'Israel': 'Asia',
    'Japan': 'Asia', 'Jordan': 'Asia', 'Kazakhstan': 'Asia', 'Kuwait': 'Asia',
    'Kyrgyzstan': 'Asia', 'Laos': 'Asia', 'Lebanon': 'Asia', 'Malaysia': 'Asia',
    'Maldives': 'Asia', 'Mongolia': 'Asia', 'Myanmar': 'Asia', 'Nepal': 'Asia',
    'North Korea': 'Asia', 'Oman': 'Asia', 'Pakistan': 'Asia', 'Palestine': 'Asia',
    'Philippines': 'Asia', 'Qatar': 'Asia', 'Saudi Arabia': 'Asia', 'Singapore': 'Asia',
    'South Korea': 'Asia', 'Sri Lanka': 'Asia', 'Syria': 'Asia', 'Taiwan': 'Asia',
    'Tajikistan': 'Asia', 'Thailand': 'Asia', 'Timor-Leste': 'Asia', 'Turkey': 'Asia',
    'Turkmenistan': 'Asia', 'United Arab Emirates': 'Asia', 'Uzbekistan': 'Asia', 'Vietnam': 'Asia',
    'Yemen': 'Asia','Hong Kong, China':'Asia',

    // Europa
    'Albania': 'Europe', 'Austria': 'Europe', 'Belarus': 'Europe', 'Belgium': 'Europe',
    'Bosnia and Herzegovina': 'Europe', 'Bulgaria': 'Europe', 'Croatia': 'Europe', 'Czech Republic': 'Europe',
    'Denmark': 'Europe', 'Estonia': 'Europe', 'Finland': 'Europe', 'France': 'Europe',
    'Germany': 'Europe', 'Greece': 'Europe', 'Hungary': 'Europe', 'Iceland': 'Europe',
    'Ireland': 'Ireland', 'Italy': 'Europe', 'Latvia': 'Europe', 'Lithuania': 'Europe',
    'Luxembourg': 'Europe', 'Macedonia': 'Europe', 'Malta': 'Europe', 'Moldova': 'Europe',
    'Montenegro': 'Europe', 'Netherlands': 'Europe', 'Norway': 'Europe', 'Poland': 'Europe',
    'Portugal': 'Europe', 'Romania': 'Europe', 'Russia': 'Europe', 'Serbia': 'Europe',
    'Slovakia': 'Europe', 'Slovenia': 'Europe', 'Spain': 'Europe', 'Sweden': 'Europe',
    'Switzerland': 'Europe', 'Ukraine': 'Europe', 'UK': 'Europe','Monaco':'Europe',

    // Oceania
    'Australia': 'Oceania', 'Fiji': 'Oceania', 'Kiribati': 'Oceania', 'Marshall Islands': 'Oceania',
    'Micronesia': 'Oceania', 'Nauru': 'Oceania', 'New Zealand': 'Oceania', 'Palau': 'Oceania',
    'Papua New Guinea': 'Oceania', 'Samoa': 'Oceania', 'Solomon Islands': 'Oceania', 'Tonga': 'Oceania',
    'Tuvalu': 'Oceania', 'Vanuatu': 'Oceania'
  };

  // Elementos do DOM
  let svgElement;
  let gdpPlot;
  let lexPlot;
  let yearSlider;
  let tooltipElement;
  let searchInput;
  
  // Estado da aplicação
  let allData = [];
  let years = [];
  let selectedYear;
  let dataLoaded = false;
  let playing = false;
  let playInterval;
  let selectedCountry = null;
  let filteredCountries = [];
  let showLabels = false;
  let countryLabels = [];
  let selectedContinent = null;

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
    return data
      .filter(d => d.gdp > 0 && d.lex > 0)
      .map(d => ({
        ...d,
        continent: countryToContinent[d.country] || 'Unknown'
      }));
  }

  // Função para calcular estatísticas básicas
  function calculateStatistics(yearData) {
    totalCountries = yearData.length;
    averageLifeExpectancy = d3.mean(yearData, d => d.lex);
    averageGDP = d3.mean(yearData, d => d.gdp);
  }

  // Função para filtrar países
  function filterCountries(query) {
    if (!query) {
      filteredCountries = [];
      selectedCountry = null;
    } else {
      const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
      filteredCountries = allData.filter(d => 
        searchTerms.some(term => d.country.toLowerCase().includes(term))
      );
      // Se houver apenas um país nos resultados, selecioná-lo automaticamente
      if (filteredCountries.length === 1) {
        selectCountry(filteredCountries[0].country);
      } else {
        selectedCountry = null;
      }
    }
    updatePlot(selectedYear);
  }

  // Função para filtrar por continente
  function filterByContinent(continent) {
    selectedContinent = selectedContinent === continent ? null : continent;
    if (selectedContinent) {
      filteredCountries = allData.filter(d => d.continent === selectedContinent);
    } else {
      filteredCountries = [];
    }
    selectedCountry = null;
    updatePlot(selectedYear);
  }

  // Função para selecionar um país
  function selectCountry(country) {
    selectedCountry = country;
    const countryHistory = allData.filter(p => p.country === country && p.gdp > 0 && p.lex > 0);
    drawSubplots(countryHistory);
    
    // Destacar o país selecionado
    svg.selectAll('circle.data-point')
      .attr('opacity', d => d.country === country ? 1 : 0.1);
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
      .attr('class', 'global-tooltip')
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
        .text('PIB per Capita (USD)');

    // Eixo Y
    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(CONFIG.height - CONFIG.margin.top - CONFIG.margin.bottom) / 2)
        .attr('y', -CONFIG.margin.left + 12)
        .attr('fill', 'currentColor')
        .style('text-anchor', 'middle')
        .style('font-size', '0.8em')
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

    // Destacar pontos históricos do país com pontos cinza pequenos e uma linha
    highlightGroup.selectAll("*").remove();
    
    // Adicionar linha cinza conectando os pontos históricos
    highlightGroup.append("path")
      .datum(countryHistory)
      .attr("class", "history-path")
      .attr("fill", "none")
      .attr("stroke", "#aaa")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("d", d3.line()
        .x(p => xScale(p.gdp))
        .y(p => yScale(p.lex))
      )
      .style("pointer-events", "none");

    // Adicionar pontos cinza pequenos para cada ano histórico
    highlightGroup.selectAll(".highlight-point")
      .data(countryHistory, p => p.year)
      .enter().append("circle")
      .attr("class", "highlight-point")
      .attr("cx", p => xScale(p.gdp))
      .attr("cy", p => yScale(p.lex))
      .attr("r", 2) // Raio menor
      .attr("fill", "#aaa") // Cor cinza
      .attr("opacity", 0.8)
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
    
    // Limpar destaque (pontos e linha)
    highlightGroup.selectAll(".highlight-point, .history-path").remove();
    
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

  // Função para atualizar os labels dos países
  function updateCountryLabels() {
    if (!showLabels) {
      countryLabels = [];
      return;
    }

    const currentData = (filteredCountries.length > 0 ? filteredCountries : allData)
      .filter(d => d.year === selectedYear);

    countryLabels = currentData.map(d => ({
      country: d.country,
      x: xScale(d.gdp),
      y: yScale(d.lex),
      gdp: d.gdp,
      lex: d.lex
    }));
  }

  // Atualizar o gráfico principal para o ano selecionado
  function updatePlot(year) {
    if (!dataLoaded) return;
    
    const subset = (filteredCountries.length > 0 ? filteredCountries : allData)
      .filter(d => d.year === year);
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

    // Atualizar labels dos países
    updateCountryLabels();
  }

  // Atualizar linhas de grade
  function updateGridLines() {
    svg.selectAll('.grid').remove();
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
      .on('mouseout', hideTooltip)
      .on('click', (event, d) => selectCountry(d.country));
    
    // Atualizar todos os pontos
    enter.merge(pts)
      .transition().duration(CONFIG.transitionDuration).ease(CONFIG.transitionEase)
      .attr('cx', d => xScale(d.gdp))
      .attr('cy', d => yScale(d.lex))
      .attr('r', CONFIG.pointRadius)
      .attr('opacity', d => selectedCountry ? (d.country === selectedCountry ? 1 : 0.1) : CONFIG.pointOpacity)
      .attr('fill', CONFIG.pointColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
  }

  // Mostrar tooltip
  function showTooltip(event, d) {
    const point = d3.select(event.currentTarget);
    
    point
      .raise()
      .transition().duration(150)
      .attr('r', CONFIG.pointRadius * CONFIG.hoverScale)
      .attr('stroke', CONFIG.hoverStrokeColor)
      .attr('stroke-width', CONFIG.hoverStrokeWidth);
    
    const rect = event.currentTarget.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2 + window.scrollX;
    const targetY = rect.top + window.scrollY;
    
    tooltip.html(
      `<div><strong>País:</strong> ${d.country}</div>` + // Adicionado nome e ano para clareza
      `<div><strong>Continente:</strong> ${d.continent}</div>` +
      `<div><strong>PIB per Capita:</strong> ${d.gdp} USD</div>` + // Usar formato consistente
      `<div><strong>Expectativa de Vida:</strong> ${CONFIG.lexValueFormat(d.lex)} anos</div>` // Usar formato consistente
    );

    const tooltipNode = tooltip.node();
    if (!tooltipNode) {
      return;
    }
    const tooltipWidth = tooltipNode.offsetWidth;
    const tooltipHeight = tooltipNode.offsetHeight;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const margin = 10; 

    let tooltipX = targetX - tooltipWidth / 2;
    let tooltipY = targetY - tooltipHeight - margin; 
    
    if (tooltipX < margin) {
      tooltipX = margin;
    } else if (tooltipX + tooltipWidth > windowWidth - margin) {
      tooltipX = windowWidth - tooltipWidth - margin;
    }
    
    if (tooltipY < margin) {
      tooltipY = targetY + margin + 15;
      if (tooltipY + tooltipHeight > windowHeight - margin) {
        tooltipY = windowHeight / 2 - tooltipHeight / 2; 
      }
    }


    tooltip
      .style('left', `${tooltipX}px`)
      .style('top', `${tooltipY}px`)
      .style('opacity', 0.9);
    
    svg.selectAll('.hover-label').remove();
  }

  // Esconder tooltip
  function hideTooltip(event) {
    const point = d3.select(event.currentTarget);
    
    // Remover efeito de hover
    point
      .transition().duration(150)
      .attr('r', CONFIG.pointRadius)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
    
    // Esconder tooltip
    tooltip.style('opacity', 0);

    // Remover label
    svg.selectAll('.hover-label').remove();
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

  // Função para voltar no tempo
  function rewind() {
    const i = years.indexOf(selectedYear);
    selectedYear = years[(i - 1 + years.length) % years.length];
    yearSlider.value = selectedYear;
    updatePlot(selectedYear);
  }

  // Desenhar subgráficos para a evolução histórica de um país
  function drawSubplots(countryHistory) {
    const { width, height, margin } = CONFIG.subplotSize;
    const predictionStartYear = 2026;

    // Separar dados históricos e de previsão
    const historicalData = countryHistory.filter(d => d.year < predictionStartYear);
    // Incluir o último ano histórico no início da previsão para conectar as linhas
    const lastHistoricalPoint = historicalData[historicalData.length - 1];
    const predictedData = countryHistory.filter(d => d.year >= predictionStartYear);
    if (lastHistoricalPoint && predictedData.length > 0) {
        predictedData.unshift(lastHistoricalPoint);
    }

    const hasPrediction = predictedData.length > 1; // Precisa de pelo menos 2 pontos para uma linha

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
      ]).nice() // Use nice() para arredondar o domínio
      .range([height - margin.bottom, margin.top]);

    // Limpar gráficos existentes
    d3.select(gdpPlot).selectAll('*').remove();
    d3.select(lexPlot).selectAll('*').remove();

    // --- Gráfico de PIB ---
    const gdpSvg = d3.select(gdpPlot)
      .attr('width', width)
      .attr('height', height);

    // Adicionar eixos ao gráfico de PIB
    gdpSvg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(CONFIG.yearTickFormat))
      .append('text')
        .attr('class', 'axis-label subplot-axis-label')
        .attr('x', width / 2)
        .attr('y', margin.bottom * 0.75)
        .attr('fill', 'currentColor')
        .text('Ano');

    gdpSvg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yGDP)
        .ticks(5)
        .tickFormat(d => d / 1000)) // Milhares
      .append('text')
        .attr('class', 'axis-label subplot-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height - margin.top - margin.bottom) / 2)
        .attr('y', -margin.left + 12)
        .attr('fill', 'currentColor')
        .text('PIB (Milhares USD)');

    // Adicionar linha histórica ao gráfico de PIB
    if (historicalData.length > 0) {
      gdpSvg.append('path')
        .datum(historicalData)
        .attr('fill', 'none')
        .attr('stroke', CONFIG.lineColors.gdp)
        .attr('stroke-width', 2)
        .attr('d', d3.line()
          .x(d => x(d.year))
          .y(d => yGDP(d.gdp))
        );
    }

    // Adicionar linha de previsão ao gráfico de PIB
    if (hasPrediction) {
      gdpSvg.append('path')
        .datum(predictedData)
        .attr('fill', 'none')
        .attr('stroke', CONFIG.lineColors.gdp)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5) // Opacidade reduzida
        .attr('d', d3.line()
          .x(d => x(d.year))
          .y(d => yGDP(d.gdp))
        );
    }

    // Adicionar pontos de dados históricos ao gráfico de PIB
    gdpSvg.selectAll('.gdp-point-hist')
      .data(historicalData)
      .enter()
      .append('circle')
      .attr('class', 'gdp-point-hist')
      .attr('cx', d => x(d.year))
      .attr('cy', d => yGDP(d.gdp))
      .attr('r', 2)
      .attr('fill', CONFIG.lineColors.gdp);

    // Adicionar pontos de dados de previsão ao gráfico de PIB
    if (hasPrediction) {
      gdpSvg.selectAll('.gdp-point-pred')
        // Ignorar o primeiro ponto (que é o último histórico)
        .data(predictedData.slice(1))
        .enter()
        .append('circle')
        .attr('class', 'gdp-point-pred')
        .attr('cx', d => x(d.year))
        .attr('cy', d => yGDP(d.gdp))
        .attr('r', 2)
        .attr('fill', CONFIG.lineColors.gdp)
        .attr('fill-opacity', 0.5); // Opacidade reduzida
    }

    // Adicionar anotação de previsão (GDP)
    if (hasPrediction) {
        const annotationX = x(predictionStartYear);
        gdpSvg.append('line')
            .attr('x1', annotationX)
            .attr('x2', annotationX)
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .attr('stroke', '#aaa')
            .attr('stroke-dasharray', '3,3')
            .attr('stroke-width', 1);
        gdpSvg.append('text')
            .attr('x', annotationX + 5)
            .attr('y', margin.top + 10)
            .attr('fill', '#666')
            .style('font-size', '0.7em')
            .text('Previsão →');
    }


    // Adicionar título ao gráfico de PIB
    gdpSvg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top * 0.8)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.9em')
      .style('font-weight', 'bold')
      .text(`PIB per Capita (${countryHistory[0].country})`);

    // --- Gráfico de Expectativa de Vida ---
    const lexSvg = d3.select(lexPlot)
      .attr('width', width)
      .attr('height', height);

    // Adicionar eixos ao gráfico de expectativa de vida
    lexSvg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(CONFIG.yearTickFormat))
      .append('text')
        .attr('class', 'axis-label subplot-axis-label')
        .attr('x', width / 2)
        .attr('y', margin.bottom * 0.75)
        .attr('fill', 'currentColor')
        .text('Ano');

    lexSvg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(yLex)
        // Ajustar número de ticks para evitar sobreposição
        .ticks(Math.max(2, Math.round((yLex.domain()[1] - yLex.domain()[0]) / 10)))
      )
      .append('text')
        .attr('class', 'axis-label subplot-axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height - margin.top - margin.bottom) / 2)
        .attr('y', -margin.left + 12)
        .attr('fill', 'currentColor')
        .text('Expectativa de Vida (Anos)');

    // Adicionar linha histórica ao gráfico de expectativa de vida
    if (historicalData.length > 0) {
      lexSvg.append('path')
        .datum(historicalData)
        .attr('fill', 'none')
        .attr('stroke', CONFIG.lineColors.lex)
        .attr('stroke-width', 2)
        .attr('d', d3.line()
          .x(d => x(d.year))
          .y(d => yLex(d.lex))
        );
    }

    // Adicionar linha de previsão ao gráfico de expectativa de vida
    if (hasPrediction) {
      lexSvg.append('path')
        .datum(predictedData)
        .attr('fill', 'none')
        .attr('stroke', CONFIG.lineColors.lex)
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5) // Opacidade reduzida
        .attr('d', d3.line()
          .x(d => x(d.year))
          .y(d => yLex(d.lex))
        );
    }

    // Adicionar pontos de dados históricos ao gráfico de expectativa de vida
    lexSvg.selectAll('.lex-point-hist')
      .data(historicalData)
      .enter()
      .append('circle')
      .attr('class', 'lex-point-hist')
      .attr('cx', d => x(d.year))
      .attr('cy', d => yLex(d.lex))
      .attr('r', 2)
      .attr('fill', CONFIG.lineColors.lex);

    // Adicionar pontos de dados de previsão ao gráfico de expectativa de vida
    if (hasPrediction) {
      lexSvg.selectAll('.lex-point-pred')
        // Ignorar o primeiro ponto (que é o último histórico)
        .data(predictedData.slice(1))
        .enter()
        .append('circle')
        .attr('class', 'lex-point-pred')
        .attr('cx', d => x(d.year))
        .attr('cy', d => yLex(d.lex))
        .attr('r', 2)
        .attr('fill', CONFIG.lineColors.lex)
        .attr('fill-opacity', 0.5); // Opacidade reduzida
    }

    // Adicionar anotação de previsão (LEX)
    if (hasPrediction) {
        const annotationX = x(predictionStartYear);
        lexSvg.append('line')
            .attr('x1', annotationX)
            .attr('x2', annotationX)
            .attr('y1', margin.top)
            .attr('y2', height - margin.bottom)
            .attr('stroke', '#aaa')
            .attr('stroke-dasharray', '3,3')
            .attr('stroke-width', 1);
        lexSvg.append('text')
            .attr('x', annotationX + 5)
            .attr('y', margin.top + 10)
            .attr('fill', '#666')
            .style('font-size', '0.7em')
            .text('Previsão →');
    }


    // Adicionar título ao gráfico de expectativa de vida
    lexSvg.append('text')
      .attr('x', width / 2)
      .attr('y', margin.top * 0.8)
      .attr('text-anchor', 'middle')
      .style('font-size', '0.9em')
      .style('font-weight', 'bold')
      .text(`Expectativa de Vida (${countryHistory[0].country})`);
  }

  // Função para alternar a visibilidade dos labels
  function toggleLabels() {
    showLabels = !showLabels;
    updateCountryLabels();
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
  
  <div class="description">
    <p>Esta visualização interativa permite explorar a relação entre o PIB per capita e a expectativa de vida dos países ao longo do tempo. Você pode:</p>
    <ul>
      <li>Usar a barra de pesquisa para encontrar países específicos (separe múltiplos países com espaço)</li>
      <li>Arrastar os pontos para ver a trajetória histórica de cada país</li>
      <li>Usar os controles de tempo para avançar ou retroceder nos anos</li>
      <li>Visualizar estatísticas detalhadas nos gráficos auxiliares</li>
      <li>Passar o mouse sobre os pontos para ver informações detalhadas</li>
    </ul>
  </div>
  
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
  
  <div class="search-container">
    <input
      type="text"
      placeholder="Buscar país..."
      bind:value={searchInput}
      on:input={e => filterCountries(e.target.value)}
      class="search-input"
    />
  </div>

  <div class="continent-filters">
    <button 
      class="continent-button" 
      class:active={selectedContinent === 'Africa'}
      on:click={() => filterByContinent('Africa')}
    >
      África
    </button>
    <button 
      class="continent-button" 
      class:active={selectedContinent === 'Americas'}
      on:click={() => filterByContinent('Americas')}
    >
      Américas
    </button>
    <button 
      class="continent-button" 
      class:active={selectedContinent === 'Asia'}
      on:click={() => filterByContinent('Asia')}
    >
      Ásia
    </button>
    <button 
      class="continent-button" 
      class:active={selectedContinent === 'Europe'}
      on:click={() => filterByContinent('Europe')}
    >
      Europa
    </button>
    <button 
      class="continent-button" 
      class:active={selectedContinent === 'Oceania'}
      on:click={() => filterByContinent('Oceania')}
    >
      Oceania
    </button>
  </div>
  
  <div class="controls">
    <button on:click={rewind} class="control-button">
      ⏪ Voltar
    </button>
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

  <div class="legend">
    <div class="legend-item">
      <span class="legend-color" style="background-color: #d73027"></span>
      <span class="legend-label">África</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #4575b4"></span>
      <span class="legend-label">Américas</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #2e7d32"></span>
      <span class="legend-label">Ásia</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #6a1b9a"></span>
      <span class="legend-label">Europa</span>
    </div>
    <div class="legend-item">
      <span class="legend-color" style="background-color: #fdd835"></span>
      <span class="legend-label">Oceania</span>
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

  .description {
    max-width: 800px;
    margin: 1em auto;
    padding: 1em;
    background: #f5f5f5;
    border-radius: 8px;
    font-size: 0.9em;
    line-height: 1.5;
  }

  .description ul {
    margin: 0.5em 0;
    padding-left: 1.5em;
  }

  .description li {
    margin: 0.3em 0;
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
    font-size: 1.1em;
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
  
  .chart-area {
    display: flex;
    align-items: flex-start;
    gap: 20px;
    margin-top: 0.2em;
  }

  .search-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1em;
    margin: 1em 0;
  }

  .search-input {
    width: 300px;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 0.9em;
  }

  .search-input:focus {
    outline: none;
    border-color: #4c78a8;
    box-shadow: 0 0 0 2px rgba(76, 120, 168, 0.2);
  }

  .legend {
    display: flex;
    justify-content: center;
    gap: 1.5em;
    margin: 1em 0;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5em;
    padding: 4px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .legend-color {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid #fff;
  }

  .legend-label {
    font-size: 0.8em;
    color: #333;
    font-weight: 500;
  }

  :global(.global-tooltip) {
    position: absolute;
    background: rgba(255, 255, 255, 0.95);
    color: #333;
    padding: 12px;
    border-radius: 6px;
    pointer-events: none;
    font-size: 0.85em;
    z-index: 1000;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    border: 1px solid #ddd;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .continent-filters {
    display: flex;
    justify-content: center;
    gap: 0.5em;
    margin: 0.5em 0;
    flex-wrap: wrap;
  }

  .continent-button {
    padding: 6px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s;
  }

  .continent-button:hover {
    background: #f0f0f0;
  }

  .continent-button.active {
    background: #4c78a8;
    color: white;
    border-color: #4c78a8;
  }

  :global(.subplot-axis-label) {
    font-size: 0.8em;
    text-anchor: middle;
  }
</style>