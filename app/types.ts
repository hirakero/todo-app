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
