<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';
  import { base } from '$app/paths';

  let svgElement;
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 30, bottom: 60, left: 60 };

  let gdpPlot;
  let lexPlot;

  let allData = [];
  let selectedYear;
  let dataLoaded = false;

  let xScale, yScale, xAxis, yAxis, svg, yearText, highlightGroup;
  let years = [];
  let playing = false;
  let playInterval;

  let globalYMin = 0;
  let globalYMax = 100;

  let draggedCountry = null;
  let currentClosestHighlightPoint = null;

  let tooltip;

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

    drawSubplots(countryHistory); // <<< chama a função para desenhar subplots

    svg.selectAll('circle.data-point')
      .filter(c => c.country !== draggedCountry)
      .transition().duration(200)
      .attr('opacity', 0.1);

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

    if (closestPoint && currentClosestHighlightPoint?.year !== closestPoint.year) {
      currentClosestHighlightPoint = closestPoint;
      d3.select(this)
        .transition().duration(50)
        .attr('cx', xScale(closestPoint.gdp))
        .attr('cy', yScale(closestPoint.lex));
    }
  }

  function dragended(event, d) {
    if (!draggedCountry) return;
    const finalPoint = currentClosestHighlightPoint;

    d3.select(this)
      .attr("stroke", null)
      .attr("stroke-width", null)
      .style("cursor", "grab");
    highlightGroup.selectAll(".highlight-point").remove();
    svg.selectAll('circle.data-point')
      .transition().duration(200)
      .attr('opacity', 0.7);

    draggedCountry = null;
    currentClosestHighlightPoint = null;

    if (finalPoint && selectedYear !== finalPoint.year) {
      selectedYear = finalPoint.year;
    }
    updatePlot(selectedYear);
  }

  function updatePlot(year) {
    if (!dataLoaded) return;
    const subset = allData.filter(d => d.year === year);

    yScale.domain([globalYMin, globalYMax]);
    svg.select('.y-axis').transition().duration(750).call(yAxis);
    svg.select('.x-axis').transition().duration(750).call(xAxis);

    svg.selectAll('.grid').remove();
    svg.append('g').attr('class','grid')
      .call(d3.axisLeft(yScale).ticks((globalYMax-globalYMin)/10).tickSize(-width+margin.left+margin.right).tickFormat(''))
      .selectAll('line').attr('stroke','#e0e0e0');
    svg.append('g').attr('class','grid')
      .attr('transform',`translate(0,${height-margin.top-margin.bottom})`)
      .call(d3.axisBottom(xScale).tickValues([500,1000,2000,4000,8000,16000,32000,64000,128000]).tickSize(-height+margin.top+margin.bottom).tickFormat(''))
      .selectAll('line').attr('stroke','#e0e0e0');

    const pts = svg.selectAll('circle.data-point').data(subset, d=>d.country);
    pts.exit().transition().duration(750).attr('r',0).remove();
    const enter = pts.enter().append('circle').attr('class','data-point')
      .attr('fill','steelblue').attr('opacity',0).attr('r',0)
      .attr('cx',d=>xScale(d.gdp)).attr('cy',d=>yScale(d.lex))
      .style('cursor','grab').call(d3.drag().on('start',dragstarted).on('drag',dragged).on('end',dragended))
      .on('mouseover',(e,d)=>{
        d3.select(e.currentTarget).attr('stroke','#333').attr('stroke-width',1.5);
        tooltip.style('opacity',0.9)
          .html(`<strong>${d.country}</strong><br/>Year: ${d.year}<br/>GDP: ${d3.format(',')(d.gdp)}<br/>Life Exp: ${d.lex.toFixed(1)}`)
          .style('left',`${xScale(d.gdp)+margin.left+10}px`)
          .style('top',`${yScale(d.lex)+margin.top-30}px`);
      })
      .on('mouseout',(e)=>{d3.select(e.currentTarget).attr('stroke',null);tooltip.style('opacity',0);});
    enter.merge(pts).transition().duration(750)
      .attr('cx',d=>xScale(d.gdp)).attr('cy',d=>yScale(d.lex)).attr('r',5).attr('opacity',0.7);

    yearText.text(year);
  }

  function togglePlay() {
    playing = !playing;
    if (playing) playInterval = setInterval(()=>{
      const i = years.indexOf(selectedYear);
      selectedYear = years[(i+1)%years.length];
      updatePlot(selectedYear);
    },1000);
    else clearInterval(playInterval);
  }

  function drawSubplots(countryHistory) {
    const subplotWidth = 400;
    const subplotHeight = 150;
    const subplotMargin = { top: 20, right: 20, bottom: 30, left: 40 };

    const x = d3.scaleLinear()
      .domain(d3.extent(countryHistory, d => d.year))
      .range([subplotMargin.left, subplotWidth - subplotMargin.right]);

    const yGDP = d3.scaleLinear()
      .domain([0, d3.max(countryHistory, d => d.gdp)]).nice()
      .range([subplotHeight - subplotMargin.bottom, subplotMargin.top]);

    const yLex = d3.scaleLinear()
      .domain([d3.min(countryHistory, d => d.lex) - 5, d3.max(countryHistory, d => d.lex) + 5])
      .range([subplotHeight - subplotMargin.bottom, subplotMargin.top]);

    d3.select(gdpPlot).selectAll('*').remove();
    d3.select(lexPlot).selectAll('*').remove();

    const gdpSvg = d3.select(gdpPlot)
      .attr('width', subplotWidth)
      .attr('height', subplotHeight);

    gdpSvg.append('g')
      .attr('transform', `translate(0,${subplotHeight - subplotMargin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')));
    gdpSvg.append('g')
      .attr('transform', `translate(${subplotMargin.left},0)`)
      .call(d3.axisLeft(yGDP));

    gdpSvg.append('path')
      .datum(countryHistory)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => yGDP(d.gdp))
      );

    gdpSvg.append('text')
      .attr('x', subplotWidth / 2)
      .attr('y', subplotMargin.top)
      .attr('text-anchor', 'middle')
      .style('font-size', '1em')
      .text('PIB per Capita');

    const lexSvg = d3.select(lexPlot)
      .attr('width', subplotWidth)
      .attr('height', subplotHeight);

    lexSvg.append('g')
      .attr('transform', `translate(0,${subplotHeight - subplotMargin.bottom})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format('d')));
    lexSvg.append('g')
      .attr('transform', `translate(${subplotMargin.left},0)`)
      .call(d3.axisLeft(yLex));

    lexSvg.append('path')
      .datum(countryHistory)
      .attr('fill', 'none')
      .attr('stroke', 'tomato')
      .attr('stroke-width', 2)
      .attr('d', d3.line()
        .x(d => x(d.year))
        .y(d => yLex(d.lex))
      );

    lexSvg.append('text')
      .attr('x', subplotWidth / 2)
      .attr('y', subplotMargin.top)
      .attr('text-anchor', 'middle')
      .style('font-size', '1em')
      .text('Expectativa de Vida');
  }

  onMount(async()=>{
    const data = await d3.csv(`${base}/gdp-life-expectancy.csv`, d => ({ country: d.country, year: +d.year, gdp: +d.gdp, lex: +d.lex }));
    allData = data.filter(d => d.gdp > 0 && d.lex > 0);
    years = Array.from(new Set(allData.map(d => d.year))).sort((a, b) => a - b);
    selectedYear = years[0];
    globalYMax = Math.ceil(d3.max(allData, d => d.lex) / 10) * 10;

    svg = d3.select(svgElement).attr('width', width).attr('height', height)
      .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    xScale = d3.scaleLog().domain([250, 200000]).range([0, width - margin.left - margin.right]);
    yScale = d3.scaleLinear().domain([globalYMin, globalYMax]).range([height - margin.top - margin.bottom, 0]);
    xAxis = d3.axisBottom(xScale).tickValues([500,1000,2000,4000,8000,16000,32000,64000,128000]).tickFormat(d => d >= 10000 ? d3.format('.0s')(d) : d).tickSize(0);
    yAxis = d3.axisLeft(yScale).ticks((globalYMax - globalYMin) / 10).tickFormat(d3.format('d'));

    svg.append('g').attr('class', 'x-axis').attr('transform', `translate(0,${height - margin.top - margin.bottom})`).call(xAxis)
      .append('text').attr('class', 'axis-label').attr('x', (width - margin.left - margin.right) / 2).attr('y', margin.bottom - 15)
        .attr('fill', 'currentColor').style('text-anchor', 'middle').text('GDP per Capita');
    svg.append('g').attr('class', 'y-axis').call(yAxis)
      .append('text').attr('class', 'axis-label').attr('transform', 'rotate(-90)')
        .attr('x', -(height - margin.top - margin.bottom) / 2).attr('y', -margin.left + 15)
        .attr('fill', 'currentColor').style('text-anchor', 'middle').text('Life Expectancy (Years)');

    yearText = svg.append('text').attr('x', width - margin.left - margin.right).attr('y', height - margin.top - margin.bottom - 10)
      .attr('text-anchor', 'end').style('font-size', '2em').style('font-weight', 'bold').attr('fill', '#ccc');

    tooltip = d3.select(svgElement.parentNode).append('div').attr('class', 'tooltip').style('opacity', 0);

    highlightGroup = svg.append('g').attr('class', 'highlight-layer');
    dataLoaded = true;
    updatePlot(selectedYear);
  });

  $: if (dataLoaded) updatePlot(selectedYear);
</script>

<style>
  svg { display: block; margin: 1em auto; background: #f9f9f9; border: 1px solid #ccc; }
  :global(.axis-label) { font-size: 0.9em; font-weight: bold; }
  .controls { display: flex; justify-content: center; align-items: center; gap: 1em; margin-bottom: 0.5em; }
  .controls input[type="range"] { width: 300px; }
  .tooltip { position: absolute; background: rgba(0,0,0,0.7); color: #fff; padding: 6px 8px; border-radius: 4px; pointer-events: none; font-size: 0.85em; }
  .subplots { display: flex; justify-content: center; align-items: center; gap: 2em; margin-top: 1em; }
  .subplots svg { background: #fff; border: 1px solid #ccc; }
</style>

<h2>GDP vs. Life Expectancy</h2>
<div class="controls">
  <button on:click={togglePlay}>{playing ? 'Pause' : 'Play'}</button>
  <input type="range" min={years[0]} max={years[years.length-1]} step="1" bind:value={selectedYear} on:input={e=>updatePlot(+e.target.value)}/>
  <span>{selectedYear}</span>
</div>
<svg bind:this={svgElement}></svg>

<div class="subplots">
  <svg bind:this={gdpPlot}></svg>
  <svg bind:this={lexPlot}></svg>
</div>
