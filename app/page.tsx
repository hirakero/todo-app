"use client"; // 入力やクリックの状態を扱うので、クライアントコンポーネントにする

import { useState } from "react";
import type { Todo } from "./types";

export default function Home() {
  // 入力欄の文字列
  const [title, setTitle] = useState("");
  // 追加済みのToDo一覧
  const [todos, setTodos] = useState<Todo[]>([]);

  // 「追加」したときの処理
  function handleAdd() {
    // 前後の空白を除いて、空のままなら何もしない
    const trimmed = title.trim();
    if (trimmed === "") return;

    // ブラウザ標準のUUID生成。削除や編集で「どれを」操作するかの目印になる
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: trimmed,
      done: false,
    };

    // 既存の配列は変更せず、末尾に足した新しい配列を作って渡す
    setTodos([...todos, newTodo]);
    // 入力欄を空に戻す
    setTitle("");
  }

  // チェックの ON / OFF を切り替える
  function handleToggle(id: string) {
    // map で新しい配列を作り、対象のものだけ done を反転させたコピーに差し替える
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, done: !todo.done } : todo,
      ),
    );
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-16 sm:py-24">
      {/* max-w-md で横幅を制限し、スマホでも横スクロールが出ないようにする */}
      <main className="w-full max-w-md">
        <h1 className="text-center text-4xl font-bold tracking-tight text-emerald-900">
          ToDo リスト
        </h1>
        <p className="mt-3 text-center text-sm text-gray-500">
          今日やることを書き出しましょう
        </p>

        {/* 入力エリアも白いカードにして、下の一覧と見た目を揃える */}
        {/* form にすると Enter キーでも追加できる */}
        <form
          onSubmit={(event) => {
            event.preventDefault(); // ページのリロードを防ぐ
            handleAdd();
          }}
          className="mt-10 flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm sm:flex-row"
        >
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="やることを入力"
            // min-w-0 がないと長い入力のときに flex アイテムが縮まず、横スクロールの原因になる
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            追加
          </button>
        </form>

        {/* まだ1件もないときは案内文、あるときはカードを並べる */}
        {todos.length === 0 ? (
          <p className="mt-10 text-center text-sm text-gray-400">
            まだ ToDo がありません
          </p>
        ) : (
          <ul className="mt-10 flex flex-col gap-3">
            {todos.map((todo) => (
              // key には id を使う。index だと削除や並べ替えで中身とズレる
              <li key={todo.id} className="rounded-lg bg-white shadow-sm">
                {/* label で囲むと、チェックボックスだけでなく文字をタップしても切り替わる */}
                <label className="flex cursor-pointer items-start gap-3 p-5">
                  <input
                    type="checkbox"
                    checked={todo.done}
                    onChange={() => handleToggle(todo.id)}
                    // accent-* でチェック時の色をブラウザ標準の青から緑に変える
                    className="mt-0.5 size-5 shrink-0 accent-emerald-600"
                  />
                  {/* min-w-0 + break-words で長い文字列もカード内で折り返す */}
                  <span
                    className={`min-w-0 break-words ${
                      todo.done ? "text-gray-400 line-through" : ""
                    }`}
                  >
                    {todo.title}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
