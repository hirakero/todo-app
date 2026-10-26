import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { createClient } from "./lib/supabase/server";

// ログイン中なら / へ転送し、未ログインのときだけ children を出す。
// /login と /signup で使う。Cookie を読むので、呼び出し側で Suspense で包むこと
export default async function RedirectIfLoggedIn({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/");

  return children;
}
