import type { NextRequest } from "next/server";
import { updateSession } from "./app/lib/supabase/proxy";

// Next.js 16 では、旧 middleware.ts が proxy.ts という名前になった
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // 静的ファイルや画像には実行しない（毎回トークン更新する必要がないため）
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
