import { Worker, NativeConnection } from '@temporalio/worker';
import * as activities from './activities';
import { setupMetrics } from './metrics';
import { Command } from 'commander';
import { readFileSync } from 'fs';

async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('worker')
    .description('Runs Temporal Worker')
    .option('--activity-pollers <number>', 'The number of Activity pollers', '5')
    .option('--activity-slots <number>', 'The number of Activity execution slots', '200')
    .option('--task-queue <string>', 'The task queue name', 'worker-tuning')
    .option('--temporal-namespace <string>', 'The Temporal namespace to connect to', 'default')
    .option('--temporal-endpoint <string>', 'The Temporal endpoint to connect to', 'localhost:7233')
    .option('--client-key-path <string>', 'The mTLS client key for authenticating to the namespace')
    .option('--client-cert-path <string>', 'The mTLS client certificate for authenticating to the namespace');

  program.parse();
  const opts = program.opts();

  setupMetrics(8077);

  let connection: NativeConnection;
  if (opts.clientCertPath && opts.clientKeyPath) {
    const cert = readFileSync(opts.clientCertPath);
    const key = readFileSync(opts.clientKeyPath);
    
    connection = await NativeConnection.connect({
      address: opts.temporalEndpoint,
      tls: {
        clientCertPair: { crt: cert, key: key }
      }
    });
  } else {
    connection = await NativeConnection.connect({
      address: opts.temporalEndpoint
    });
  }

  const worker = await Worker.create({
    connection,
    namespace: opts.temporalNamespace,
    taskQueue: opts.taskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities,
    maxConcurrentActivityTaskExecutions: parseInt(opts.activitySlots),
    maxConcurrentActivityTaskPolls: parseInt(opts.activityPollers)
  });

  console.log(`Worker started: pollers=${opts.activityPollers}, slots=${opts.activitySlots}, taskQueue=${opts.taskQueue}`);
  
  await worker.run();
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
