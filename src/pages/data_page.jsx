// Jake Shrimpton
// This page shows visualisations of the collected data used for testing.

import { useEffect } from "react";
import { drawUrlChart } from "../components/common/comp_chart.jsx";
import { drawFeatureCorrelationChart } from "../components/common/feature_chart.jsx";

function DataPage() {
    useEffect(() => {
        drawUrlChart().catch(error => {
            console.error("Failed to render URL chart:", error);
        });

        drawFeatureCorrelationChart().catch(error => {
            console.error("Failed to render feature correlation chart:", error);
        });
    }, []);

    return (
        <div className="App-header">
            <h1>Data Analysis</h1>
            <p>
                These visualisations provide an overview of the dataset used
                to train and evaluate the phishing URL detection models.
            </p>

            {/* URL distribution chart */}
            <section className="data-section">
                <div className="data-description">
                    <h2>URL Classification Distribution</h2>
                    <p>
                        This chart compares the number of benign and phishing URLS within the training data for phishing URL detection model. 
                    </p>
                </div>

                <div className="data-chart">
                    <svg id="url-chart"></svg>
                </div>
            </section>

            {/* Feature correlation chart */}
            <section className="data-section">
                <div className="data-chart">
                    <svg id="correlation-chart"></svg>
                </div>
                <div className="data-description">
                    <h2>Feature Correlations</h2>
                    <p>
                        This chart displays the correlation between individual
                        URL features and the phishing classification. Positive
                        correlations indicate that higher feature values are
                        associated with phishing URLs, while negative
                        correlations indicate the opposite. Values closer to
                        zero indicate a weaker linear relationship.
                        Correlation does not necessarily imply causation.
                    </p>
                </div>

            </section>
        </div>
    );
}

export default DataPage;