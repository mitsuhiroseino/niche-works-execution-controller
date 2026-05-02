import type { ExecutionControllerBaseOptionsBase } from '../ExecutionControllerBase';

export type CapacityControllerOptions = ExecutionControllerBaseOptionsBase & {
  limit?: number;
};
