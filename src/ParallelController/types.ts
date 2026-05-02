import type { ExecutionControllerBaseOptions } from '../ExecutionControllerBase';
import { ParallelControllerType } from './constants';

export type ParallelControllerOptions =
  ExecutionControllerBaseOptions<ParallelControllerType> & {
    limit: number;
  };
