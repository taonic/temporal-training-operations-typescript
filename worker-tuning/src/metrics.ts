import { Runtime, DefaultLogger } from '@temporalio/worker';

export function setupMetrics(port: number = 8077): void {
  Runtime.install({
    logger: new DefaultLogger('INFO'),
    telemetryOptions: {
      metrics: {
        prometheus: { bindAddress: `0.0.0.0:${port}` }
      }
    }
  });
  
  console.log(`Prometheus metrics server listening on port ${port}`);
}
