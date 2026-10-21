import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// サーバー（Server Component / Server Function / Route Handler）用の Supabase クライアント。
// ログイン状態は Cookie に入っているので、リクエストごとに Cookie を渡して作り直す
export async function createClient() {
  // Next.js では cookies() は非同期関数。await が必要
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        // Supabase がセッションを読むときに呼ぶ
        getAll() {
          return cookieStore.getAll();
        },
        // トークン更新などで Cookie を書くときに呼ぶ
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component からは Cookie を書けないのでここに来ることがある。
            // 無視してよい（更新は Proxy が担当する。Proxy は未導入）
          }
        },
      },
    },
  );
}
