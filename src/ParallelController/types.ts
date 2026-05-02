import type { ExecutionControllerBaseOptionsBase } from '../ExecutionControllerBase';

export type ParallelControllerOptions = ExecutionControllerBaseOptionsBase & {
  limit: number;
};
