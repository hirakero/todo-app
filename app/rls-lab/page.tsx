import { notFound } from "next/navigation";
import RlsLab from "./rls-lab";

export default function RlsLabPage() {
  // 学習用の画面なので、本番ビルドでは存在しないことにする（開発中の npm run dev でだけ開ける）
  if (process.env.NODE_ENV === "production") notFound();

  return <RlsLab />;
}
