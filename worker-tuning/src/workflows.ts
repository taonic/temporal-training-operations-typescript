import { proxyActivities } from '@temporalio/workflow';
import type { SlowActivities } from './activities';

const activities = proxyActivities<SlowActivities>({
  startToCloseTimeout: '30s',
});

export async function workerTuningWorkflow(concurrency: number, failureRatio: number = 0): Promise<void> {
  const randomness = Math.random() * 100;
  if (randomness > 100 - failureRatio) {
    throw new Error('Simulate failed Workflow Tasks');
  }

  const promises: Promise<Uint8Array>[] = [];
  for (let i = 0; i < concurrency; i++) {
    promises.push(activities.slowActivity(2.0));
  }
  
  await Promise.all(promises);
}