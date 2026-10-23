"use client"; // 入力欄の状態とボタンの操作を扱うので、クライアントコンポーネントにする

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "../lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // ログインの通信中か。連打を防ぐ
  const [isSubmitting, setIsSubmitting] = useState(false);
  // 成功後、/ への移動が終わるまでの間か
  const [isNavigating, startNavigation] = useTransition();
  const isPending = isSubmitting || isNavigating;
  // 確認メールのリンクが失敗して戻ってきたときは、最初からその理由を出す
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "confirm"
      ? "確認リンクが無効か、期限が切れています。もう一度登録してください"
      : null,
  );

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setIsSubmitting(false);
      // メールとパスワードのどちらが違うかは、あえて伝えない（登録の有無を探られないため）
      setError(
        error.code === "email_not_confirmed"
          ? "メールの確認が済んでいません。確認メールのリンクを開いてください"
          : error.code === "invalid_credentials"
            ? "メールアドレスかパスワードが違います"
            : "ログインに失敗しました。しばらくしてからもう一度お試しください",
      );
      return;
    }

    // 成功したら / へ移動する。refresh() でサーバー側のヘッダーを作り直し、ログイン表示にする。
    // startNavigation で包むと、移動が終わるまで isNavigating が true になり、終わると自動で false に戻る。
    // この画面は移動後も状態が保持されるので、パスワードも消しておく
    setIsSubmitting(false);
    setPassword("");
    startNavigation(() => {
      router.push("/");
      router.refresh();
    });
  }

  return (
    <>
      {/* form にすると Enter キーでも送信できる */}
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
          パスワード
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
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
          {isPending ? "ログイン中..." : "ログイン"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        はじめての方は{" "}
        <Link href="/signup" className="font-medium text-emerald-700 underline">
          新規登録
        </Link>
      </p>
    </>
  );
}
