import { createBrowserClient } from "@supabase/ssr";

// ブラウザ（Client Component）用の Supabase クライアント。
// createBrowserClient は内部で1つのインスタンスを使い回すので、何度呼んでも重くならない。
// 環境変数は NEXT_PUBLIC_ 付きでないとブラウザから読めない。
// publishable key は公開前提の鍵。データを守るのは鍵ではなく RLS（行レベルセキュリティ）
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
