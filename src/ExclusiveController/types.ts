import type { ExecutionControllerBaseOptions } from '../ExecutionControllerBase';
import { ExclusiveControllerType } from './constants';

export type ExclusiveControllerOptions =
  ExecutionControllerBaseOptions<ExclusiveControllerType> & {};
