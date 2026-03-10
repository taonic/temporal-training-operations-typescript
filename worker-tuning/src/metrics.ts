import { createServer, IncomingMessage, ServerResponse } from 'http';
import { register, collectDefaultMetrics } from 'prom-client';

export function startPrometheusScrapeEndpoint(port: number = 8077): void {
  // Collect default metrics
  collectDefaultMetrics();

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      register.metrics().then(metrics => {
        res.end(metrics);
      }).catch(err => {
        res.statusCode = 500;
        res.end(err.message);
      });
    } else {
      res.statusCode = 404;
      res.end('Not Found');
    }
  });

  server.listen(port, () => {
    console.log(`Prometheus metrics server listening on port ${port}`);
  });
}