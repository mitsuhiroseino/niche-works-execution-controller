import type { SyncLooseFunction } from '@niche-works/types';
import type { MethodKeys, MethodType } from '../_types';
import { CANCEL } from '../constants';
import type {
  AwaitedReturn,
  ControllerFunction,
  FunctionController,
} from '../types';
import type { CancelPolicy, ExecutionControllerBaseOptions } from './types';

/**
 * ポリシーに応じた戻り値の型を判定する
 */
type PolicyAwareReturn<
  F extends SyncLooseFunction,
  P extends CancelPolicy,
> = P extends 'resolve' ? ReturnType<F> | typeof CANCEL : ReturnType<F>;

/**
 * ポリシーに応じた関数型を判定する
 */
type PolicyAwareFunction<
  F extends SyncLooseFunction,
  P extends CancelPolicy,
> = (...args: Parameters<F>) => Promise<PolicyAwareReturn<F, P>>;

/**
 * コントローラーの基底クラス
 */
export default abstract class ExecutionControllerBase<
  T extends string,
  P extends CancelPolicy = 'ignore',
> implements FunctionController<T> {
  /**
   * コントローラー種別
   */
  protected _type: T;

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
  private _executing = 0;

  constructor(options: ExecutionControllerBaseOptions<T, P>) {
    this._type = options.type;
    this._id = options.id;
    this._cancelPolicy = options.cancelPolicy ?? 'ignore';
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
   * 実行している関数・メソッドの件数
   */
  get executing(): number {
    return this._executing;
  }

  /**
   * 実行している関数・メソッドの有無
   */
  get isExecuting(): boolean {
    return this._executing > 0;
  }

  /**
   * 実行の開始
   */
  protected _start() {
    this._executing++;
  }

  /**
   * 実行の終了
   */
  protected _finish() {
    this._executing--;
  }

  /**
   * 対象の関数を非同期で実行する関数を作成する共通処理
   *
   * @param fn 対象の関数
   * @returns
   */
  protected _createExecutionFn<T extends SyncLooseFunction>(fn: T) {
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
  private _applyPolicy<T extends SyncLooseFunction>(
    wrapedFn: ControllerFunction<T>,
    scope?: unknown | null,
  ): PolicyAwareFunction<T, P> {
    const cancelPolicy = this._cancelPolicy;

    return async function (
      this: unknown,
      ...args: Parameters<T>
    ): Promise<any> {
      const result = await wrapedFn(scope !== undefined ? scope : this, args);

      if (result === CANCEL) {
        if (cancelPolicy === 'reject') {
          throw CANCEL;
        }
        if (cancelPolicy === 'resolve') {
          // resolveの場合はそのままCANCELを返す
          return CANCEL;
        }
        // 解決しないPromiseを返して呼び出し側を待機状態にする
        return new Promise(() => {});
      } else {
        return result;
      }
    };
  }

  /**
   * 関数をラップする
   *
   * @param fn
   * @returns
   */
  wrap<T extends SyncLooseFunction>(
    fn: T | null | undefined,
  ): PolicyAwareFunction<T, P> | undefined {
    if (!fn) {
      return undefined;
    }

    return this._applyPolicy(this._wrap(fn));
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
  ): PolicyAwareFunction<MethodType<I, K>, P> | undefined {
    const fn = instance[method];
    if (typeof fn !== 'function') {
      return undefined;
    }

    // scopeをinstanceに固定することで、メソッドのthisが失われない
    return this._applyPolicy(
      this._wrap(fn as SyncLooseFunction),
      instance,
    ) as PolicyAwareFunction<MethodType<I, K>, P>;
  }

  /**
   * 関数をラップする
   * @param fn
   */
  protected abstract _wrap<T extends SyncLooseFunction>(
    fn: T,
  ): ControllerFunction<T>;
}
