const populationFile = "/data/population.csv";
const gdpPerCapitaFile = "/data/time_series_gdp.csv";
const numImmigrantsFile = "/data/time_series_num_immigrants.csv";
const countriesFile = "/json/continents.json";

Promise.all([
  d3.csv(populationFile),
  d3.csv(gdpPerCapitaFile),
  d3.csv(numImmigrantsFile),
  d3.json(countriesFile),
])
  .then(ready)
  .catch((error) => console.error(error));

function ready([
  populationData,
  gdpPerCapitaData,
  numImmigrantsData,
  countriesData,
]) {
  const width = 1100; // Increase this value to accommodate the legend
  const height = 600;
  const padding = 70; // Increase this value to add more space
  const totalWidth = 1300;

  const svg = d3.select("#chart").select("svg");

  const xScale = d3.scaleLog().range([padding, width - padding]);
  const yScale = d3.scaleLog().range([height - padding, padding]);
  const sizeScale = d3.scaleSqrt().range([5, 50]);

  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat((d, i) => (i % 10 === 0 ? d3.format("~d")(d) : ""));

  const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d, i) => (i % 2 === 0 ? d3.format("~d")(d) : ""));

  svg
    .append("g")
    .attr("transform", `translate(0, ${height - padding})`)
    .attr("class", "x-axis");

  svg
    .append("g")
    .attr("transform", `translate(${padding}, 0)`)
    .attr("class", "y-axis");

  const xAxisLabel = svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", width - padding)
    .attr("y", height - 10)
    .attr("text-anchor", "end")
    .text("Number of Nonimmigrants →");

  const yAxisLabel = svg
    .append("text")
    .attr("class", "axis-label")
    .attr("x", -padding - 120)
    .attr("y", 10)
    .attr("text-anchor", "start")
    .attr("transform", "rotate(-90)")
    .text("GDP per Capita →");

  const tooltip = d3
    .select("#chart")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  function getContinent(countryName) {
    const countryData = countriesData.find(
      (country) => country.country === countryName
    );
    return countryData ? countryData.continent : null;
  }

  const colorScale = d3
    .scaleOrdinal(d3.schemeCategory10)
    .domain([
      "Africa",
      "Asia",
      "Europe",
      "North America",
      "Oceania",
      "South America",
    ]);

  initializeScales(2012);

  function initializeScales(year) {
    const initialData = populationData
      .map((row, i) => {
        return {
          country: row["Country Name"],
          population: +row[year],
          gdpPerCapita: +gdpPerCapitaData[i][year],
          numImmigrants: +numImmigrantsData[i][year],
        };
      })
      .filter((d) => d.population && d.gdpPerCapita && d.numImmigrants);

    const xminValue = 10; // Minimum value for the xScale domain
    const yminValue = 200; // Minimum value for the yScale
    xScale.domain([xminValue, d3.max(initialData, (d) => d.numImmigrants)]);
    yScale.domain([200, d3.max(initialData, (d) => d.gdpPerCapita)]);
    sizeScale.domain(d3.extent(initialData, (d) => d.population));
  }

  function updateChart(year) {
    const data = populationData
      .map((row, i) => {
        return {
          country: row["Country Name"],
          population: +row[year],
          gdpPerCapita: +gdpPerCapitaData[i][year],
          numImmigrants: +numImmigrantsData[i][year],
        };
      })
      .filter((d) => d.population && d.gdpPerCapita && d.numImmigrants);

    svg
      .select(".x-axis")
      .call(xAxis)
      .selectAll("text")
      .attr("y", 9)
      .attr("x", -5)
      .attr("dy", ".35em")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.select(".y-axis").call(yAxis);

    const bubbles = svg.selectAll(".bubble").data(data, (d) => d.country);

    bubbles
      .enter()
      .append("circle")
      .attr("class", "bubble")
      .attr("fill", (d) => colorScale(getContinent(d.country)))
      .on("mouseover", (event, d) => {
        tooltip.transition().duration(200).style("opacity", 0.9);
        svg
          .selectAll(".bubble")
          .transition()
          .duration(100)
          .style("opacity", (other) => (other === d ? 1 : 0.1));
      })
      .on("mousemove", (event, d) => {
        const svgRect = svg.node().getBoundingClientRect();
        const [mouseX, mouseY] = d3.pointer(event, svg.node());
        tooltip
          .html(
            `${d.country}<br>GDP per Capita: ${d.gdpPerCapita.toFixed(
              2
            )}<br>Population: ${d.population.toLocaleString()}<br>Number of Non-Immigrants: ${
              d.numImmigrants
            }`
          )
          .style("left", mouseX - 150 / 2 + "px")
          .style("top", mouseY - 80 + "px")
          .style("opacity", 0.9);
      })
      .on("mouseout", () => {
        tooltip.transition().duration(500).style("opacity", 0);
        svg.selectAll(".bubble").transition().duration(100).style("opacity", 1);
      })
      .merge(bubbles)
      .attr("cx", (d) => xScale(d.numImmigrants))
      .attr("cy", (d) => yScale(d.gdpPerCapita))
      .attr("r", (d) => sizeScale(d.population));
    bubbles.exit().remove();
  }
  d3.select("#slider").on("input", function () {
    const year = this.value;
    d3.select("#year").text(year);
    updateChart(year);
  });

  function drawLegend() {
    const continents = [
      "Africa",
      "Asia",
      "Europe",
      "North America",
      "Oceania",
      "South America",
    ];

    const legend = svg
      .append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${totalWidth - 200}, ${padding})`);

    const legendItems = legend
      .selectAll(".legend-item")
      .data(continents)
      .enter()
      .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 25})`);

    legendItems
      .append("rect")
      .attr("width", 20)
      .attr("height", 20)
      .attr("fill", (d) => colorScale(d));

    legendItems
      .append("text")
      .attr("x", 30)
      .attr("y", 15)
      .text((d) => d);

    // Add mouseover and mouseout events to legend items
    legendItems
      .on("mouseover", function (event, selectedContinent) {
        svg
          .selectAll(".bubble")
          .transition()
          .duration(200)
          .style("opacity", (bubble) =>
            getContinent(bubble.country) === selectedContinent ? 1 : 0.1
          );
      })
      .on("mouseout", function () {
        svg.selectAll(".bubble").transition().duration(200).style("opacity", 1);
      });
  }

  updateChart(2012);
  drawLegend();
}
