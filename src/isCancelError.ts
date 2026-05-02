import { CANCEL } from './constants';

/**
 * 渡された値がキャンセル時の値であることをチェックする
 * @param error
 * @returns
 */
export default function isCancelError(
  error: unknown | typeof CANCEL,
): error is typeof CANCEL {
  return error === CANCEL;
}
