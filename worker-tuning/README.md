# Worker Tuning - TypeScript

This is a TypeScript port of the Java Worker Tuning example, demonstrating various worker tuning techniques for different resource contention scenarios.

## Prerequisites

* Node.js 18 or later
* Docker and Docker Compose

## Setup

1. Start Grafana and Prometheus:
```bash
docker compose up -d
```

2. Install dependencies:
```bash
npm install
```

3. Access monitoring:
   - Grafana: http://localhost:3001 (dashboard auto-loaded)
   - Prometheus: http://localhost:9090
   - Worker metrics: http://localhost:8077/metrics

## Example setup

The sample code runs 100 Workflows asynchronously with each scheduling 10 Activities in parallel. Each Activity sleeps for 2 seconds and returns a small payload to simulate a blocking API call. With 1,000 Activities scheduled simultaneously, a typical Worker running on the default settings would struggle to keep up.

## Run example

### Local Temporal Server

1. Start the worker:
```bash
npm run worker -- --activity-pollers=5 --activity-slots=200
```

2. In a separate terminal, start workflows:
```bash
npm start -- --workflows=100 --activities-per-workflow=10
```

### Temporal Cloud

1. Start the worker:
```bash
export TEMPORAL_CLIENT_CERT="<path_to_client_cert>"
export TEMPORAL_CLIENT_KEY="<path_to_client_key>"
export TEMPORAL_ENDPOINT="<cloud_host_and_port>"
export TEMPORAL_NAMESPACE="<temporal_namespace>"

npm run worker -- \
  --client-cert-path="$TEMPORAL_CLIENT_CERT" \
  --client-key-path="$TEMPORAL_CLIENT_KEY" \
  --temporal-endpoint="$TEMPORAL_ENDPOINT" \
  --temporal-namespace="$TEMPORAL_NAMESPACE" \
  --activity-pollers=5 \
  --activity-slots=200
```

2. In a separate terminal, start workflows:
```bash
npm start -- \
  --workflows=100 \
  --activities-per-workflow=10 \
  --client-cert-path="$TEMPORAL_CLIENT_CERT" \
  --client-key-path="$TEMPORAL_CLIENT_KEY" \
  --temporal-endpoint="$TEMPORAL_ENDPOINT" \
  --temporal-namespace="$TEMPORAL_NAMESPACE"
```

## Tuning steps

### Run #1: Baseline (5 pollers, 200 slots)
```bash
npm run worker -- --activity-pollers=5 --activity-slots=200
```

### Run #2: Increase slots (5 pollers, 800 slots)
```bash
npm run worker -- --activity-pollers=5 --activity-slots=800
```

### Run #3: Increase pollers (80 pollers, 800 slots)
```bash
npm run worker -- --activity-pollers=80 --activity-slots=800
```

### Run #4: Optimal settings (80 pollers, 1600 slots)
```bash
npm run worker -- --activity-pollers=80 --activity-slots=1600
```

## Available Options

### Worker Options
- `--activity-pollers`: Number of Activity pollers (default: 5)
- `--activity-slots`: Number of Activity execution slots (default: 200)
- `--task-queue`: Task queue name (default: worker-tuning)
- `--temporal-namespace`: Temporal namespace (default: default)
- `--temporal-endpoint`: Temporal endpoint (default: localhost:7233)
- `--client-key-path`: mTLS client key path
- `--client-cert-path`: mTLS client certificate path

### Starter Options
- `--workflows`: Number of concurrent Workflows (default: 100)
- `--activities-per-workflow`: Number of Activities per Workflow (default: 10)
- `--task-queue`: Task queue name (default: worker-tuning)
- `--temporal-namespace`: Temporal namespace (default: default)
- `--temporal-endpoint`: Temporal endpoint (default: localhost:7233)
- `--client-key-path`: mTLS client key path
- `--client-cert-path`: mTLS client certificate path
- `--failure-ratio`: Ratio for forced Workflow Task failures (0-100, default: 0)

## Metrics

The application exposes Prometheus metrics on port 8077 at `/metrics` endpoint. Use the provided Grafana dashboard to visualize worker performance metrics.

## Cleanup

Stop Grafana and Prometheus:
```bash
docker compose down
```
