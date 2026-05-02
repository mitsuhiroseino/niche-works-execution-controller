import type { ExecutionControllerBaseOptions } from '../ExecutionControllerBase';
import { CapacityControllerType } from './constants';

export type CapacityControllerOptions =
  ExecutionControllerBaseOptions<CapacityControllerType> & {
    limit?: number;
  };
