import { CapacityControllerType } from './CapacityController/constants';
import { DebounceControllerType } from './DebounceController/constants';
import { ExclusiveControllerType } from './ExclusiveController/constants';
import { ParallelControllerType } from './ParallelController/constants';
import { SerialControllerType } from './SerialController/constants';
import { ThrottleControllerType } from './ThrottleController/constants';

export const ControllerType = {
  [CapacityControllerType]: CapacityControllerType,
  [DebounceControllerType]: DebounceControllerType,
  [ExclusiveControllerType]: ExclusiveControllerType,
  [ParallelControllerType]: ParallelControllerType,
  [SerialControllerType]: SerialControllerType,
  [ThrottleControllerType]: ThrottleControllerType,
} as const;

export type ControllerType =
  (typeof ControllerType)[keyof typeof ControllerType];

/**
 * キャンセル時に返す戻り値
 */
export const CANCEL = Symbol('cancel');
