import Link from "next/link";
import { connection } from "next/server";
import LogoutButton from "./logout-button";
import { createClient } from "./lib/supabase/server";

// ヘッダー。ログイン中ならメールアドレスとログアウト、未ログインならリンクを出す。
// Cookie を読むのでリクエストごとに描画される（layout 側で Suspense で包む）
export default async function AuthHeader() {
  // getClaims() はトークンの期限を現在時刻と比べる（内部で Date.now() を使う）。
  // 事前描画（prerender）中に時刻を使うとエラーになるので、先に「リクエスト時に描画する」と明示する
  await connection();
  const supabase = await createClient();
  // getClaims は署名を検証してから中身を返すので、サーバー側でも信用してよい
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;

  return (
    <header className="border-b border-gray-200 bg-white">
      {/* 狭い画面でも横スクロールしないよう、メールは min-w-0 + truncate で省略する */}
      <div className="mx-auto flex max-w-md items-center justify-end gap-2 px-4 py-2">
        {email ? (
          <>
            <span className="min-w-0 truncate text-sm text-gray-500">
              {email}
            </span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-md px-3 py-1 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              新規登録
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
