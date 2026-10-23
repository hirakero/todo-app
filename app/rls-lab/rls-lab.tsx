"use client"; // 入力欄とボタンの操作を扱うので、クライアントコンポーネントにする

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

// 通常の画面と同じブラウザ用クライアントを使う。
// 管理用キー（service_role）や MCP は使わないので、RLS が普通のユーザーと同じように効く
const supabase = createClient();

// 1つの操作の結果。画面に1行ずつ出す
type Result = {
  title: string; // 何をしたか
  expected: string; // RLS が正しく効いているときの結果
  actual: string; // 実際の結果
  passed: boolean; // expected どおりだったか
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// エラーを「コード: メッセージ」の1行にまとめる
function formatError(error: { code?: string; message: string }) {
  return `エラー ${error.code ?? "不明"}: ${error.message}`;
}

export default function RlsLab() {
  // ログイン中の利用者。undefined = 確認中、null = 未ログイン
  const [user, setUser] = useState<{ id: string; email: string } | null | undefined>(
    undefined,
  );
  // 他人の ToDo の id と、他人の user_id（空欄ならランダムな UUID を使う）
  const [otherTodoId, setOtherTodoId] = useState("");
  const [otherUserId, setOtherUserId] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const [otherResults, setOtherResults] = useState<Result[] | null>(null);
  const [ownResults, setOwnResults] = useState<Result[] | null>(null);
  // 実行中は他のボタンを押せなくする
  const [isRunning, setIsRunning] = useState(false);

  // 手順1: 開いた時点で、ログイン中の利用者を確認する。
  // getUser() はサーバーに問い合わせて確かめる。画面に出すのはメールと user_id だけで、トークンは出さない
  useEffect(() => {
    let cancelled = false;

    async function check() {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      setUser(
        data.user ? { id: data.user.id, email: data.user.email ?? "" } : null,
      );
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  // 手順2: 他人のデータに対する操作を試す。RLS が効いていれば、どれも拒否される
  async function runOtherTests() {
    if (!user) return;

    // 空欄ならランダムな UUID にする（存在しない ID。拒否される理由の見え方は少し違う）
    const targetTodoId = otherTodoId.trim() || crypto.randomUUID();
    const targetUserId = otherUserId.trim() || crypto.randomUUID();

    if (!UUID_PATTERN.test(targetTodoId) || !UUID_PATTERN.test(targetUserId)) {
      setInputError("UUID の形式（xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx）で入力してください");
      return;
    }
    if (targetUserId === user.id) {
      setInputError("他人の user_id には、自分以外の id を入れてください");
      return;
    }
    setInputError(null);
    setIsRunning(true);
    setOwnResults(null); // やり直したら、手順3の結果も消す

    const results: Result[] = [];

    // 2-1: 他人の ToDo を更新する。
    // もし RLS が効いていなくても他人のデータを壊さないよう、id を同じ値に書き換えるだけ（実質何も変わらない）
    {
      const { data, error } = await supabase
        .from("todos")
        .update({ id: targetTodoId })
        .eq("id", targetTodoId)
        .select("id");
      const rows = data?.length ?? 0;
      results.push({
        title: "他人の ToDo を更新する",
        expected: "エラーなし・0 件（RLS で対象の行が見えないため、何も更新されない）",
        actual: error ? formatError(error) : `エラーなし・${rows} 件を更新`,
        passed: !error && rows === 0,
      });
    }

    // 2-2: 他人の ToDo を削除する。使い捨ての ToDo を指定すること
    {
      const { data, error } = await supabase
        .from("todos")
        .delete()
        .eq("id", targetTodoId)
        .select("id");
      const rows = data?.length ?? 0;
      results.push({
        title: "他人の ToDo を削除する",
        expected: "エラーなし・0 件（何も削除されない）",
        actual: error ? formatError(error) : `エラーなし・${rows} 件を削除`,
        passed: !error && rows === 0,
      });
    }

    // 2-3: 他人の user_id を指定して追加する。INSERT のポリシー（with check）で拒否される
    {
      const { data, error } = await supabase
        .from("todos")
        .insert({ title: "RLS 実験（他人名義）", user_id: targetUserId })
        .select("id");
      results.push({
        title: "他人の user_id を指定して追加する",
        expected: "エラー 42501（new row violates row-level security policy）",
        actual: error
          ? formatError(error)
          : `エラーなし・${data?.length ?? 0} 件を追加（RLS が効いていません）`,
        passed: error?.code === "42501",
      });
    }

    setOtherResults(results);
    setIsRunning(false);
  }

  // 手順3: 自分のデータに対する操作を試す。今度は成功する。
  // 実験用の ToDo を自分で追加 → 更新 → 削除するので、既存の ToDo には触れず、最後に何も残らない
  async function runOwnTests() {
    if (!user) return;
    setIsRunning(true);

    const results: Result[] = [];

    // 3-1: 自分の ToDo を追加する。user_id は送らない（DB の default が自分の id を入れる）
    const { data: inserted, error: insertError } = await supabase
      .from("todos")
      .insert({ title: "RLS 実験（自分名義）" })
      .select("id");
    const newId = inserted?.[0]?.id as string | undefined;
    results.push({
      title: "自分の ToDo を追加する（user_id は送らない）",
      expected: "エラーなし・1 件を追加",
      actual: insertError
        ? formatError(insertError)
        : `エラーなし・${inserted?.length ?? 0} 件を追加`,
      passed: !insertError && inserted?.length === 1,
    });

    // 追加できなかったときは、続きの更新・削除ができないのでここで終わる
    if (newId) {
      // 3-2: 自分の ToDo を更新する
      const { data: updated, error: updateError } = await supabase
        .from("todos")
        .update({ title: "RLS 実験（更新後）" })
        .eq("id", newId)
        .select("id");
      results.push({
        title: "自分の ToDo を更新する",
        expected: "エラーなし・1 件を更新",
        actual: updateError
          ? formatError(updateError)
          : `エラーなし・${updated?.length ?? 0} 件を更新`,
        passed: !updateError && updated?.length === 1,
      });

      // 3-3: 自分の ToDo を削除する（後片付けも兼ねる）
      const { data: deleted, error: deleteError } = await supabase
        .from("todos")
        .delete()
        .eq("id", newId)
        .select("id");
      results.push({
        title: "自分の ToDo を削除する",
        expected: "エラーなし・1 件を削除",
        actual: deleteError
          ? formatError(deleteError)
          : `エラーなし・${deleted?.length ?? 0} 件を削除`,
        passed: !deleteError && deleted?.length === 1,
      });
    }

    setOwnResults(results);
    setIsRunning(false);
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-16 sm:py-24">
      <main className="w-full max-w-2xl">
        <h1 className="text-center text-3xl font-bold tracking-tight text-emerald-900">
          RLS 実験
        </h1>
        <p className="mt-3 text-center text-sm text-gray-500">
          ログイン中の自分として、他人のデータに触れないことを確かめます（学習用）
        </p>

        {/* ---------- 手順1: ログイン中の利用者 ---------- */}
        <section className="mt-10 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-bold text-emerald-900">1. ログイン中の利用者</h2>
          {user === undefined ? (
            <p className="mt-3 text-sm text-gray-400">確認中...</p>
          ) : user === null ? (
            <p className="mt-3 text-sm text-red-600">
              ログインしていません。先にログインしてください。
            </p>
          ) : (
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="shrink-0 text-gray-500">メール</dt>
                <dd className="min-w-0 break-all">{user.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="shrink-0 text-gray-500">user_id</dt>
                <dd className="min-w-0 break-all font-mono">{user.id}</dd>
              </div>
            </dl>
          )}
        </section>

        {/* ---------- 手順2: 他人のデータ ---------- */}
        <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-bold text-emerald-900">
            2. 他人のデータを操作してみる（先にこちら）
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            別のアカウントで新規登録し、使い捨ての ToDo を1件追加してください。Supabase
            ダッシュボードの Table Editor で、その行の <code>id</code> と{" "}
            <code>user_id</code> を貼り付けます。空欄なら、存在しないランダムな UUID
            を使います。
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              他人の ToDo の id
              <input
                type="text"
                value={otherTodoId}
                onChange={(event) => setOtherTodoId(event.target.value)}
                placeholder="空欄ならランダム"
                className="min-w-0 rounded-lg border border-gray-200 px-4 py-2 font-mono text-sm font-normal outline-none focus:border-emerald-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              他人の user_id
              <input
                type="text"
                value={otherUserId}
                onChange={(event) => setOtherUserId(event.target.value)}
                placeholder="空欄ならランダム"
                className="min-w-0 rounded-lg border border-gray-200 px-4 py-2 font-mono text-sm font-normal outline-none focus:border-emerald-500"
              />
            </label>
          </div>
          {inputError && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              {inputError}
            </p>
          )}
          <button
            type="button"
            onClick={runOtherTests}
            disabled={!user || isRunning}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            他人のデータで試す（更新・削除・追加）
          </button>
          {otherResults && <ResultList results={otherResults} />}
        </section>

        {/* ---------- 手順3: 自分のデータ ---------- */}
        <section className="mt-6 rounded-lg bg-white p-5 shadow-sm">
          <h2 className="font-bold text-emerald-900">
            3. 自分のデータを操作してみる（手順2のあと）
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            実験用の ToDo を自分で追加 → 更新 → 削除します。既存の ToDo
            には触れず、最後に何も残りません。
          </p>
          <button
            type="button"
            onClick={runOwnTests}
            // 手順2を実行するまで押せない
            disabled={!user || isRunning || otherResults === null}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
          >
            自分のデータで試す（追加・更新・削除）
          </button>
          {otherResults === null && (
            <p className="mt-2 text-xs text-gray-400">
              先に手順2を実行すると押せるようになります
            </p>
          )}
          {ownResults && <ResultList results={ownResults} />}
        </section>
      </main>
    </div>
  );
}

// 結果の一覧。期待どおりなら緑、違えば赤で表示する
function ResultList({ results }: { results: Result[] }) {
  return (
    <ul className="mt-4 flex flex-col gap-3">
      {results.map((result) => (
        <li
          key={result.title}
          className={`rounded-lg border p-3 text-sm ${
            result.passed
              ? "border-emerald-200 bg-emerald-50"
              : "border-red-300 bg-red-50"
          }`}
        >
          <p className="font-medium">
            {result.passed ? "✓ 期待どおり" : "✗ 期待と違う"}: {result.title}
          </p>
          <p className="mt-1 break-words text-gray-600">
            期待: {result.expected}
          </p>
          <p className="break-words text-gray-600">実際: {result.actual}</p>
        </li>
      ))}
    </ul>
  );
}
