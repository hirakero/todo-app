/**
 * ToDo 1件分のデータ。
 * localStorage への保存を見据えて、JSON にできる型だけで構成している
 * （Date を入れると JSON.parse 後に文字列になり、型と食い違うため使わない）。
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
 * localStorage の中身は誰でも書き換えられ、古い形のデータが残っていることもあるため、
 * 読み込んだ値をそのまま信用せずここで確認する。
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
