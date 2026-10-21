import { createClient } from "@supabase/supabase-js";

// ブラウザから呼ぶので、環境変数は NEXT_PUBLIC_ 付きのものを使う。
// publishable key は公開前提の鍵。データを守るのは鍵ではなく RLS（行レベルセキュリティ）
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
