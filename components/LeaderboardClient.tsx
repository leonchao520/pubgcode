"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingCard from "@/components/LoadingCard";
import { TIER_COLORS } from "@/lib/assets";

interface LeaderboardPlayer {
  accountId: string;
  name: string;
  rank: number;
  rankPoints: number;
  tier: string;
  subTier: string;
  wins: number;
  games: number;
  winRatio: number;
  kills: number;
  kda: number;
  averageDamage: number;
  averageRank: number;
  top10Ratio: number;
}

interface LeaderboardData {
  shardId: string;
  gameMode: string;
  seasonId: string;
  shardLabel: string;
  modeLabel: string;
  players: LeaderboardPlayer[];
  shards: { id: string; label: string }[];
  modes: { id: string; label: string }[];
  fromCache: boolean;
}

function tierBadge(tier: string, subTier: string) {
  const c = TIER_COLORS[tier.toLowerCase()] || { bg: "#555", text: "#fff", label: tier };
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px",
      background: c.bg, color: c.text, whiteSpace: "nowrap",
    }}>
      {c.label} {subTier || ""}
    </span>
  );
}

function rankBg(rank: number): string {
  if (rank === 1) return "rgba(255,215,0,0.12)";
  if (rank === 2) return "rgba(192,192,192,0.1)";
  if (rank === 3) return "rgba(205,127,50,0.1)";
  return "transparent";
}

function rankBorder(rank: number): string {
  if (rank === 1) return "rgba(255,215,0,0.3)";
  if (rank === 2) return "rgba(192,192,192,0.2)";
  if (rank === 3) return "rgba(205,127,50,0.2)";
  return "transparent";
}

export default function LeaderboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shard, setShard] = useState(searchParams.get("shard") || "pc-eu");
  const [mode, setMode] = useState(searchParams.get("mode") || "squad-fpp");
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (s: string, m: string) => {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/leaderboard?shard=${s}&mode=${m}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(shard, mode);
  }, [shard, mode, fetchData]);

  function handleShardChange(s: string) {
    setShard(s);
    router.replace(`/leaderboard?shard=${s}&mode=${mode}`, { scroll: false });
  }

  function handleModeChange(m: string) {
    setMode(m);
    router.replace(`/leaderboard?shard=${shard}&mode=${m}`, { scroll: false });
  }

  const top3 = data?.players.slice(0, 3) || [];
  const rest = data?.players.slice(3) || [];

  return (
    <div style={lg.page}>
      <div style={lg.container}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <h1 style={lg.title}>
            PUBG<span style={{ color: "#D4A030" }}>.</span>BAR
          </h1>
          <p style={lg.subtitle}>竞技排行榜</p>
        </div>

        {/* 选择器 */}
        <div style={lg.selectors}>
          <div style={lg.selectorGroup}>
            <span style={lg.selectorLabel}>区服</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {data?.shards.map((s) => (
                <button key={s.id} onClick={() => handleShardChange(s.id)}
                  style={shard === s.id ? lg.btnActive : lg.btn}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div style={lg.selectorGroup}>
            <span style={lg.selectorLabel}>模式</span>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {data?.modes.map((m) => (
                <button key={m.id} onClick={() => handleModeChange(m.id)}
                  style={mode === m.id ? lg.btnActive : lg.btn}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p style={lg.error}>{error}</p>}

        {/* Loading */}
        {loading && <LoadingCard />}

        {/* 排行榜 */}
        {data && !loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {/* Top 3 领奖台 */}
            <div style={lg.podiumGrid}>
              {top3.map((p, i) => (
                <div key={p.accountId} style={{
                  ...lg.podiumCard,
                  borderColor: rankBorder(p.rank),
                  background: rankBg(p.rank),
                }}>
                  <div style={lg.podiumRank}>
                    {p.rank === 1 ? "🥇" : p.rank === 2 ? "🥈" : "🥉"}
                  </div>
                  <div style={lg.podiumName}>{p.name}</div>
                  {tierBadge(p.tier, p.subTier)}
                  <div style={lg.podiumRp}>{p.rankPoints.toLocaleString()} RP</div>
                  <div style={lg.podiumStats}>
                    <span>KD {p.kda.toFixed(1)}</span>
                    <span>场均 {p.averageDamage} 伤害</span>
                    <span>胜率 {p.winRatio.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 排行列表 (4-500) */}
            <div style={lg.listCard}>
              <div style={lg.listHeader}>
                <span style={{ width: "44px", textAlign: "center", flexShrink: 0 }}>#</span>
                <span style={{ flex: 1 }}>玩家</span>
                <span style={{ width: "70px", textAlign: "center", flexShrink: 0 }}>段位</span>
                <span style={{ width: "68px", textAlign: "right", flexShrink: 0 }}>RP</span>
                <span style={{ width: "50px", textAlign: "right", flexShrink: 0 }}>KD</span>
                <span style={{ width: "60px", textAlign: "right", flexShrink: 0 }}>场均伤</span>
              </div>

              {rest.map((p) => (
                <div key={p.accountId} style={lg.listRow}>
                  <span style={{ width: "44px", textAlign: "center", flexShrink: 0, fontSize: "12px", color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>
                    {p.rank}
                  </span>
                  <span style={{ flex: 1, fontSize: "13px", color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  <span style={{ width: "70px", textAlign: "center", flexShrink: 0 }}>
                    {tierBadge(p.tier, p.subTier)}
                  </span>
                  <span style={{ width: "68px", textAlign: "right", flexShrink: 0, fontSize: "13px", fontWeight: 700, color: "#D4A030" }}>
                    {p.rankPoints.toLocaleString()}
                  </span>
                  <span style={{ width: "50px", textAlign: "right", flexShrink: 0, fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                    {p.kda.toFixed(1)}
                  </span>
                  <span style={{ width: "60px", textAlign: "right", flexShrink: 0, fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                    {p.averageDamage}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={lg.footer}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)" }}>
                共 {data.players.length} 名玩家 · {data.shardLabel} · {data.modeLabel}
                {data.fromCache && " · 缓存"}
              </span>
              <a href="/" style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>← 返回查询</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const lg = {
  page: {
    backgroundColor: "#000", color: "#fff", minHeight: "100vh",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "40px 20px",
  } as React.CSSProperties,
  container: { width: "100%", maxWidth: "900px" } as React.CSSProperties,
  title: {
    fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px", color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,
  subtitle: { fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "6px" } as React.CSSProperties,
  selectors: {
    display: "flex", flexDirection: "column", gap: "12px",
    marginBottom: "20px", padding: "16px",
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
  } as React.CSSProperties,
  selectorGroup: {
    display: "flex", alignItems: "center", gap: "12px",
  } as React.CSSProperties,
  selectorLabel: { fontSize: "12px", color: "rgba(255,255,255,0.5)", minWidth: "36px", flexShrink: 0 } as React.CSSProperties,
  btn: {
    padding: "5px 12px", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", fontSize: "12px",
    cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  btnActive: {
    padding: "5px 12px", background: "rgba(212,160,48,0.12)", color: "#D4A030",
    border: "1px solid rgba(212,160,48,0.3)", borderRadius: "6px", fontSize: "12px",
    cursor: "pointer", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  error: { color: "#ef4444", fontSize: "12px", textAlign: "center", marginBottom: "12px" } as React.CSSProperties,
  podiumGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px",
  } as React.CSSProperties,
  podiumCard: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px", padding: "20px 14px", textAlign: "center",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
  } as React.CSSProperties,
  podiumRank: { fontSize: "28px" } as React.CSSProperties,
  podiumName: { fontSize: "14px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" } as React.CSSProperties,
  podiumRp: { fontSize: "16px", fontWeight: 700, color: "#D4A030" } as React.CSSProperties,
  podiumStats: { display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px", color: "rgba(255,255,255,0.45)" } as React.CSSProperties,
  listCard: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "10px", overflow: "hidden",
  } as React.CSSProperties,
  listHeader: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600,
    letterSpacing: "0.5px",
  } as React.CSSProperties,
  listRow: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.03)",
  } as React.CSSProperties,
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: "8px",
  } as React.CSSProperties,
};
