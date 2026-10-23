"use client"; // 入力欄の状態とボタンの操作を扱うので、クライアントコンポーネントにする

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // 送信中か。連打で確認メールが何通も送られるのを防ぐ
  const [isPending, setIsPending] = useState(false);
  // 入力欄の下に出すエラー文。null なら出ていない
  const [error, setError] = useState<string | null>(null);
  // 登録リクエストが成功したか。true なら「確認メールを送りました」を出す
  const [isSent, setIsSent] = useState(false);

  // この画面は、別のページへ移動しても状態が保持されて再利用される。
  // 戻ってきたときに「確認メールを送りました」が残らないよう、離れるときに初期値へ戻す
  useEffect(() => {
    return () => {
      setIsSent(false);
      setPassword("");
      setError(null);
    };
  }, []);

  async function handleSubmit() {
    setIsPending(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    setIsPending(false);

    if (error) {
      // 詳細な英語のメッセージはそのまま見せず、よくある原因を日本語で伝える
      setError(
        error.code === "weak_password"
          ? "パスワードが短すぎます。6文字以上にしてください"
          : "登録に失敗しました。しばらくしてからもう一度お試しください",
      );
      return;
    }

    // すでに登録済みのメールでも成功と同じ応答が返る（登録の有無を外から探られないため）。
    // 画面はどちらでも同じ表示にする
    setIsSent(true);
  }

  return (
    <div className="flex flex-1 justify-center px-4 py-16 sm:py-24">
      <main className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-emerald-900">
          新規登録
        </h1>

        {isSent ? (
          // role="status" で、表示された瞬間に読み上げられる
          <div
            role="status"
            className="mt-10 rounded-lg bg-white p-5 text-sm shadow-sm"
          >
            <p className="font-medium text-emerald-900">確認メールを送りました</p>
            <p className="mt-2 break-words text-gray-600">
              {email} 宛のメールにあるリンクを開くと、登録が完了します。
            </p>
          </div>
        ) : (
          // form にすると Enter キーでも送信できる
          <form
            onSubmit={(event) => {
              event.preventDefault(); // ページのリロードを防ぐ
              handleSubmit();
            }}
            className="mt-10 flex flex-col gap-4 rounded-lg bg-white p-5 shadow-sm"
          >
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              メールアドレス
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                className="min-w-0 rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
              パスワード（6文字以上）
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                // 新しいパスワードを作る欄だと伝えると、ブラウザが強いパスワードを提案してくれる
                autoComplete="new-password"
                className="min-w-0 rounded-lg border border-gray-200 px-4 py-3 font-normal outline-none focus:border-emerald-500"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
            >
              {isPending ? "送信中..." : "登録する"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-500">
          登録済みの方は{" "}
          <Link href="/login" className="font-medium text-emerald-700 underline">
            ログイン
          </Link>
        </p>
      </main>
    </div>
  );
}
