import type { ExecutionControllerBaseOptionsBase } from '../ExecutionControllerBase';

export type ThrottleControllerOptions = ExecutionControllerBaseOptionsBase & {
  /**
   * 待機時間
   */
  wait?: number;

  /**
   * 直前に実行された関数が実行中の場合、実行完了後に実行するか
   *
   * - false: 完了を待たずに実行
   * - true: 完了を待ってから実行
   */
  sequential?: boolean;
};
