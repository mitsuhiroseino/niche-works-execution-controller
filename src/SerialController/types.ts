import type { ExecutionControllerBaseOptions } from '../ExecutionControllerBase';
import { SerialControllerType } from './constants';

export type SerialControllerOptions =
  ExecutionControllerBaseOptions<SerialControllerType> & {};
