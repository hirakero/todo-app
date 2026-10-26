import { Suspense } from "react";
import RedirectIfLoggedIn from "../redirect-if-logged-in";
import SignupForm from "./signup-form";

export default function SignupPage() {
  return (
    // ログイン中なら / へ転送する。Cookie を読むので Suspense で包む
    <Suspense>
      <RedirectIfLoggedIn>
        <SignupForm />
      </RedirectIfLoggedIn>
    </Suspense>
  );
}
