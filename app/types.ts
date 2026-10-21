/**
 * ToDo 1件分のデータ。Supabase の todos テーブルの列（id / title / done）に対応する。
 * 作成日時（created_at）は並び順にだけ使うので、画面側の型には含めない。
 */
export type Todo = {
  /** 並び替えや削除があっても変わらない識別子。配列のindexは識別子に使えない */
  id: string;
  /** ToDoの内容 */
  title: string;
  /** 完了したかどうか */
  done: boolean;
};

/**
 * 受け取った値が Todo の形をしているかを実行時に確かめる。
 * 通信で受け取った値は、型どおりとは限らない。
 * そのまま信用せずここで確認する。
 * 戻り値の「value is Todo」は、true なら Todo として扱っていいと TypeScript に伝える書き方。
 */
export function isTodo(value: unknown): value is Todo {
  if (typeof value !== "object" || value === null) return false;

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.done === "boolean"
  );
}
