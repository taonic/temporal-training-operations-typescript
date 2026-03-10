# Worker Tuning - TypeScript

This is a TypeScript port of the Java Worker Tuning example, demonstrating various worker tuning techniques for different resource contention scenarios.

## Prerequisites

* Node.js 18 or later
* Install Grafana: https://grafana.com/docs/grafana/latest/setup-grafana/installation/
* Install Prometheus: https://prometheus.io/docs/prometheus/latest/installation/
* Reduce Grafana and Prometheus's default refresh and scrapping intervals to receive instantaneous feedback.
  * Update the Grafana config (grafana.ini > [dashboards]) to include `min_refresh_interval = 200ms`
  * Update Prometheus' config according to this [sample](../workerTuning/config/prometheus.yml)
    * Make sure `scrape_interval` and `evaluation_interval` are both set at 1s
* Import the [sample SDK Metrics dashboard](./dashboard/sdk_metrics.json) to Grafana.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

## Example setup

The sample code runs 100 Workflows asynchronously with each scheduling 10 Activities in parallel. Each Activity sleeps for 2 seconds and returns a small payload to simulate a blocking API call. With 1,000 Activities scheduled simultaneously, a typical Worker running on the default settings would struggle to keep up.

## Run example

### Local Temporal Server
```bash
npm start -- --activity-pollers=5 --activity-slots=200
```

### Temporal Cloud
```bash
export TEMPORAL_CLIENT_CERT="<path_to_client_cert>"
export TEMPORAL_CLIENT_KEY="<path_to_client_key>"
export TEMPORAL_ENDPOINT="<cloud_host_and_port>"
export TEMPORAL_NAMESPACE="<temporal_namespace>"

npm start -- \
  --client-cert-path="$TEMPORAL_CLIENT_CERT" \
  --client-key-path="$TEMPORAL_CLIENT_KEY" \
  --temporal-endpoint="$TEMPORAL_ENDPOINT" \
  --temporal-namespace="$TEMPORAL_NAMESPACE" \
  --activity-pollers=5 \
  --activity-slots=200
```

## Tuning steps

### Run #1: Baseline (5 pollers, 200 slots)
```bash
npm start -- --activity-pollers=5 --activity-slots=200
```

### Run #2: Increase slots (5 pollers, 800 slots)
```bash
npm start -- --activity-pollers=5 --activity-slots=800
```

### Run #3: Increase pollers (80 pollers, 800 slots)
```bash
npm start -- --activity-pollers=80 --activity-slots=800
```

### Run #4: Optimal settings (80 pollers, 1600 slots)
```bash
npm start -- --activity-pollers=80 --activity-slots=1600
```

## Available Options

- `--activity-pollers`: Number of Activity pollers (default: 5)
- `--activity-slots`: Number of Activity execution slots (default: 200)
- `--workflows`: Number of concurrent Workflows (default: 100)
- `--activities-per-workflow`: Number of Activities per Workflow (default: 10)
- `--temporal-namespace`: Temporal namespace to connect to
- `--temporal-endpoint`: Temporal endpoint to connect to
- `--client-key-path`: mTLS client key path
- `--client-cert-path`: mTLS client certificate path
- `--failure-ratio`: Ratio for forced Workflow Task failures (0-100, default: 0)

## Metrics

The application exposes Prometheus metrics on port 8077 at `/metrics` endpoint. Use the provided Grafana dashboard to visualize worker performance metrics.