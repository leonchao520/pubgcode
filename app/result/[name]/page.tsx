import type { Metadata } from "next";
import ResultRedirect from "./ResultRedirect";

type Props = { params: { name: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  return {
    title: `${name} — PUBG.QUERY 战绩查询`,
    description: `查看 ${name} 的 PUBG 战绩、封禁状态、Steam 账户信息`,
    openGraph: {
      title: `${name} — PUBG 战绩查询`,
      description: `查看 ${name} 的 PUBG 战绩数据`,
    },
  };
}

export default function ResultPage({ params }: Props) {
  return <ResultRedirect name={params.name} />;
}
