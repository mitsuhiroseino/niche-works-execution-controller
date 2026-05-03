import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CANCEL } from '../constants';
import DebounceController from '../DebounceController';

describe('DebounceController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('デフォルト', async () => {
    const controller = new DebounceController({
      id: 'test',
    });

    const fn = vi.fn().mockResolvedValue('ok');
    const wrapped = controller.wrap(fn);

    const promise = wrapped!();

    // 50ms経過（まだ実行されない）
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    // さらに200ms経過（合計250ms）
    vi.advanceTimersByTime(200);
    // 非同期処理を確実に回す
    await vi.runAllTicks();
    await vi.runAllTicks();

    const result = await promise;
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('ok');
  });

  it('指定した待ち時間（wait）後に実行されること', async () => {
    const controller = new DebounceController({
      id: 'test',
      wait: 100,
      cancelPolicy: 'resolve',
    });

    const fn = vi.fn().mockResolvedValue('ok');
    const wrapped = controller.wrap(fn);

    const promise = wrapped!();

    // 50ms経過（まだ実行されない）
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();

    // さらに50ms経過（合計100ms）
    vi.advanceTimersByTime(50);
    // 非同期処理を確実に回す
    await vi.runAllTicks();
    await vi.runAllTicks();

    const result = await promise;
    expect(fn).toHaveBeenCalledTimes(1);
    expect(result).toBe('ok');
  });

  it('連続して呼び出した場合、最後の呼び出しのみが実行されること', async () => {
    const controller = new DebounceController({
      id: 'test',
      wait: 100,
      cancelPolicy: 'resolve',
    });

    const fn = vi.fn((n: number) => Promise.resolve(n));
    const wrapped = controller.wrap(fn);

    const p1 = wrapped!(1);
    vi.advanceTimersByTime(50);
    const p2 = wrapped!(2);
    vi.advanceTimersByTime(50);
    const p3 = wrapped!(3);

    // p1, p2 はキャンセルされるはず
    vi.advanceTimersByTime(100);
    await vi.runAllTicks();
    await vi.runAllTicks();

    expect(await p1).toBe(CANCEL);
    expect(await p2).toBe(CANCEL);
    expect(await p3).toBe(3);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  describe('sequential オプション', () => {
    it('sequential: false (デフォルト) の場合、前回の完了を待たずに実行されること', async () => {
      const controller = new DebounceController({
        id: 'test',
        wait: 10,
        sequential: false,
      });

      let executingCount = 0;
      const fn = async () => {
        executingCount++;
        // 実行中の待機
        await new Promise((res) => setTimeout(res, 50));
        executingCount--;
      };

      const wrapped = controller.wrap(fn);

      // 1回目の実行
      wrapped!();
      vi.advanceTimersByTime(10);
      await vi.runAllTicks();
      await vi.runAllTicks();
      expect(executingCount).toBe(1);

      // 2回目の実行を仕込む
      vi.advanceTimersByTime(20);
      wrapped!();
      vi.advanceTimersByTime(10);
      await vi.runAllTicks();
      await vi.runAllTicks();

      // 同時に2つ動いている
      expect(executingCount).toBe(2);

      vi.advanceTimersByTime(50);
      await vi.runAllTicks();
      await vi.runAllTicks();
    });

    it('sequential: true の場合、前回の完了を待ってから次が実行されること', async () => {
      const controller = new DebounceController({
        id: 'test',
        wait: 10,
        sequential: true,
      });

      let executingCount = 0;
      const fn = async () => {
        executingCount++;
        // fn自体の実行時間(50ms)
        await new Promise((res) => {
          setTimeout(res, 50);
        });
        executingCount--;
      };

      const wrapped = controller.wrap(fn);

      // 1回目：デバウンス10ms + 実行50ms
      wrapped!();
      vi.advanceTimersByTime(10);
      await vi.runAllTicks();
      await vi.runAllTicks();
      expect(executingCount).toBe(1);

      // 1回目が実行中(現在時刻10ms)に、2回目を仕込む
      vi.advanceTimersByTime(20); // 時刻30ms
      wrapped!();
      vi.advanceTimersByTime(10); // 時刻40ms (2回目のデバウンス終了)
      await vi.runAllTicks();
      await vi.runAllTicks();

      // sequential: true なので、1回目が終わるまで2回目は開始されない
      expect(executingCount).toBe(1);

      // 1回目が終わる時間（10ms + 50ms = 60ms）まで進める
      vi.advanceTimersByTime(20); // 時刻60ms

      // ここで1回目の終了と2回目の開始を促すためにマイクロタスクを複数回回す
      await vi.runAllTicks(); // 1回目のPromise解決
      await vi.runAllTicks(); // 2回目のPromiseチェーンの開始
      await vi.runAllTicks(); // executeの内部処理

      // 1回目が終わり、2回目が始まっているはず
      expect(executingCount).toBe(1);

      // 全て完了（2回目の50msが終わるまで）
      vi.advanceTimersByTime(50);
      await vi.runAllTicks();
      await vi.runAllTicks();
      expect(executingCount).toBe(0);
    });
  });
});
