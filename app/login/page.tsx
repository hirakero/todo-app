import { Suspense } from "react";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 justify-center px-4 py-16 sm:py-24">
      <main className="w-full max-w-md">
        <h1 className="text-center text-3xl font-bold tracking-tight text-emerald-900">
          ログイン
        </h1>
        {/* フォームは URL の ?error= を読む。URL の読み取りは Suspense で包む必要がある */}
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
    </div>
  );
}
