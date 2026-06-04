import type { SyncLooseFunction } from '@niche-works/types';

/**
 * オブジェクトのメソッドのキーのみを抽出する
 */
export type MethodKeys<T extends object> = {
  [K in keyof T]: T[K] extends SyncLooseFunction ? K : never;
}[keyof T];

/**
 * メソッドの型を取得する
 */
export type MethodType<
  T extends object,
  K extends keyof T,
> = T[K] extends SyncLooseFunction ? T[K] : never;
