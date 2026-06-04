import type { SyncLooseFunction } from '@niche-works/types';
import type { MethodKeys, MethodType } from './_types';
import { CANCEL } from './constants';

/**
 * 戻り値(promise)
 */
export type AwaitedReturn<T extends SyncLooseFunction> =
  | Promise<ReturnType<T>>
  | Promise<typeof CANCEL>;

/**
 * 汎用的な関数をラップしてpromiseの戻り値を返す関数
 */
export type AwaitedReturnFunction<T extends SyncLooseFunction> = (
  ...args: Parameters<T>
) => AwaitedReturn<T>;

/**
 * コントローラーの関数
 */
export type ControllerFunction<T extends SyncLooseFunction> = (
  scope: unknown,
  args: Parameters<T>,
) => AwaitedReturn<T>;

/**
 * 関数グループ
 */
export interface FunctionController<T extends string> {
  /**
   * グループ種別
   */
  get type(): T;

  /**
   * ID
   */
  get id(): string;

  /**
   * 実行中か
   */
  get isExecuting(): boolean;

  /**
   * 関数をラップする
   * @param fn
   */
  wrap<T extends SyncLooseFunction>(
    fn: T | null | undefined,
  ): AwaitedReturnFunction<T> | null | undefined;

  /**
   * メソッドをラップする
   * @param instance
   * @param method
   */
  wrapMethod<I extends object, K extends MethodKeys<I>>(
    instance: I,
    method: K,
  ): AwaitedReturnFunction<MethodType<I, K>> | undefined;
}
