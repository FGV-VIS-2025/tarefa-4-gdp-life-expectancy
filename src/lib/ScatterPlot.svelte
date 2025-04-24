<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let svgElement;
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 30, bottom: 60, left: 60 };

  let allData = [];
  let selectedYear = 1800;
  let dataLoaded = false;

  let xScale;
  let yScale;
  let xAxis;
  let yAxis;
  let svg;
  let yearText;
  let highlightGroup;

  let globalYMin = 0;
  let globalYMax = 100;

  let draggedCountry = null;
  let currentClosestHighlightPoint = null;

  function dragstarted(event, d) {
    if (!dataLoaded) return;
    draggedCountry = d.country;
    currentClosestHighlightPoint = d;

    d3.select(this).raise().attr("stroke", "black").attr("stroke-width", 2).style("cursor", "grabbing");

    const countryHistory = allData.filter(p => p.country === draggedCountry && !isNaN(p.gdp) && p.gdp > 0 && !isNaN(p.lex) && p.lex > 0);

    svg.selectAll('circle:not(.highlight-point)')
       .filter(circleData => circleData.country !== draggedCountry)
       .transition()
       .duration(200)
       .attr('opacity', 0.1);

    highlightGroup.selectAll("*").remove();
    highlightGroup.selectAll(".highlight-point")
        .data(countryHistory, p => p.year)
        .enter()
        .append("circle")
        .attr("class", "highlight-point")
        .attr("cx", p => xScale(p.gdp))
        .attr("cy", p => yScale(p.lex))
        .attr("r", 4)
        .attr("fill", "red")
        .attr("opacity", 0.6)
        .style("pointer-events", "none")
        .append("title")
         .text(p => `${p.country} (${p.year})\nGDP: ${p.gdp}\nLife Exp: ${p.lex.toFixed(1)}`);
  }

  function dragged(event, d) {
      if (!draggedCountry) return;

      let minDistance = Infinity;
      let closestPoint = null;

      highlightGroup.selectAll(".highlight-point")
          .each(function(p) {
              const markerX = +d3.select(this).attr("cx");
              const markerY = +d3.select(this).attr("cy");
              const [svgX, svgY] = d3.pointer(event, svg.node());
              const dx = svgX - markerX;
              const dy = svgY - markerY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < minDistance) {
                  minDistance = distance;
                  closestPoint = p;
              }
          });

      if (closestPoint && currentClosestHighlightPoint?.year !== closestPoint.year) {
          currentClosestHighlightPoint = closestPoint;

          d3.select(this)
            .transition()
            .duration(50)
            .attr('cx', xScale(closestPoint.gdp))
            .attr('cy', yScale(closestPoint.lex));
      }
  }

  function dragended(event, d) {
    if (!draggedCountry) return;

    const finalClosestPoint = currentClosestHighlightPoint;

    d3.select(this).attr("stroke", null).attr("stroke-width", null).style("cursor", "grab");
    highlightGroup.selectAll(".highlight-point").remove();
    svg.selectAll('circle:not(.highlight-point)')
        .transition()
        .duration(200)
        .attr('opacity', 0.7);

    draggedCountry = null;
    currentClosestHighlightPoint = null;

    if (finalClosestPoint && selectedYear !== finalClosestPoint.year) {
       selectedYear = finalClosestPoint.year;
    } else {
         if (finalClosestPoint && selectedYear === finalClosestPoint.year) {
             updatePlot(selectedYear);
         }
    }
  }

  function updatePlot(year) {
    if (!dataLoaded || !svg) return;

    const filteredData = allData.filter(d => d.year === year && !isNaN(d.gdp) && d.gdp > 0 && !isNaN(d.lex) && d.lex > 0);

    // xScale.domain([0, d3.max(filteredData, d => d.gdp)]).nice(); // Domain is now fixed
    yScale.domain([globalYMin, globalYMax]); // Keep Y scale dynamic or fix as needed

    // No need to update x-axis transitionally if its domain is fixed
    // svg.select('.x-axis')
    //    .transition()
    //    .duration(750)
    //    .call(xAxis);

    svg.select('.y-axis')
       .transition()
       .duration(750)
       .call(yAxis);

    const circles = svg.selectAll('circle:not(.highlight-point)')
      .data(filteredData, d => d.country);

    circles.exit()
      .transition()
      .duration(750)
      .attr('r', 0)
      .remove();

    const drag = d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);

    const enteringCircles = circles.enter()
      .append('circle')
        .attr('fill', 'steelblue')
        .attr('opacity', 0)
        .attr('r', 0)
        .attr('cx', d => xScale(d.gdp))
        .attr('cy', d => yScale(d.lex))
        .style("cursor", "grab")
        .call(drag);

    enteringCircles.append('title');

    const mergedCircles = enteringCircles.merge(circles);

    mergedCircles.select('title')
         .text(d => `${d.country} (${d.year})\nGDP: ${d.gdp}\nLife Expectancy: ${d.lex.toFixed(1)}`);

    mergedCircles.on('mouseover', function(event, d) {
            if (d3.select(this).attr("stroke") !== "black") {
                d3.select(this).attr('stroke', '#333').attr('stroke-width', 1.5);
            }
        })
        .on('mouseout', function(event, d) {
            if (d3.select(this).attr("stroke") === "#333") {
                d3.select(this).attr('stroke', null).attr('stroke-width', null);
            }
        });

    mergedCircles.transition()
        .duration(750)
          .attr('cx', d => xScale(d.gdp))
          .attr('cy', d => yScale(d.lex))
          .attr('r', 5)
          .attr('opacity', 0.7);

    yearText.text(year);
  }

  onMount(async () => {
    const data = await d3.csv('/gdp-life-expectancy.csv', (d) => {
      const lex = +d.lex;
      return {
        country: d.country,
        year: +d.year,
        gdp: +d.gdp,
        lex: isNaN(lex) ? undefined : lex,
      };
    });
    allData = data;

    const validLex = allData.map(d => d.lex).filter(l => l !== undefined);
    globalYMin = 0;
    globalYMax = d3.max(validLex);
    globalYMax = Math.ceil(globalYMax / 10) * 10;

    svg = d3.select(svgElement)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    highlightGroup = svg.append("g").attr("class", "highlight-layer");

    xScale = d3.scaleLog()
      .domain([250, 200000]) // Adjusted domain start to 250 for visual spacing
      .range([0, width - margin.left - margin.right]);

    yScale = d3.scaleLinear()
      .domain([globalYMin, globalYMax])
      .range([height - margin.top - margin.bottom, 0]);

    // Custom ticks for log scale
    const xTickValues = [500, 1000, 2000, 4000, 8000, 16000, 32000, 64000, 128000];
    const formatNumber = d3.format(","); // Basic formatter
    const formatTicks = (d) => {
        if (d >= 10000) { // Use 'k' notation only for 10k and above
            return d3.format(".0s")(d).replace('k', 'k');
        }
        // Display the number as is for values below 10k
        return d;
    };

    xAxis = d3.axisBottom(xScale)
              .tickValues(xTickValues)
              .tickFormat(formatTicks); // Apply custom ticks and format

    yAxis = d3.axisLeft(yScale)
             .ticks((globalYMax - globalYMin) / 10)
             .tickFormat(d3.format("d"));

    svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
      .call(xAxis)
      .append('text')
        .attr('class', 'axis-label')
        .attr('x', (width - margin.left - margin.right) / 2)
        .attr('y', margin.bottom - 15)
        .attr('fill', 'currentColor')
        .style('text-anchor', 'middle')
        .text('GDP per capita');

    svg.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height - margin.top - margin.bottom) / 2)
        .attr('y', -margin.left + 15)
        .attr('fill', 'currentColor')
        .style('text-anchor', 'middle')
        .text('Life Expectancy (Years)');

    yearText = svg.append("text")
        .attr("x", width - margin.left - margin.right)
        .attr("y", height - margin.top - margin.bottom - 10)
        .attr("text-anchor", "end")
        .style("font-size", "2em")
        .style("font-weight", "bold")
        .attr("fill", "#ccc");

    dataLoaded = true;
    updatePlot(selectedYear);

  });

  $: if (selectedYear && dataLoaded) updatePlot(selectedYear);

</script>

<style>
  svg {
    display: block;
    margin: 1em auto;
    background-color: #f9f9f9;
    border: 1px solid #ccc;
  }

  :global(.axis-label) {
    font-size: 0.8em;
  }
</style>

<h2>GDP vs. Life Expectancy</h2>
<svg bind:this={svgElement}></svg> 