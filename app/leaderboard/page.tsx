import type { Metadata } from "next";
import LeaderboardClient from "@/components/LeaderboardClient2";

export const metadata: Metadata = {
  title: "PUBG 竞技排行榜",
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
