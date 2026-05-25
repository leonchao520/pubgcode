"use client";

import { useState, useEffect } from "react";
import type { QueryResult } from "@/lib/query";
import type { GameModeStats, LifetimeStats } from "@/lib/pubg";
import { getTierImage, getTierLabel, getSubTierLabel } from "./PlayerHelpers";

const MODE_LABELS: Record<string, string> = {
  "squad-fpp": "四排 FPP", "squad": "四排 TPP",
  "duo-fpp": "双排 FPP", "duo": "双排 TPP",
  "solo-fpp": "单排 FPP", "solo": "单排 TPP",
};

type TabType = "ranked" | "normal" | "lifetime";

/* ─── 小控件 ─────────────────────────────── */

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={st.statBox}>
      <div style={st.statValue} data-color={color}>{value}</div>
      <div style={st.statLabel}>{label}</div>
    </div>
  );
}

function TierBadge({ tier, subTier, rankPoints }: { tier: string; subTier: string; rankPoints: number }) {
  return (
    <div style={st.tierHero}>
      <img src={getTierImage(tier, subTier)} alt="" style={st.tierImg} />
      <div style={st.tierInfo}>
        <div style={st.tierName}>{getTierLabel(tier)} {getSubTierLabel(subTier)}</div>
        <div style={st.tierRp}><span style={{ color: "#E6B849" }}>{rankPoints}</span> RP</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   StatsPanel — 模仿 pubg.plus 赛季页面
   ═══════════════════════════════════════════ */

export default function StatsPanel({ result, onSeasonChange: onSeasonCb }: {
  result: QueryResult;
  onSeasonChange?: (seasonId: string) => void;
}) {
  const { pubg, seasons, normalStats, rankedStats, lifetimeStats } = result;
  const [tab, setTab] = useState<TabType>("ranked");
  const [seasonIdx, setSeasonIdx] = useState(-1); // -1 = 当前赛季

  // 有 ranked 数据默认选 ranked，否则 normal，否则 lifetime
  useEffect(() => {
    const hasRanked = rankedStats && Object.keys(rankedStats.stats).length > 0;
    const hasNormal = normalStats && Object.keys(normalStats.stats).length > 0;
    if (hasRanked) setTab("ranked");
    else if (hasNormal) setTab("normal");
    else if (lifetimeStats?.matches) setTab("lifetime");
  }, []);

  if (!pubg) return null;

  const seasonList = seasons || [];
  const currentSeason = seasonList[seasonIdx] || seasonList.find(s => s.isCurrentSeason);
  const hasPrev = seasonIdx < seasonList.length - 1;
  const hasNext = seasonIdx > -1;

  function goSeason(delta: number) {
    const next = seasonIdx + delta;
    if (next < -1 || next >= seasonList.length) return;
    setSeasonIdx(next);
    const sid = next === -1 ? "" : seasonList[next]?.id || "";
    onSeasonCb?.(sid);
  }

  // 当前 tab 数据
  let rankedModes: [string, GameModeStats & { currentTier?: { tier: string; subTier: string }; rankPoints?: number }][] = [];
  let normalModes: [string, GameModeStats][] = [];
  let lifetime: LifetimeStats | null = null;

  if (tab === "ranked" && rankedStats) {
    rankedModes = Object.entries(rankedStats.stats);
  } else if (tab === "normal" && normalStats) {
    normalModes = Object.entries(normalStats.stats).filter(([,s]) => s.matches > 0);
    // 按场次排序
    normalModes.sort((a, b) => (b[1].matches || 0) - (a[1].matches || 0));
  } else if (tab === "lifetime") {
    lifetime = lifetimeStats || null;
  }

  return (
    <div style={sc.wrap}>
      {/* ─── 赛季导航 ──────── */}
      <div style={sc.seasonNav}>
        <button onClick={() => goSeason(1)} disabled={!hasPrev} style={navBtn(!hasPrev)}>
          ‹ 上赛季
        </button>
        <div style={sc.seasonCenter}>
          <div style={sc.seasonName}>
            {currentSeason?.displayName || "当前赛季"}
          </div>
          {currentSeason?.isCurrentSeason && <span style={sc.seasonBadge}>进行中</span>}
        </div>
        <button onClick={() => goSeason(-1)} disabled={!hasNext} style={navBtn(!hasNext)}>
          下赛季 ›
        </button>
      </div>

      {/* ─── 类型 Tab ──────── */}
      <div style={sc.typeTabs}>
        {(["ranked", "normal", "lifetime"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={tab === t ? sc.typeActive : sc.typeBtn}>
            {{ ranked: "竞技", normal: "普通", lifetime: "生涯" }[t]}
          </button>
        ))}
      </div>

      {/* ─── Ranked 模式 ──────── */}
      {tab === "ranked" && rankedModes.length > 0 && rankedModes.map(([mode, s]) => (
        <div key={mode} style={sc.card}>
          <div style={sc.modeHeader}>
            <span style={sc.modeTitle}>{MODE_LABELS[mode] || mode}</span>
            <span style={sc.modeMeta}>{s.matches} 场</span>
          </div>
          {s.currentTier && (
            <TierBadge tier={s.currentTier.tier} subTier={s.currentTier.subTier} rankPoints={s.rankPoints || 0} />
          )}
          <RankedGrid stats={s} />
        </div>
      ))}
      {tab === "ranked" && rankedModes.length === 0 && <Empty text="暂无竞技模式数据" />}

      {/* ─── Normal 模式 ──────── */}
      {tab === "normal" && normalModes.length > 0 && normalModes.map(([mode, s]) => (
        <div key={mode} style={sc.card}>
          <div style={sc.modeHeader}>
            <span style={sc.modeTitle}>{MODE_LABELS[mode] || mode}</span>
            <span style={sc.modeMeta}>{s.matches} 场</span>
          </div>
          <NormalGrid stats={s} />
        </div>
      ))}
      {tab === "normal" && normalModes.length === 0 && <Empty text="该赛季暂无普通模式数据" />}

      {/* ─── Lifetime 模式 ──────── */}
      {tab === "lifetime" && lifetime && lifetime.matches > 0 && (
        <div style={sc.card}>
          <div style={sc.modeHeader}>
            <span style={sc.modeTitle}>生涯总览</span>
            <span style={sc.modeMeta}>{lifetime.matches.toLocaleString()} 场</span>
          </div>
          <LifetimePanel stats={lifetime} />
        </div>
      )}
      {tab === "lifetime" && (!lifetime || !lifetime.matches) && (
        <Empty text="暂无生涯数据" subtitle="部分账号的生涯统计数据可能暂时不可用" />
      )}
    </div>
  );
}

/* ─── 数据网格 ────────────────────────────── */

function RankedGrid({ stats: s }: { stats: GameModeStats & { rankPoints?: number } }) {
  const avgDmg = s.matches > 0 ? Math.round(s.damageDealt / s.matches) : 0;
  const winRate = s.matches > 0 ? ((s.wins / s.matches) * 100) : 0;
  const top10Rate = s.matches > 0 ? ((s.top10s / s.matches) * 100) : 0;
  const kd = s.matches > (s.wins || 0) ? (s.kills / (s.matches - (s.wins || 0))) : s.kills;

  return (
    <div style={sc.gridPad}>
      <div className="resp-grid-3" style={{ gap: "10px" }}>
        <StatBox label="K/D" value={kd.toFixed(2)} color="#E6B849" />
        <StatBox label="场均伤害" value={avgDmg.toLocaleString()} color="#4ade80" />
        <StatBox label="场均排名" value={s.avgRank > 0 ? `#${s.avgRank.toFixed(1)}` : "?"} />
      </div>
      <div className="resp-grid-4" style={{ marginTop: "8px", gap: "10px" }}>
        <StatBox label="击杀" value={s.kills.toLocaleString()} />
        <StatBox label="胜场" value={s.wins.toLocaleString()} />
        <StatBox label="胜率" value={`${winRate.toFixed(1)}%`} />
        <StatBox label="Top10率" value={`${top10Rate.toFixed(1)}%`} />
      </div>
    </div>
  );
}

function NormalGrid({ stats: s }: { stats: GameModeStats }) {
  const avgDmg = s.matches > 0 ? Math.round(s.damageDealt / s.matches) : 0;
  const winRate = s.matches > 0 ? ((s.wins / s.matches) * 100) : 0;
  const top10Rate = s.matches > 0 ? ((s.top10s / s.matches) * 100) : 0;
  const kd = s.matches > (s.wins || 0) ? (s.kills / (s.matches - (s.wins || 0))) : s.kills;

  return (
    <div style={sc.gridPad}>
      <div className="resp-grid-3" style={{ gap: "10px" }}>
        <StatBox label="K/D" value={kd.toFixed(2)} color="#E6B849" />
        <StatBox label="场均伤害" value={avgDmg.toLocaleString()} color="#4ade80" />
        <StatBox label="场次" value={s.matches.toLocaleString()} />
      </div>
      <div className="resp-grid-4" style={{ marginTop: "8px", gap: "10px" }}>
        <StatBox label="击杀" value={s.kills.toLocaleString()} />
        <StatBox label="胜场" value={s.wins.toLocaleString()} />
        <StatBox label="助攻" value={s.assists.toLocaleString()} />
        <StatBox label="最长击杀" value={`${s.longestKill}m`} />
      </div>
    </div>
  );
}

function LifetimePanel({ stats: s }: { stats: LifetimeStats }) {
  const avgDmg = Math.round(s.damageDealt / Math.max(s.matches, 1));
  const winRate = ((s.wins / s.matches) * 100).toFixed(1);
  const top10Rate = ((s.top10s / s.matches) * 100).toFixed(1);
  const survivedHrs = Math.round(s.timeSurvived / 3600);
  const headshotRate = s.kills > 0 ? ((s.headshotKills / s.kills) * 100).toFixed(1) : "0";

  return (
    <div style={sc.gridPad}>
      {/* ⚔️ 战斗 */}
      <div style={sc.groupLabel}>⚔️ 战斗</div>
      <div className="resp-grid-4" style={{ gap: "10px" }}>
        <StatBox label="K/D" value={s.kda.toFixed(2)} color="#E6B849" />
        <StatBox label="击杀" value={s.kills.toLocaleString()} />
        <StatBox label="胜场" value={s.wins.toLocaleString()} />
        <StatBox label="助攻" value={s.assists.toLocaleString()} />
      </div>
      <div className="resp-grid-4" style={{ marginTop: "6px", gap: "10px" }}>
        <StatBox label="胜率" value={`${winRate}%`} color="#4ade80" />
        <StatBox label="Top10率" value={`${top10Rate}%`} color="#60a5fa" />
        <StatBox label="总伤害" value={s.damageDealt.toLocaleString()} />
        <StatBox label="场均伤害" value={avgDmg.toLocaleString()} />
      </div>
      {/* 🎯 精准 */}
      <div style={{ ...sc.groupLabel, marginTop: "12px" }}>🎯 精准</div>
      <div className="resp-grid-4" style={{ gap: "10px" }}>
        <StatBox label="爆头击杀" value={s.headshotKills.toLocaleString()} />
        <StatBox label="爆头率" value={`${headshotRate}%`} />
        <StatBox label="最长击杀" value={`${s.longestKill}m`} />
        <StatBox label="载具击杀" value={s.roadKills.toLocaleString()} />
      </div>
      {/* ⏱️ 生存 */}
      <div style={{ ...sc.groupLabel, marginTop: "12px" }}>⏱️ 生存</div>
      <div className="resp-grid-4" style={{ gap: "10px" }}>
        <StatBox label="存活时长" value={`${survivedHrs}h`} />
        <StatBox label="Top10" value={s.top10s.toLocaleString()} />
        <StatBox label="平均排名" value={s.avgRank > 0 ? `#${s.avgRank.toFixed(1)}` : "?"} />
        <StatBox label="总场次" value={s.matches.toLocaleString()} />
      </div>
    </div>
  );
}

function Empty({ text, subtitle }: { text: string; subtitle?: string }) {
  return (
    <div style={sc.empty}>
      <div style={sc.emptyIcon}>📭</div>
      <div style={sc.emptyText}>{text}</div>
      {subtitle && <div style={sc.emptySub}>{subtitle}</div>}
    </div>
  );
}

/* ─── 样式 ───────────────────────────────── */

const navBtn = (disabled: boolean): React.CSSProperties => ({
  padding: "6px 14px", fontSize: "12px",
  background: "transparent", color: disabled ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.5)",
  border: `1px solid ${disabled ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.1)"}`,
  borderRadius: "6px", cursor: disabled ? "default" : "pointer",
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
});

const sc = {
  wrap: { display: "flex", flexDirection: "column", gap: "10px" } as React.CSSProperties,
  card: {
    background: "#1E1E1E", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", overflow: "hidden",
  } as React.CSSProperties,

  // 赛季导航
  seasonNav: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#1E1E1E", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", padding: "12px 16px",
  } as React.CSSProperties,
  seasonCenter: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
  } as React.CSSProperties,
  seasonName: {
    fontSize: "15px", fontWeight: 700, color: "#fff",
  } as React.CSSProperties,
  seasonBadge: {
    fontSize: "10px", color: "#4ade80", background: "rgba(74,222,128,0.1)",
    padding: "1px 8px", borderRadius: "4px", fontWeight: 600,
  } as React.CSSProperties,

  // 类型 Tab（二级子 Tab 样式）
  typeTabs: {
    display: "flex", justifyContent: "flex-start", gap: "0",
    borderBottom: "1px solid #333333",
  } as React.CSSProperties,
  typeBtn: {
    padding: "10px 28px", background: "transparent", color: "#A3A3A3",
    border: "none", borderBottom: "3px solid transparent", borderRadius: 0,
    fontSize: "13px", cursor: "pointer", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  typeActive: {
    padding: "10px 28px", background: "transparent", color: "#fff",
    border: "none", borderBottom: "3px solid #E6B849", borderRadius: 0,
    fontSize: "13px", cursor: "pointer", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,

  // 模式头部
  modeHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "#1E1E1E",
  } as React.CSSProperties,
  modeTitle: {
    fontSize: "15px", fontWeight: 600, color: "#fff",
  } as React.CSSProperties,
  modeMeta: {
    fontSize: "11px", color: "#A3A3A3",
  } as React.CSSProperties,

  // 段位徽章（由 st.tierHero 使用）
  tierHero: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "0 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)",
  } as React.CSSProperties,
  tierImg: {
    width: "56px", height: "56px", borderRadius: "10px",
  } as React.CSSProperties,
  tierInfo: {
    display: "flex", flexDirection: "column", gap: "2px",
  } as React.CSSProperties,
  tierName: {
    fontSize: "20px", fontWeight: 700, color: "#fff",
  } as React.CSSProperties,
  tierRp: {
    fontSize: "13px", color: "rgba(255,255,255,0.5)",
  } as React.CSSProperties,

  // 数据区
  gridPad: { padding: "12px 16px 16px" } as React.CSSProperties,
  groupLabel: {
    fontSize: "11px", fontWeight: 600, color: "#A3A3A3",
    letterSpacing: "0.5px", marginBottom: "6px",
  } as React.CSSProperties,

  // 小方格
  statBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid #333333",
    borderRadius: "8px", padding: "10px 8px", textAlign: "center",
  } as React.CSSProperties,
  statValue: {
    fontSize: "22px", fontWeight: 700, color: "#E6B849", marginBottom: "2px",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  statLabel: {
    fontSize: "11px", color: "#A3A3A3",
  } as React.CSSProperties,

  // 空状态
  empty: {
    background: "#1E1E1E", border: "1px solid #333333",
    borderRadius: "8px", padding: "32px 20px", textAlign: "center",
  } as React.CSSProperties,
  emptyIcon: { fontSize: "24px", marginBottom: "8px" } as React.CSSProperties,
  emptyText: { fontSize: "13px", color: "rgba(255,255,255,0.5)" } as React.CSSProperties,
  emptySub: { fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" } as React.CSSProperties,
};

const st = {
  statBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid #333333",
    borderRadius: "8px", padding: "10px 8px", textAlign: "center",
  } as React.CSSProperties,
  statValue: {
    fontSize: "22px", fontWeight: 700, color: "#E6B849", marginBottom: "2px",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  statLabel: {
    fontSize: "11px", color: "#A3A3A3",
  } as React.CSSProperties,
  tierHero: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "0 16px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)",
  } as React.CSSProperties,
  tierImg: { width: "56px", height: "56px", borderRadius: "10px" } as React.CSSProperties,
  tierInfo: { display: "flex", flexDirection: "column", gap: "2px" } as React.CSSProperties,
  tierName: { fontSize: "20px", fontWeight: 700, color: "#fff" } as React.CSSProperties,
  tierRp: { fontSize: "13px", color: "rgba(255,255,255,0.5)" } as React.CSSProperties,
};
