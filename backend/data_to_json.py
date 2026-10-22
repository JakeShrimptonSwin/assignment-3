# Jake S - Generate JSON data for D3.js visualisations

import json
from pathlib import Path

import pandas as pd

# File paths - adjust these to match your project structure
input_file = Path("backend/data/malicious_phish_updated.csv")
counts_output = Path("public/data/url_counts.json")
correlations_output = Path("public/data/feature_correlations.json")

# Columns that should not be included in numerical correlations
excluded_columns = {"url", "label", "tld"}

# Process the large CSV in chunks to reduce memory usage
chunk_size = 50000

# Count benign and phishing URLs
counts = {"0": 0, "1": 0}

# Store the running statistics required to calculate correlations
# Each feature stores:
# n, sum_x, sum_y, sum_x2, sum_y2, sum_xy
stats = {}


def generate_graph_data():
    # Read the CSV header to identify the feature columns
    header = pd.read_csv(input_file, nrows=0).columns.tolist()

    feature_columns = [
        column for column in header
        if column not in excluded_columns
    ]

    for feature in feature_columns:
        stats[feature] = [0, 0.0, 0.0, 0.0, 0.0, 0.0]

    columns_to_read = ["label"] + feature_columns

    # Read the dataset in chunks instead of loading it all at once
    for chunk in pd.read_csv(
        input_file,
        usecols=columns_to_read,
        chunksize=chunk_size,
        low_memory=False
    ):
        # Convert labels to numeric values
        labels = pd.to_numeric(chunk["label"], errors="coerce")

        # Only include rows with valid labels: 0 = Benign, 1 = Phishing
        valid_labels = labels.isin([0, 1])
        labels = labels[valid_labels]

        # Update class counts
        counts["0"] += int((labels == 0).sum())
        counts["1"] += int((labels == 1).sum())

        # Calculate the statistics needed for each feature's correlation
        for feature in feature_columns:
            values = pd.to_numeric(
                chunk.loc[valid_labels, feature],
                errors="coerce"
            )

            # Ignore missing or invalid feature values
            valid = values.notna() & labels.notna()
            x = values[valid].astype("float64")
            y = labels[valid].astype("float64")

            if x.empty:
                continue

            n = len(x)
            current = stats[feature]

            current[0] += n
            current[1] += x.sum()
            current[2] += y.sum()
            current[3] += (x * x).sum()
            current[4] += (y * y).sum()
            current[5] += (x * y).sum()

    # Prepare URL count data
    count_data = [
        {"type": "Benign", "count": counts["0"]},
        {"type": "Phishing", "count": counts["1"]}
    ]

    # Calculate Pearson correlation coefficients
    correlation_data = []

    for feature, values in stats.items():
        n, sum_x, sum_y, sum_x2, sum_y2, sum_xy = values

        if n < 2:
            continue

        numerator = n * sum_xy - sum_x * sum_y

        denominator_x = n * sum_x2 - sum_x ** 2
        denominator_y = n * sum_y2 - sum_y ** 2

        denominator_product = denominator_x * denominator_y

        # Skip features with no variation or invalid calculations
        if denominator_product <= 0:
            continue

        correlation = numerator / (denominator_product ** 0.5)

        correlation_data.append({
            "feature": feature,
            "correlation": round(correlation, 6)
        })

    # Sort by absolute correlation, strongest first
    correlation_data.sort(
        key=lambda item: abs(item["correlation"]),
        reverse=True
    )

    # Ensure output directories exist
    counts_output.parent.mkdir(parents=True, exist_ok=True)
    correlations_output.parent.mkdir(parents=True, exist_ok=True)

    # Export URL counts
    with counts_output.open("w", encoding="utf-8") as file:
        json.dump(count_data, file, indent=2)

    # Export feature correlations
    with correlations_output.open("w", encoding="utf-8") as file:
        json.dump(correlation_data, file, indent=2)

    print("URL counts:")
    print(json.dumps(count_data, indent=2))
    print(f"Saved counts to {counts_output}")

    print(f"\nCalculated correlations for {len(correlation_data)} features.")
    print(f"Saved correlations to {correlations_output}")


if __name__ == "__main__":
    generate_graph_data()