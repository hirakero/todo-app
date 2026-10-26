import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "./lib/supabase/server";
import TodoList from "./todo-list";

// 未ログインなら /login へ転送し、ログイン中だけ ToDo 一覧を出す。
// Cookie を読むので、Suspense で包まないとビルドエラーになる（Cache Components）
async function TodoGate() {
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
