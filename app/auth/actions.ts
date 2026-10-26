"use server"; // フォームから呼ばれる Server Action。サーバー側だけで実行される

import { redirect } from "next/navigation";
import { createClient } from "../lib/supabase/server";

// ログアウトして /login へ移動する
export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
