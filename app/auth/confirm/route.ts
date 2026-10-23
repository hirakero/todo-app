import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "../../lib/supabase/server";

// 確認メールのリンク（/auth/confirm?token_hash=...&type=email）を開いたときに呼ばれる。
// メールのトークンを検証し、成功したらログイン状態にして / へ移動する
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // 移動先の URL。トークンが URL に残らないよう、クエリは付けない
  const redirectTo = request.nextUrl.clone();
  redirectTo.search = "";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) {
      redirectTo.pathname = "/";
      return NextResponse.redirect(redirectTo);
    }
  }

  // トークンが無い・期限切れ・使用済みのとき。理由を伝えられるようログイン画面へ戻す
  redirectTo.pathname = "/login";
  redirectTo.searchParams.set("error", "confirm");
  return NextResponse.redirect(redirectTo);
}
