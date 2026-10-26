import { redirect } from "next/navigation";
import { connection } from "next/server";
import type { ReactNode } from "react";
import { createClient } from "./lib/supabase/server";

// ログイン中なら / へ転送し、未ログインのときだけ children を出す。
// /login と /signup で使う。Cookie を読むので、呼び出し側で Suspense で包むこと
export default async function RedirectIfLoggedIn({
  children,
}: {
  children: ReactNode;
}) {
  // getUser() はトークンの期限を現在時刻と比べる（内部で Date.now() を使う）。
  // 事前描画（prerender）中に時刻を使うとエラーになるので、先に「リクエスト時に描画する」と明示する
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return children;
}
