export type ExecutionControllerBaseOptions<T extends string> = {
  /**
   * グループ種別
   */
  type?: T;

  /**
   * グループID
   */
  id?: string;

  /**
   * 関数の実行がキャンセルされた場合の動作
   *
   * - 'resolve': 正常処理の戻り値にCANCELを返す
   * - 'reject': 例外処理の戻り値にCANCELを返す
   * - 'ignore': 何もしない
   *
   * @default 'resolve'
   */
  cancelPolicy?: CancelPolicy;
};

export type CancelPolicy = 'resolve' | 'reject' | 'ignore';
