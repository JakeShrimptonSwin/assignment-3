
// Jake S - This is the visualisation for the confidence score

import * as d3 from "d3";
import { useEffect, useRef } from "react";

function PhishingChart({ result }) {
    const chartRef = useRef(null);
    const previousConfidence = useRef(0);

    useEffect(() => {
        if (!result || !chartRef.current) return;

        // Get the confidence score
        const confidence = Number(result.confidence);

        if (!Number.isFinite(confidence)) return;

        // Support values between 0-1 or 0-100
        const percentage = Math.max(
            0,
            Math.min(100, confidence <= 1 ? confidence * 100 : confidence)
        );

        const width = 300;
        const height = 125;
        const radius = 100;

        // Clear the previous chart and stop existing transitions
        const svg = d3.select(chartRef.current);
        svg.selectAll("*").interrupt();
        svg.selectAll("*").remove();

        svg
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("width", "100%")
            .attr("role", "img")
            .attr(
                "aria-label",
                `Model confidence: ${percentage.toFixed(1)} percent`
            );

        const group = svg
            .append("g")
            .attr(
                "transform",
                `translate(${width / 2}, ${height - 15})`
            );

        // Semicircle angles
        const startAngle = -Math.PI / 2;
        const endAngle = Math.PI / 2;

        // Previous and target confidence positions
        const startPercentage = previousConfidence.current;

        const targetAngle =
            startAngle + (percentage / 100) * (endAngle - startAngle);

        const currentStartAngle =
            startAngle +
            (startPercentage / 100) * (endAngle - startAngle);

        // Background arc
        const backgroundArc = d3.arc()
            .innerRadius(radius - 18)
            .outerRadius(radius)
            .startAngle(startAngle)
            .endAngle(endAngle);

        group
            .append("path")
            .attr("d", backgroundArc())
            .attr("fill", "#e5e7eb");

        // Confidence arc starts at the previous score
        const valueArc = d3.arc()
            .innerRadius(radius - 18)
            .outerRadius(radius)
            .startAngle(startAngle)
            .endAngle(currentStartAngle);

        const confidenceArc = group
            .append("path")
            .attr("d", valueArc())
            .attr(
                "fill",
                result.prediction === "phishing"
                    ? "#dc2626"
                    : "#1976d2"
            );

        confidenceArc
            .style("cursor", "pointer")
            .on("mouseenter", function () {
                d3.select(this)
                    .attr("opacity", 0.75);
            })
            .on("mouseleave", function () {
                d3.select(this)
                    .attr("opacity", 1);
            });
        // Animate the arc to the new confidence score
        confidenceArc
            .transition()
            .duration(1200)
            .ease(d3.easeCubicOut)
            .attrTween("d", () => {
                const interpolate = d3.interpolate(
                    currentStartAngle,
                    targetAngle
                );

                return (t) => {
                    valueArc.endAngle(interpolate(t));
                    return valueArc();
                };
            });

        // Confidence percentage text
        const percentageText = group
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -12)
            .attr("font-size", "32px")
            .attr("font-weight", "bold")
            .attr("fill", "currentColor")
            .text(`${startPercentage.toFixed(1)}%`);

        // Animate the percentage up or down
        percentageText
            .transition()
            .duration(1200)
            .ease(d3.easeCubicOut)
            .tween("text", function () {
                const interpolate = d3.interpolateNumber(
                    startPercentage,
                    percentage
                );

                return (t) => {
                    d3.select(this).text(
                        `${interpolate(t).toFixed(1)}%`
                    );
                };
            });

        // Label beneath the percentage
        // Model confidence label
        const confidenceLabel = group
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", 13)
            .attr("font-size", "12px")
            .attr("fill", "currentColor")
            .style("cursor", "help")
            .style("text-decoration", "underline dotted")
            .text("Model confidence");

        // Custom tooltip container
        const tooltip = d3
            .select(chartRef.current.parentElement)
            .selectAll(".confidence-tooltip")
            .data([null])
            .join("div")
            .attr("class", "confidence-tooltip")
            .style("position", "absolute")
            .style("display", "none")
            .style("background", "#1f2937")
            .style("color", "#ffffff")
            .style("padding", "10px 12px")
            .style("border-radius", "8px")
            .style("font-size", "12px")
            .style("line-height", "1.5")
            .style("width", "220px")
            .style("white-space", "normal")
            .style("z-index", "10")
            .style("pointer-events", "none")
            .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
            .text(
                "The model confidence score is a measure of the model's confidence in it's prediction. A higher confidence does not guarantee that the prediction is correct."
            );

        // Show tooltip on hover
        confidenceLabel
            .on("mouseenter", function (event) {
                const [x, y] = d3.pointer(event, chartRef.current);

                tooltip
                    .style("display", "block")
                    .style("left", `${x + 10}px`)
                    .style("top", `${y - 45}px`);
            })
            .on("mouseleave", function () {
                tooltip.style("display", "none");
            });
        // Save the target score for the next prediction
        previousConfidence.current = percentage;

    }, [result]);
    if (!result) {
        return (
            <div
                style={{
                    width: "100%",
                    maxWidth: "320px",
                    margin: "0 auto 15px",
                    padding: "30px 0",
                    textAlign: "center",
                    color: "gray",
                }}
            >
                <p
                    style={{
                        fontSize: "18px",
                        fontWeight: "bold",
                        margin: "0 0 8px",
                    }}
                >
                    No prediction yet
                </p>

                <p
                    style={{
                        fontSize: "14px",
                        margin: 0,
                    }}
                >
                    Enter a URL to see its classification and confidence.
                </p>
            </div>
        );
    }
    const classification = result?.prediction === "phishing" ? "PHISHING" : "BENIGN";
    return (
        <div
            style={{
                width: "100%",
                maxWidth: "400px",
                margin: "0 auto 20px",
                padding: 0,
                lineHeight: 1,
                position: "relative",
            }}
        >
            <p>
                This URL was classified as:{" "}
                <strong style={{ color: classification === "PHISHING" ? "#dc2626" : "#1976d2", }}>
                    {classification}
                </strong>
            </p>
            <svg
                ref={chartRef}
                style={{ display: "block" }}
            />
            <div>
                <div>
                    <strong>
                        Recommendation:
                    </strong>
                </div>
                <strong style={{ color: classification === "PHISHING" ? "#dc2626" : "#1976d2", }}>
                    {classification === "PHISHING"
                        ? " Avoid this URL"
                        : " Use caution"}
                </strong>

                <p>
                    {classification === "PHISHING"
                        ? "This URL has been identified as potentially malicious. It is reccomended to avoid this website."
                        : "This URL has been classified as legitimate, but caution is advised."}
                </p>
            </div>
        </div>
    );
}

export default PhishingChart;
