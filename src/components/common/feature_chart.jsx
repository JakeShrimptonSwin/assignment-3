//Jake S - This chart shows the correlations of features, like in assignment 2
import * as d3 from "d3";

export async function drawFeatureCorrelationChart() {
    // Load data
    const data = await d3.json("/data/feature_correlations.json");

    // Sort all features by correlations
    const chartData = data.sort((a, b) =>
        b.correlation - a.correlation
    );

    // Chart dimensions
    const width = 800;
    const height = 550;

    // Margins
    const margin = {
        top: 50,
        right: 50,
        bottom: 50,
        left: 220,
    };

    const svg = d3.select("#correlation-chart");

    const tooltip = d3.select("body")
        .selectAll(".correlation-chart-tooltip")
        .data([null])
        .join("div")
        .attr("class", "correlation-chart-tooltip")
        .style("position", "absolute")
        .style("background", "#222")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "5px")
        .style("font-size", "13px")
        .style("white-space", "pre-line")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 1000);


    svg.attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("role", "img")
        .attr(
            "aria-label",
            "Top 15 URL features correlated with phishing classification"
        )
        .style("font-family", "inherit");

    // Horizontal scale for correlation values
    const x = d3.scaleLinear()
        .domain([
            Math.min(0, d3.min(chartData, d => d.correlation)) - 0.020, //adds some space for labes
            Math.max(0, d3.max(chartData, d => d.correlation))
        ])
        .nice()
        .range([margin.left, width - margin.right]);

    // Vertical scale for feature names
    const y = d3.scaleBand()
        .domain(chartData.map(d => d.feature))
        .range([margin.top, height - margin.bottom])
        .padding(0.25);

    // X axis
    svg.append("g")
        .attr(
            "transform",
            `translate(0,${height - margin.bottom})`
        )
        .call(d3.axisBottom(x).tickFormat(d3.format(".2f")));

    // Y axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y));

    // Zero reference line
    svg.append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", margin.top)
        .attr("y2", height - margin.bottom)
        .attr("stroke", "#666")
        .attr("stroke-dasharray", "4,4");

    // Correlation bars with hover interaction
    svg.selectAll(".correlation-bar")
        .data(chartData)
        .join("rect")
        .attr("class", "correlation-bar")
        .attr("x", d =>
            d.correlation >= 0 ? x(0) : x(d.correlation)
        )
        .attr("y", d => y(d.feature))
        .attr("width", d =>
            Math.abs(x(d.correlation) - x(0))
        )
        .attr("height", y.bandwidth())
        .attr("fill", d =>
            d.correlation >= 0 ? "#dc2626" : "#1976d2"
        )
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            // Highlight the hovered bar
            d3.select(this)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
            svg.selectAll(".correlation-label")
                .filter(label => label.feature === d.feature)
                .style("fill", "#fff");

            // Display feature details
            tooltip
                .style("opacity", 1)
                .text(
                    `Feature: ${d.feature}\n` +
                    `Correlation: ${d.correlation.toFixed(3)}`
                );
        })
        .on("mousemove", function (event) {
            // Follow the mouse
            tooltip
                .style("left", `${event.pageX + 12}px`)
                .style("top", `${event.pageY + 12}px`);
        })
        .on("mouseout", function (event, d) {
            // Remove highlight
            d3.select(this)
                .attr("stroke", null)
                .attr("stroke-width", null);
            svg.selectAll(".correlation-label")
                .filter(label => label.feature === d.feature)
                .style("fill", "none");
            // Hide tooltip
            tooltip.style("opacity", 0);
        });

    // Correlation value labels
    svg.selectAll(".correlation-label")
        .data(chartData)
        .join("text")
        .attr("class", "correlation-label")
        .attr("x", d =>
            d.correlation >= 0
                ? x(d.correlation) + 5
                : x(d.correlation) - 5
        )
        .attr("y", d =>
            y(d.feature) + y.bandwidth() - 3
        )
        .attr("text-anchor", d =>
            d.correlation >= 0 ? "start" : "end"
        )
        .attr("dominant-baseline", "middle")
        .style("font-family", "inherit")
        .style("font-size", "9px")
        .style("fill", "none")
        .text(d => d.correlation.toFixed(3));

    // Chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .style("font-family", "inherit")
        .style("fill", "#fff")
        .text("Feature Correlation with Phishing");

    // Apply consistent font styling to axes
    svg.selectAll("g")
        .style("font-family", "inherit");
}