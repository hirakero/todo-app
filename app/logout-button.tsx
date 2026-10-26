"use client"; // 送信中かどうか（useFormStatus）を使うので、クライアントコンポーネントにする

import { useFormStatus } from "react-dom";

// <form action={logout}> の中に置く。押すとフォームが送信され、Server Action が動く
export default function LogoutButton() {
  // 親の form が送信中の間は pending が true になる。連打防止に使う
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      aria-label="ログアウト"
      disabled={pending}
      className="rounded-md px-3 py-1 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
    >
      ログアウト
    </button>
  );
}
