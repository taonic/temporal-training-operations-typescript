import { Client, Connection } from '@temporalio/client';
import { workerTuningWorkflow } from './workflows';
import { Command } from 'commander';
import { readFileSync } from 'fs';

const WORKFLOW_ID = 'WorkerTuningWorkflow';

async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name('starter')
    .description('Starts Temporal Workflows')
    .option('--workflows <number>', 'The number of concurrent Workflows', '100')
    .option('--activities-per-workflow <number>', 'The number of Activities per Workflow', '10')
    .option('--task-queue <string>', 'The task queue name', 'worker-tuning')
    .option('--temporal-namespace <string>', 'The Temporal namespace to connect to', 'default')
    .option('--temporal-endpoint <string>', 'The Temporal endpoint to connect to', 'localhost:7233')
    .option('--client-key-path <string>', 'The mTLS client key for authenticating to the namespace')
    .option('--client-cert-path <string>', 'The mTLS client certificate for authenticating to the namespace')
    .option('--failure-ratio <number>', 'The ratio for forced Workflow Task failures. Value between 0 - 100', '0');

  program.parse();
  const opts = program.opts();

  let connection: Connection;
  if (opts.clientCertPath && opts.clientKeyPath) {
    const cert = readFileSync(opts.clientCertPath);
    const key = readFileSync(opts.clientKeyPath);
    
    connection = await Connection.connect({
      address: opts.temporalEndpoint,
      tls: {
        clientCertPair: { crt: cert, key: key }
      }
    });
  } else {
    connection = await Connection.connect({
      address: opts.temporalEndpoint
    });
  }

  const client = new Client({
    connection,
    namespace: opts.temporalNamespace
  });

  const workflows = parseInt(opts.workflows);
  const activitiesPerWorkflow = parseInt(opts.activitiesPerWorkflow);
  const failureRatio = parseInt(opts.failureRatio);

  console.log(`Starting ${workflows} workflows with ${activitiesPerWorkflow} activities each`);
  
  const handles = [];
  for (let i = 0; i < workflows; i++) {
    const handle = await client.workflow.start(workerTuningWorkflow, {
      args: [activitiesPerWorkflow, failureRatio],
      taskQueue: opts.taskQueue,
      workflowId: `${WORKFLOW_ID}-${Date.now()}-${i}`,
    });
    handles.push(handle);
  }

  const start = Date.now();
  await Promise.all(handles.map(handle => handle.result()));
  const duration = Date.now() - start;
  
  console.log(`All workflows completed in ${duration}ms`);
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}