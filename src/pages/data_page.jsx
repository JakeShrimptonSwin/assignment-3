//Jake Shrimpton
//This page will show s vis of the collected data used for testing


import { useEffect } from "react";
import { drawUrlChart } from "../components/common/comp_chart.jsx";
import { drawFeatureCorrelationChart } from "../components/common/feature_chart.jsx";


function DataPage() {
  useEffect(() => {
    drawUrlChart().catch(error => {
      console.error("Failed to render URL chart:", error);
    });

    drawFeatureCorrelationChart().catch(error => {
      console.error(
        "Failed to render feature correlation chart:",
        error
      );
    });
  }, []);
  return (
    <div className="App-header">
      <h1>Data Analysis</h1>
      <p>Visualisations of data will appear here</p>
      <svg id="url-chart"></svg>
      <svg id="correlation-chart"></svg>
    </div>
  );
}

export default DataPage;