"use client"; // クリックで signOut を呼ぶので、クライアントコンポーネントにする

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "./lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  // 連打防止。ログアウト中はボタンを押せなくする
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    setIsPending(false);

    // 失敗したときは画面を変えない（ログイン中のまま）
    if (error) return;

    // サーバー側で描画されているヘッダーを作り直し、未ログイン表示に切り替える
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="rounded-md px-3 py-1 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
    >
      ログアウト
    </button>
  );
}
