import type { LooseFunction } from '@niche-works/types';
import { CANCEL } from '../constants';
import ExecutionControllerBase from '../ExecutionControllerBase';
import type { AwaitedReturn, ControllerFunction } from '../types';
import { ExclusiveControllerType } from './constants';
import type { ExclusiveControllerOptions } from './types';

/**
 * 排他実行コントローラー\
 * 同時に一つの関数のみ実行を許可する\
 * すでに実行中の関数がある場合、新しく呼び出された関数は実行されず破棄される
 */
export default class ExclusiveController extends ExecutionControllerBase<ExclusiveControllerType> {
  constructor(options: ExclusiveControllerOptions) {
    // @ts-ignore
    super({ ...options, type: ExclusiveControllerType });
  }

  _wrap<T extends LooseFunction>(fn: T): ControllerFunction<T> {
    const me = this;
    const execute = me._createExecutionFn(fn);
    return (scope: unknown, args: Parameters<T>): AwaitedReturn<T> => {
      // 実行しているものがあるかチェック
      if (me.isRunning) {
        // あったらキャンセル
        return Promise.resolve(CANCEL);
      }

      // fnを非同期で呼び出す
      return execute(scope, args) as AwaitedReturn<T>;
    };
  }
}
