import { Worker, NativeConnection } from '@temporalio/worker';
import { Client } from '@temporalio/client';
import { WorkflowHandle } from '@temporalio/client';
import { workerTuningWorkflow } from './workflows';
import * as activities from './activities';
import { CryptCodec } from './codec';
import { startPrometheusScrapeEndpoint } from './metrics';
import { Command } from 'commander';
import { readFileSync } from 'fs';

const WORKFLOW_ID = 'WorkerTuningWorkflow';

interface Options {
  activityPollers: number;
  activitySlots: number;
  workflows: number;
  activitiesPerWorkflow: number;
  temporalNamespace?: string;
  temporalEndpoint?: string;
  clientKeyPath?: string;
  clientCertPath?: string;
  failureRatio: number;
}

async function runWorker(options: Options): Promise<void> {
  // Start Prometheus metrics endpoint
  startPrometheusScrapeEndpoint(8077);

  const taskQueue = `worker-tuning-${Date.now()}`;

  // Setup connection options
  let connection: NativeConnection;
  if (options.temporalEndpoint && options.clientCertPath && options.clientKeyPath) {
    const cert = readFileSync(options.clientCertPath);
    const key = readFileSync(options.clientKeyPath);
    
    connection = await NativeConnection.connect({
      address: options.temporalEndpoint,
      tls: {
        clientCertPair: { crt: cert, key: key }
      }
    });
  } else {
    connection = await NativeConnection.connect({
      address: 'localhost:7233'
    });
  }

  // Create client
  const client = new Client({
    connection,
    namespace: options.temporalNamespace || 'default',
    dataConverter: {
      payloadCodecs: [new CryptCodec()]
    }
  });

  // Create worker
  const worker = await Worker.create({
    connection,
    namespace: options.temporalNamespace || 'default',
    taskQueue,
    workflowsPath: require.resolve('./workflows'),
    activities,
    maxConcurrentActivityTaskExecutions: options.activitySlots,
    maxConcurrentActivityTaskPolls: options.activityPollers,
    dataConverter: {
      payloadCodecs: [new CryptCodec()]
    }
  });

  console.log(`Starting worker with ${options.activityPollers} pollers and ${options.activitySlots} slots`);
  
  // Start worker
  const workerPromise = worker.run();

  // Start workflows
  const workflowPromises: Promise<WorkflowHandle>[] = [];
  for (let i = 0; i < options.workflows; i++) {
    const handle = client.workflow.start(workerTuningWorkflow, {
      args: [options.activitiesPerWorkflow, options.failureRatio],
      taskQueue,
      workflowId: `${WORKFLOW_ID}-${i}`,
    });
    workflowPromises.push(handle);
  }

  console.log(`Starting ${options.workflows} workflows with ${options.activitiesPerWorkflow} activities each`);
  
  const handles = await Promise.all(workflowPromises);
  
  // Wait for all workflows to complete
  const start = Date.now();
  await Promise.all(handles.map(handle => handle.result()));
  const duration = Date.now() - start;
  
  console.log(`All workflows completed in ${duration}ms`);
  
  // Shutdown worker
  worker.shutdown();
  await workerPromise;
}

async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('worker-tuning-example')
    .description('Runs Temporal Worker tuning example')
    .option('--activity-pollers <number>', 'The number of Activity pollers', '5')
    .option('--activity-slots <number>', 'The number of Activity execution slots', '200')
    .option('--workflows <number>', 'The number of concurrent Workflows', '100')
    .option('--activities-per-workflow <number>', 'The number of Activities per Workflow', '10')
    .option('--temporal-namespace <string>', 'The Temporal namespace to connect to')
    .option('--temporal-endpoint <string>', 'The Temporal endpoint to connect to')
    .option('--client-key-path <string>', 'The mTLS client key for authenticating to the namespace')
    .option('--client-cert-path <string>', 'The mTLS client certificate for authenticating to the namespace')
    .option('--failure-ratio <number>', 'The ratio for forced Workflow Task failures. Value between 0 - 100', '0');

  program.parse();
  const opts = program.opts();

  const options: Options = {
    activityPollers: parseInt(opts.activityPollers),
    activitySlots: parseInt(opts.activitySlots),
    workflows: parseInt(opts.workflows),
    activitiesPerWorkflow: parseInt(opts.activitiesPerWorkflow),
    temporalNamespace: opts.temporalNamespace,
    temporalEndpoint: opts.temporalEndpoint,
    clientKeyPath: opts.clientKeyPath,
    clientCertPath: opts.clientCertPath,
    failureRatio: parseInt(opts.failureRatio)
  };

  await runWorker(options);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}