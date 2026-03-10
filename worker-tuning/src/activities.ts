import { log } from '@temporalio/activity';

export interface SlowActivities {
  slowActivity(seconds: number): Promise<Uint8Array>;
  cpuIntensiveActivity(): Promise<Uint8Array>;
  largeActivity(): Promise<Uint8Array>;
}

function fibRecursion(count: number): number {
  if (count === 0) {
    return 0;
  } else if (count === 1 || count === 2) {
    return 1;
  } else {
    return fibRecursion(count - 1) + fibRecursion(count - 2);
  }
}

export async function slowActivity(seconds: number): Promise<Uint8Array> {
  const start = Date.now();
  await new Promise(resolve => setTimeout(resolve, seconds * 1000));
  log.debug(`Time elapsed: ${Date.now() - start}ms`);
  return new Uint8Array(1);
}

export async function cpuIntensiveActivity(): Promise<Uint8Array> {
  const start = Date.now();
  fibRecursion(42); // Adjusted for TypeScript performance
  log.debug(`Time elapsed: ${Date.now() - start}ms`);
  return new Uint8Array(1);
}

export async function largeActivity(): Promise<Uint8Array> {
  await new Promise(resolve => setTimeout(resolve, 200));
  return new Uint8Array(10 * 1024); // 10KiB
}