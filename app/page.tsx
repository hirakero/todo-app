"use client"; // 入力やクリックの状態を扱うので、クライアントコンポーネントにする

import { useState } from "react";

export default function Home() {
  // 入力欄の文字列
  const [title, setTitle] = useState("");
  // 追加済みのToDo一覧
  const [todos, setTodos] = useState<string[]>([]);

  // 「追加」したときの処理
  function handleAdd() {
    // 前後の空白を除いて、空のままなら何もしない
    const trimmed = title.trim();
    if (trimmed === "") return;

    // 既存の配列は変更せず、末尾に足した新しい配列を作って渡す
    setTodos([...todos, trimmed]);
    // 入力欄を空に戻す
    setTitle("");
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-16 sm:py-24">
      {/* max-w-md で横幅を制限し、スマホでも横スクロールが出ないようにする */}
      <main className="w-full max-w-md">
        <h1 className="text-center text-3xl font-semibold tracking-tight">
          ToDo リスト
        </h1>

        {/* form にすると Enter キーでも追加できる */}
        <form
          onSubmit={(event) => {
            event.preventDefault(); // ページのリロードを防ぐ
            handleAdd();
          }}
          className="mt-10 flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="やることを入力"
            className="flex-1 rounded-lg border border-stone-300 px-4 py-3 outline-none focus:border-stone-500 dark:border-stone-700 dark:focus:border-stone-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-stone-900 px-6 py-3 font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            追加
          </button>
        </form>

        {/* まだ1件もないときは案内文、あるときはリストを表示する */}
        {todos.length === 0 ? (
          <p className="mt-12 text-center text-stone-500">
            まだ ToDo がありません
          </p>
        ) : (
          <ul className="mt-12 flex flex-col gap-3">
            {todos.map((todo, index) => (
              // 今回は削除・並べ替えがないので index を key に使っている
              <li
                key={index}
                className="rounded-lg border border-stone-200 px-4 py-3 break-words dark:border-stone-800"
              >
                {todo}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
