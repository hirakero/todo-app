import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { createClient } from "./lib/supabase/server";
import TodoList from "./todo-list";

// 未ログインなら /login へ転送し、ログイン中だけ ToDo 一覧を出す。
// Cookie を読むので、Suspense で包まないとビルドエラーになる（Cache Components）
async function TodoGate() {
  // getUser() はトークンの期限を現在時刻と比べる（内部で Date.now() を使う）。
  // 事前描画（prerender）中に時刻を使うとエラーになるので、先に「リクエスト時に描画する」と明示する
  await connection();
  const supabase = await createClient();
  // getUser() は Supabase のサーバーに問い合わせるので、Cookie の偽装には騙されない
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  return <TodoList />;
}

export default function Home() {
  return (
    <Suspense>
      <TodoGate />
    </Suspense>
  );
}
