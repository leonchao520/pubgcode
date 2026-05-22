import type { Metadata } from "next";
import { queryPlayer } from "@/lib/query";
import PlayerOverview from "@/components/PlayerOverview";

type Props = { params: { name: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  return {
    title: `${name} — PUBG.BAR 战绩查询`,
    description: `查看 ${name} 的 PUBG 战绩、段位、Steam 账户信息`,
    openGraph: {
      title: `${name} — PUBG.BAR 战绩查询`,
      description: `查看 ${name} 的 PUBG 战绩数据`,
    },
  };
}

export default async function PlayerPage({ params }: Props) {
  const name = decodeURIComponent(params.name);
  const result = await queryPlayer(name).catch(() => null);

  return (
    <PlayerOverview
      initialName={name}
      initialResult={result}
    />
  );
}
