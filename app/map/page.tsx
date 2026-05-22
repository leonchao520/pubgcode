import type { Metadata } from "next";
import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";

const MapClient = dynamicImport(() => import("@/components/MapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-sub text-sm">加载地图中...</p>
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "互动地图",
  description: "PUBG 全部地图 — 艾伦格/米拉玛/泰戈/帝斯顿/荣都/维寒迪 · 迫击炮测距 · 密室点位 · 蓝圈自定义",
};

export default function MapPage() {
  return <MapClient />;
}
