import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// すべてのリクエストの前に呼ばれ、ログイン情報（Cookie 内のトークン）を最新に保つ。
// Server Component は Cookie を書けないので、ここで更新して
// 「サーバー側のコード」と「ブラウザ」の両方に新しいトークンを渡す。
// 未ログイン時の転送はここではなく、各ページ（Server Component）で行う。
// ログイン中に /login /signup を開いた場合の転送は、下で先に行う
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // リクエストごとに作り直す。使い回し用の変数に入れてはいけない
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // 後続の Server Component が新しいトークンを読めるよう、リクエスト側にも書く
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          // ブラウザに返すレスポンス側にも書く
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          // CDN がログイン情報をキャッシュして他人に見せないための Cache-Control など
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          );
        },
      },
    },
  );

  // createServerClient とこの呼び出しの間に、別の処理を挟まないこと。
  // getClaims() がトークンの検証と更新を行う。消すと勝手にログアウトされることがある
  const { data } = await supabase.auth.getClaims();

  // ログイン中にログイン・新規登録の画面を開いたら、ルートへ移動させる
  const { pathname } = request.nextUrl;
  if (data?.claims && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);

    // 更新されたトークンの Cookie と Cache-Control を、移動用のレスポンスにも引き継ぐ。
    // 引き継がないと、トークンが更新された直後の移動でログインが切れることがある
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    supabaseResponse.headers.forEach((value, key) => {
      if (key === "cache-control" || key === "expires" || key === "pragma") {
        redirectResponse.headers.set(key, value);
      }
    });
    return redirectResponse;
  }

  // 作り直したレスポンスを、そのまま返す必要がある（Cookie が入っているため）
  return supabaseResponse;
}
