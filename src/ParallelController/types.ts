import type { ExecutionControllerBaseOptionsBase } from '../ExecutionControllerBase';

export type ParallelControllerOptions = ExecutionControllerBaseOptionsBase & {
  /**
   * 同時実行の上限数
   * @default 4
   */
  limit?: number;
};
