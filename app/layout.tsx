import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import AuthHeader from "./auth-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ToDo リスト",
  description: "シンプルな ToDo アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/* Cookie を読むヘッダーは、Suspense で包まないとビルドエラーになる（Cache Components）。
            読み込み中は同じ高さの空の帯を出し、表示が切り替わったときにガタつかないようにする */}
        <Suspense
          fallback={<div className="h-[45px] border-b border-gray-200 bg-white" />}
        >
          <AuthHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
