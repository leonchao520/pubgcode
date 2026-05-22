"use client";

import { useState, useEffect, useCallback } from "react";
import type { Metadata } from "next";
import LoadingCard from "@/components/LoadingCard";

type Shard = "pc-eu" | "pc-na" | "pc-as" | "pc-krjp";
type Mode = "solo" | "solo-fpp" | "duo" | "duo-fpp" | "squad" | "squad-fpp";

interface Player {
  rank: number; name: string; rankPoints: number;
  tier: string; subTier: string;
  wins: number; games: number; winRatio: number;
  kills: number; kda: number;
  averageDamage: number; averageRank: number; top10Ratio: number;
}

interface LeaderboardResponse {
  shardId: string; gameMode: Mode; seasonId: string;
  shardLabel: string; modeLabel: string;
  modes: { id: Mode; label: string }[];
  shards: { id: Shard; label: string }[];
  players: Player[];
  fromCache: boolean;
  error?: string;
}

function getTierLabel(tier: string, subTier?: string): string {
  const map: Record<string, string> = {
    Survivor: "生存者", Master: "大师", Diamond: "钻石",
    Platinum: "铂金", Gold: "黄金", Silver: "白银", Bronze: "青铜",
  };
  const label = map[tier] || tier;
  return subTier ? `${label} ${subTier}` : label;
}

function getTierColor(tier: string): string {
  const t = tier?.toLowerCase() || "";
  if (t.includes("survivor")) return "#FF4D4D";
  if (t.includes("master")) return "#C4A6FF";
  if (t.includes("diamond")) return "#40C9FF";
  if (t.includes("platinum")) return "#2ECC71";
  if (t.includes("gold")) return "#D4A030";
  if (t.includes("silver")) return "#888";
  if (t.includes("bronze")) return "#8B5E3C";
  return "#888";
}

function rankBadgeStyle(rank: number): React.CSSProperties {
  if (rank === 1) return { background: "#D4A030", color: "#000", fontWeight: 700, width: "24px", height: "24px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" };
  if (rank <= 3) return { background: "rgba(212,160,48,0.15)", color: "#D4A030", fontWeight: 700, width: "24px", height: "24px", borderRadius: "6px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "12px" };
  return { color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: "13px" };
}

const MODE_GROUPS: { label: string; modes: Mode[] }[] = [
  { label: "四排", modes: ["squad-fpp", "squad"] },
  { label: "双排", modes: ["duo-fpp", "duo"] },
  { label: "单排", modes: ["solo-fpp", "solo"] },
];

const s: Record<string, React.CSSProperties> = {
  page: { backgroundColor: "#000", color: "#fff", minHeight: "100vh", padding: "20px 12px 60px" },
  container: { width: "100%", maxWidth: "960px", margin: "0 auto" },
  header: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", marginBottom: "20px" },
  title: { fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px" },
  back: { color: "#D4A030", textDecoration: "none", fontSize: "14px", fontWeight: 500 },
  shardRow: { display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" },
  modeRow: { display: "flex", gap: "8px", marginBottom: "20px", alignItems: "center", flexWrap: "wrap" },
  modeGroupLabel: { fontSize: "12px", color: "rgba(255,255,255,0.35)", minWidth: "32px" },
  tableWrapper: { width: "100%", overflowX: "auto" as const, WebkitOverflowScrolling: "touch" as any },
  table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "14px", minWidth: "680px" },
  th: { textAlign: "left" as const, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" as const },
  thRight: { textAlign: "right" as const, padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" as const },
  td: { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  tdRight: { padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "right" as const },
  playerName: { color: "#fff", fontWeight: 500, maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, display: "inline-block" },
  tierText: { fontSize: "13px", fontWeight: 600, verticalAlign: "middle" },
  meta: { fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "16px", textAlign: "center" as const },
};

export default function LeaderboardPage() {
  const [shard, setShard] = useState<Shard>("pc-eu");
  const [mode, setMode] = useState<Mode>("squad-fpp");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");



  const fetchData = useCallback(async (s: Shard, m: Mode) => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/leaderboard?shard=${s}&mode=${m}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error || "加载失败"); setData(null); }
      else setData(json);
    } catch { setError("网络错误"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(shard, mode); }, [shard, mode, fetchData]);

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>🏆 排行榜</h1>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", marginTop: "4px" }}>
              竞技模式前 500 名
            </p>
          </div>
          <a href="/" style={s.back}>← 返回</a>
        </div>

        {/* 区服选择 */}
        <div style={s.shardRow}>
          {(data?.shards || [
            { id: "pc-eu" as Shard, label: "欧洲" },
            { id: "pc-na" as Shard, label: "北美" },
            { id: "pc-as" as Shard, label: "亚洲" },
            { id: "pc-krjp" as Shard, label: "日韩" },
          ]).map(({ id, label }) => {
            const active = shard === id;
            return (
            <button key={id} onClick={() => setShard(id)} style={{
              padding: "8px 16px", borderRadius: "8px",
              border: `1px solid ${active ? "#D4A030" : "rgba(255,255,255,0.1)"}`,
              background: active ? "rgba(212,160,48,0.12)" : "#111",
              color: active ? "#D4A030" : "rgba(255,255,255,0.6)",
              fontSize: "13px", fontWeight: 500, cursor: "pointer", transition: "0.15s",
            }}>
              {label}
            </button>
            );
          })}
        </div>

        {/* 模式选择 */}
        {MODE_GROUPS.map((group) => (
          <div key={group.label} style={s.modeRow}>
            <span style={s.modeGroupLabel}>{group.label}</span>
            {group.modes.map((m) => {
                const active = mode === m;
                return (
              <button key={m} onClick={() => setMode(m)} style={{
                padding: "6px 14px", borderRadius: "6px",
                border: `1px solid ${active ? "#D4A030" : "rgba(255,255,255,0.08)"}`,
                background: active ? "rgba(212,160,48,0.12)" : "transparent",
                color: active ? "#D4A030" : "rgba(255,255,255,0.5)",
                fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "0.15s",
              }}>
                {m.endsWith("-fpp") ? "FPP" : "TPP"}
              </button>
                );
              })}
          </div>
        ))}

        {/* Loading */}
        {loading && <LoadingCard />}

        {/* Error */}
        {error && !loading && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "20px", textAlign: "center" }}>
            <p style={{ color: "#f87171", fontSize: "14px" }}>{error}</p>
            <button onClick={() => fetchData(shard, mode)} style={{ marginTop: "12px", padding: "8px 20px", borderRadius: "6px", border: "none", background: "#D4A030", color: "#000", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>
              重试
            </button>
          </div>
        )}

        {/* 排行榜表 */}
        {data && !loading && (
          <>
            <div style={s.tableWrapper}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>#</th>
                  <th style={s.th}>玩家</th>
                  <th style={s.th}>段位</th>
                  <th style={s.thRight}>RP</th>
                  <th style={s.thRight}>胜率</th>
                  <th style={s.thRight}>KD</th>
                  <th style={s.thRight}>场均伤害</th>
                  <th style={s.thRight} className="hide-mobile">Top10%</th>
                </tr>
              </thead>
              <tbody>
                {data.players.map((p) => (
                  <tr key={p.rank} style={{ transition: "0.1s" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
                  >
                    <td style={s.td}>
                      <span style={rankBadgeStyle(p.rank)}>{p.rank}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.playerName} title={p.name}>{p.name}</span>
                    </td>
                    <td style={s.td}>
                      <span style={s.tierText}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: getTierColor(p.tier), display: "inline-block", marginRight: "6px", verticalAlign: "middle" }} />
                        <span style={{ color: getTierColor(p.tier) }}>{getTierLabel(p.tier, p.subTier)}</span>
                      </span>
                    </td>
                    <td style={{ ...s.tdRight }}><span style={{ fontWeight: 600, color: "#D4A030" }}>{p.rankPoints.toLocaleString()}</span></td>
                    <td style={{ ...s.tdRight, color: "rgba(255,255,255,0.7)" }}>{p.winRatio}%</td>
                    <td style={{ ...s.tdRight, color: "rgba(255,255,255,0.7)" }}>{p.kda}</td>
                    <td style={{ ...s.tdRight, color: "rgba(255,255,255,0.7)" }}>{Math.round(p.averageDamage)}</td>
                    <td style={{ ...s.tdRight }} className="hide-mobile">{p.top10Ratio}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            <p style={s.meta}>
              {data.shardLabel} · {data.modeLabel} · {data.seasonId} · 共 {data.players.length} 名 · {data.fromCache ? "来自缓存" : "实时数据"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
