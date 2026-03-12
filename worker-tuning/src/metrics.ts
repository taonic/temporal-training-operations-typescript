import { Runtime, DefaultLogger } from '@temporalio/worker';

export function setupMetrics(port: number = 8077): void {
  // TODO: Uncomment to enable Prometheus metrics
  // Runtime.install({
  //   telemetryOptions: {
  //     metrics: {
  //       prometheus: { bindAddress: `0.0.0.0:${port}` },
  //     },
  //   }
  // });
}
