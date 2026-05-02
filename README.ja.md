# @niche-works/execution-control

`@niche-works/execution-control` は関数の実行タイミングや同時実行数を高度に制御するためのニッチなライブラリです。\
Debounce, Throttle, Serial, Parallel, Exclusive など、\
実際の開発現場で頻出する実行制御パターンを統一されたインターフェースで提供します。

**[English README is available here](./README.md)**

## 特徴

- 統一された API: 全てのコントローラーが wrap および wrapMethod を持ち、既存の関数を簡単に拡張できます。
- 柔軟なキャンセルポリシー: 実行制限時の挙動を ignore (解決しない), reject (例外), resolve (CANCEL値を返す) から選択可能。
- TypeScript ネイティブ: 完全な型定義により、ラップされた関数の引数や戻り値の型が維持されます。
- ステートフル: 現在の実行数（running）や実行中かどうかのフラグ（isRunning）をリアルタイムに確認できます。

## インストール

```sh
npm install @niche-works/execution-control
```

## コントローラー一覧

| コントローラー      | 概要                               | 主なユースケース                     |
| ------------------- | ---------------------------------- | ------------------------------------ |
| CapacityController  | 上限数を超えた呼び出しを破棄       | 同時リクエスト数の制限、負荷軽減     |
| ExclusiveController | 実行中は他の呼び出しを全て破棄     | 二重送信防止、モーダル表示制御       |
| SerialController    | 一度につき一つずつ順番に実行       | 順序が重要な保存処理、アニメーション |
| ParallelController  | 指定した上限数でキューイング実行   | 大量ファイルの並列アップロード制限   |
| DebounceController  | 最後の呼び出しから一定時間後に実行 | 入力補完、リサイズイベントの最適化   |
| ThrottleController  | 一度実行したら一定期間は実行を禁止 | スクロール監視、連打防止             |

## 使い方

### 基本的な関数のラップ

```typescript
import { CapacityController } from '@niche-works/execution-control';

const controller = new CapacityController({
  type: 'capacity',
  id: 'api-limit',
  limit: 2,
  cancelPolicy: 'resolve',
});

const fetchData = controller.wrap(async (id: number) => {
  return await api.get(`/item/${id}`);
});

// 実行
const result1 = await fetchData(1); // 実行される
const result2 = await fetchData(2); // 実行される
const result3 = await fetchData(3); // 実行枠がいっぱいなので CANCEL が返る
```

### インスタンスメソッドのラップ

クラスのメソッドに対して this のコンテキストを維持したままラップできます。

```typescript
import { DebounceController } from '@niche-works/execution-control';

class SearchComponent {
  private controller = new DebounceController({
    type: 'debounce',
    id: 'search',
    wait: 300,
  });

  constructor() {
    // 自身のメソッドをラップして再定義
    this.handleInput = this.controller.wrapMethod(this, 'handleInput')!;
  }

  async handleInput(query: string) {
    console.log(`Searching for: ${query}`);
  }
}
```

## API

### 全コントローラー共通

#### コンストラクターオプション

| プロパティ     | 型       | 説明                                                                                        |
| -------------- | -------- | ------------------------------------------------------------------------------------------- |
| `type?`        | `string` | グループ種別                                                                                |
| `id?`          | `string` | `styleProp` に既存のスタイルがある場合の適用方法（デフォルト: `merge`）                     |
| `displayName?` | `string` | 作成するコンポーネントの`displayName`（デフォルト: `withLayout(${Component.displayName})`） |

CancelPolicy

コントローラーが実行を制限した際の挙動を指定できます。

ignore (デフォルト): 返される Promise は Pending 状態のままになり、解決も拒否もされません。

reject: CANCEL 定数（Symbol等）を理由に Promise をリジェクトします。

resolve: CANCEL 定数を戻り値として Promise を解決します。

Sequential オプション (Debounce / Throttle)

sequential: true を指定すると、待機時間が経過した後、「前回の関数の実行完了」を待ってから次を開始します。非同期処理の重なりを厳密に排除したい場合に有効です。

ライセンス

MIT
