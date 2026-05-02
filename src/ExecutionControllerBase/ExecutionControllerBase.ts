import type { LooseFunction } from '@niche-works/types';
import type { MethodKeys, MethodType } from '../_types';
import { CANCEL } from '../constants';
import type {
  AwaitedReturn,
  AwaitedReturnFunction,
  ControllerFunction,
  FunctionController,
} from '../types';
import type { CancelPolicy, ExecutionControllerBaseOptions } from './types';

/**
 * コントローラーの基底クラス
 */
export default abstract class ExecutionControllerBase<
  T extends string,
> implements FunctionController<T> {
  /**
   * コントローラー種別
   */
  private _type: T;

  /**
   * ID
   */
  private _id: string;

  /**
   * キャンセル時の動作
   */
  private _cancelPolicy: CancelPolicy;

  /**
   * 実行している関数の件数
   */
  private _running = 0;

  constructor(options: ExecutionControllerBaseOptions<T>) {
    this._type = options.type;
    this._id = options.id;
    this._cancelPolicy = options.cancelPolicy ?? 'resolve';
  }

  /**
   * コントローラー種別
   */
  get type(): T {
    return this._type;
  }

  /**
   * ID
   */
  get id(): string {
    return this._id;
  }

  /**
   * 実行している関数の件数
   */
  get running(): number {
    return this._running;
  }

  /**
   * 実行している関数の有無
   */
  get isRunning(): boolean {
    return this._running > 0;
  }

  /**
   * 実行の開始
   */
  protected _start() {
    this._running++;
  }

  /**
   * 実行の終了
   */
  protected _finish() {
    this._running--;
  }

  /**
   * 対象の関数を非同期で実行する関数を作成する共通処理
   *
   * @param fn 対象の関数
   * @returns
   */
  protected _createExecutionFn<T extends LooseFunction>(fn: T) {
    // 開始終了を捕捉できる非同期の関数
    return async (scope: unknown, args: unknown[]) => {
      try {
        this._start();
        return (await fn.apply(scope, args)) as AwaitedReturn<T>;
      } finally {
        this._finish();
      }
    };
  }

  /**
   * cancelPolicyに従ってPromiseを解決する関数を作成する共通処理
   *
   * `wrap` と `wrapMethod` でcancelPolicyの処理が重複しないよう切り出したもの。
   * scopeがnullの場合は呼び出し時点の`this`をscopeとして使用する。
   *
   * @param wrapedFn ラップ済みの関数
   * @param scope 固定するスコープ。nullの場合は呼び出し時点のthisを使用する
   * @returns
   */
  private _applyPolicy<T extends LooseFunction>(
    wrapedFn: ControllerFunction<T>,
    scope: unknown | null,
  ): AwaitedReturnFunction<T> {
    const cancelPolicy = this._cancelPolicy;

    return function (this: unknown, ...args: Parameters<T>): AwaitedReturn<T> {
      return new Promise((resolve, reject) => {
        wrapedFn(scope ?? this, args)
          .then((result) => {
            if (cancelPolicy === 'resolve') {
              // キャンセルをresolveで受け取る場合
              resolve(result);
            } else if (cancelPolicy === 'reject') {
              // キャンセルをrejectで受け取る場合
              if (result === CANCEL) {
                reject(CANCEL);
              } else {
                resolve(result);
              }
            } else {
              // キャンセル時に何もしない場合
              if (result !== CANCEL) {
                resolve(result);
              }
            }
          })
          .catch(reject);
      });
    };
  }

  /**
   * 関数をラップする
   *
   * @param fn
   * @returns
   */
  wrapFunction<T extends LooseFunction>(
    fn: T | null | undefined,
  ): AwaitedReturnFunction<T> | undefined {
    if (!fn) {
      return undefined;
    }

    // scopeをnullにすることで、呼び出し時点のthisをscopeとして使用する
    return this._applyPolicy(this._wrap(fn), null);
  }

  /**
   * インスタンスのメソッドをラップする
   *
   * `wrap` と異なりscopeをinstanceに固定するため、
   * ユーザーがbindを意識する必要がない。
   *
   * @param instance メソッドを持つインスタンス
   * @param method メソッド名
   * @returns
   */
  wrapMethod<I extends object, K extends MethodKeys<I>>(
    instance: I,
    method: K,
  ): AwaitedReturnFunction<MethodType<I, K>> | undefined {
    const fn = instance[method];
    if (typeof fn !== 'function') {
      return undefined;
    }

    // scopeをinstanceに固定することで、メソッドのthisが失われない
    return this._applyPolicy(
      this._wrap(fn as LooseFunction),
      instance,
    ) as AwaitedReturnFunction<MethodType<I, K>>;
  }

  /**
   * 関数をラップする
   * @param fn
   */
  protected abstract _wrap<T extends LooseFunction>(
    fn: T,
  ): ControllerFunction<T>;
}
