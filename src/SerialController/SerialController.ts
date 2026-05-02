import type { LooseFunction } from '@niche-works/types';
import FunctionControllerBase from '../ExecutionControllerBase';
import type { AwaitedReturn, ControllerFunction } from '../types';
import { SerialControllerType } from './constants';
import type { SerialControllerOptions } from './types';

const noop = () => {};

/**
 * 直列実行コントローラー
 * 関数を一度に一つずつ順番に実行する\
 * 実行中に関数が呼ばれた場合、それらはキュー（待ち行列）に追加され、\
 * 現在の処理が完了し次第、古い順から順次実行される
 */
export default class SerialController extends FunctionControllerBase<SerialControllerType> {
  /**
   * 最後に実行した関数のpromise
   */
  private _tail: Promise<void> = Promise.resolve();

  constructor(options: SerialControllerOptions) {
    super(options);
  }

  _wrap<T extends LooseFunction>(fn: T): ControllerFunction<T> {
    const me = this;
    const execute = me._createExecutionFn(fn);
    return (scope: unknown, args: Parameters<T>): AwaitedReturn<T> => {
      // fnを非同期で呼び出す関数
      // 前の処理がどう終わろうと、クリーンな状態で execute を開始する
      const promise = me._tail.finally(noop).then(() => execute(scope, args));
      // エラーでも次が続けられるようにnoopを仕込んでおく
      me._tail = promise.then(noop).catch(noop);

      return promise;
    };
  }
}
