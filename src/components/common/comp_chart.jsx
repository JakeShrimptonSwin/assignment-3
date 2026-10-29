//Jake S - This chart just shows the amount of data points and the spread in comparison

import * as d3 from "d3";


export async function drawUrlChart() {
    // Load data
    const data = await d3.json("/data/url_counts.json");
    //height and width for chart
    const width = 800;
    const height = 550;
    //margins
    const margin = {
        top: 40,
        right: 30,
        bottom: 60,
        left: 100,
    };

    const svg = d3.select("#url-chart");
    // Create tooltip
    const tooltip = d3.select("body")
        .selectAll(".url-chart-tooltip")
        .data([null])
        .join("div")
        .attr("class", "url-chart-tooltip")
        .style("position", "absolute")
        .style("background", "#222")
        .style("color", "#fff")
        .style("padding", "8px 12px")
        .style("border-radius", "5px")
        .style("font-size", "13px")
        .style("font-family", "inherit")
        .style("white-space", "pre-line")
        .style("pointer-events", "none")
        .style("opacity", 0)
        .style("z-index", 1000);
    svg
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("width", "100%")
        .attr("role", "img")
        .attr("aria-label", "Number of benign and phishing URLs")
        .style("font-family", "inherit");

    // Horizontal positions for each bar
    const x = d3.scaleBand()
        .domain(data.map(d => d.type))
        .range([margin.left, width - margin.right])
        .padding(0.3);

    // Vertical scale based on URL counts
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.count) * 1.1])
        .nice()
        .range([height - margin.bottom, margin.top]);

    // X axis
    svg.append("g")
        .style("font-size", "14px")
        .attr("transform",`translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x));

    // Y axis
    svg.append("g")
        .style("font-size", "14px")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickFormat(d3.format(".2s"))); //THis makes it say 100K instead of 100,000

    // Bars with hover interaction
    svg.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", d => x(d.type))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => y(0) - y(d.count))
        .attr("fill", d =>
            d.type === "Phishing" ? "#dc2626" : "#1976d2"
        )
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
            // Highlight the hovered bar
            d3.select(this)
                .attr("stroke", "#222")
                .attr("stroke-width", 2);

            // Show the number above the hovered bar
            svg.selectAll(".count-label")
                .filter(label => label.type === d.type)
                .style("fill", "#fff");

            // Display tooltip
            tooltip
                .style("opacity", 1)
                .text(`${d.type}\nCount: ${d3.format(",")(d.count)}`);
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

            // Hide the number again
            svg.selectAll(".count-label")
                .filter(label => label.type === d.type)
                .style("fill", "none");

            // Hide tooltip
            tooltip.style("opacity", 0);
        });

    // Count labels above each bar
    svg.selectAll(".count-label")
        .data(data)
        .join("text")
        .attr("class", "count-label")
        .attr("x", d => x(d.type) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 8)
        .attr("text-anchor", "middle")
        .style("font-family", "inherit")
        .style("fill", "none")
        .text(d => d3.format(",")(d.count));

    // Chart title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 22)
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .style("font-family", "inherit")
        .style("fill", "#fff")
        .text("Benign vs Phishing URLs");

    svg.selectAll("g")
        .style("font-family", "inherit");
}

