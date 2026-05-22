"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { QueryResult } from "@/lib/query";
import type { GameModeStats, LifetimeStats } from "@/lib/pubg";

const MODE_LABELS: Record<string, string> = {
  "squad-fpp": "四排 FPP", "squad": "四排 TPP",
  "duo-fpp": "双排 FPP", "duo": "双排 TPP",
  "solo-fpp": "单排 FPP", "solo": "单排 TPP",
};

type TabType = "normal" | "ranked" | "lifetime";

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={s.statBox}>
      <div style={s.statLabel}>{label}</div>
      <div style={{ ...s.statValue, color: color || "#fff" }}>{value}</div>
    </div>
  );
}

function ProgressBar({ label, value, max, unit, color }: {
  label: string; value: number; max: number; unit: string; color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={s.progressLabel}>{label}</span>
        <span style={{ ...s.progressValue, color }}>{value.toLocaleString()}{unit}</span>
      </div>
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function getTierColor(tier: string): string {
  const t = tier.toLowerCase();
  if (t.includes("bronze")) return "#8B5E3C";
  if (t.includes("silver")) return "#888";
  if (t.includes("gold")) return "#D4A030";
  if (t.includes("platinum")) return "#40C9FF";
  if (t.includes("diamond")) return "#185ABD";
  if (t.includes("master")) return "#C4A6FF";
  if (t.includes("survivor")) return "#FF4D4D";
  return "#d4a030";
}

function getTierLabel(tier: string): string {
  const map: Record<string, string> = {
    Survivor: "生存者", Master: "大师", Diamond: "钻石",
    Platinum: "铂金", Gold: "黄金", Silver: "白银", Bronze: "青铜",
  };
  return map[tier] || tier;
}

function getSubTierLabel(subTier: string): string {
  const map: Record<string, string> = { "1": "Ⅰ", "2": "Ⅱ", "3": "Ⅲ", "4": "Ⅳ", "5": "Ⅴ" };
  return map[subTier] || subTier;
}

export default function StatsPanel({ result, onSeasonChange: onSeasonCb }: {
  result: QueryResult;
  onSeasonChange?: (seasonId: string) => void;
}) {
  const { pubg, steam, seasons, normalStats, rankedStats, lifetimeStats } = result;
  const [tab, setTab] = useState<TabType>("normal");
  const [selectedMode, setSelectedMode] = useState<string>("squad-fpp");
  const router = useRouter();

  // 选择 season
  function onSeasonChange(sid: string) {
    if (onSeasonCb) {
      // SPA 模式：回调给父组件处理
      onSeasonCb(sid === "auto" ? "" : sid);
      return;
    }
    // SSR 模式：跳转页面
    if (sid === "auto") {
      router.push(`/result/${encodeURIComponent(result.input)}`);
    } else {
      router.push(`/result/${encodeURIComponent(result.input)}?season=${sid}`);
    }
  }

  if (!pubg) return null;

  // 获取所有有数据的模式
  const allModes = normalStats ? Object.keys(normalStats.stats) : [];
  
  // 如果普通/竞技没有数据但有生涯数据，自动切到生涯
  useEffect(() => {
    if (tab === "normal" && allModes.length === 0 && lifetimeStats) {
      setTab("lifetime");
    }
  }, [tab, allModes.length]);
  
  // 选当前 tab 的数据
  let modeData: GameModeStats | null = null;
  let tierData: { currentTier: { tier: string; subTier: string }; rankPoints: number } | null = null;

  if (tab === "normal" && normalStats) {
    modeData = normalStats.stats[selectedMode] || Object.values(normalStats.stats)[0] || null;
  } else if (tab === "ranked" && rankedStats) {
    const r = Object.values(rankedStats.stats)[0];
    if (r) {
      modeData = r;
      tierData = { currentTier: r.currentTier, rankPoints: r.rankPoints };
    }
  }

  // 根据有数据的模式自动选第一个
  const availableNormalModes = normalStats ? Object.keys(normalStats.stats) : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* 赛季 + 模式选择 */}
      {seasons && seasons.length > 0 && (
        <div style={s.card}>
          <div style={s.selectRow}>
            <span style={s.selectLabel}>赛季</span>
            <select
              onChange={(e) => onSeasonChange(e.target.value)}
              style={s.select}
              defaultValue="auto"
            >
              <option value="auto">当前赛季（自动）</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>
                  {season.displayName} {season.isCurrentSeason ? "(当前)" : ""}
                </option>
              ))}
            </select>
            
            <span style={s.selectDivider} />
            
            <span style={s.selectLabel}>模式</span>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              style={s.select}
            >
              <option value="squad-fpp">四排 FPP</option>
              <option value="squad">四排 TPP</option>
              <option value="duo-fpp">双排 FPP</option>
              <option value="duo">双排 TPP</option>
              <option value="solo-fpp">单排 FPP</option>
              <option value="solo">单排 TPP</option>
            </select>
            
            <span style={s.selectDivider} />
            
            <span style={s.selectLabel}>类型</span>
            <div style={{ display: "flex", gap: "4px" }}>
              {(["normal", "ranked", "lifetime"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  style={tab === t ? s.typeBtnActive : s.typeBtn}>
                  {{ normal: "普通", ranked: "竞技", lifetime: "生涯" }[t]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 数据展示 */}
      <div style={s.card}>
        {/* 段位信息（竞技模式） */}
        {tab === "ranked" && tierData && modeData && (
          <div style={s2.rankedHeader}>
            <div style={{
              ...s2.tierBadge,
              background: getTierColor(tierData.currentTier.tier),
            }}>
              <div style={s2.tierName}>{getTierLabel(tierData.currentTier.tier)}</div>
              <div style={s2.tierSub}>{getSubTierLabel(tierData.currentTier.subTier)}</div>
            </div>
            <div style={s2.rankedStats}>
              <div style={s2.rpValue}>{tierData.rankPoints}</div>
              <div style={s2.rpLabel}>RP</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={s2.rankedQuick}>
              <div style={s2.quickItem}>
                <div style={s2.quickValue}>#{modeData.avgRank?.toFixed(1) || "?"}</div>
                <div style={s2.quickLabel}>平均排名</div>
              </div>
              <div style={s2.quickItem}>
                <div style={{...s2.quickValue, color: "#d4a030"}}>{modeData.kda.toFixed(2)}</div>
                <div style={s2.quickLabel}>K/D</div>
              </div>
              <div style={s2.quickItem}>
                <div style={s2.quickValue}>{modeData.matches}</div>
                <div style={s2.quickLabel}>场次</div>
              </div>
            </div>
          </div>
        )}

        {/* 数据展示 */}
        {modeData && tab !== "lifetime" && <StatsGrid stats={modeData} />}
        {!modeData && tab === "normal" && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            该玩家本赛季暂无普通模式数据
          </div>
        )}
        {!modeData && tab === "ranked" && (
          <div style={{ padding: "32px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            该玩家本赛季暂无竞技模式数据
          </div>
        )}
        {tab === "lifetime" && lifetimeStats && (
          <LifetimePanel stats={lifetimeStats} />
        )}
        {tab === "lifetime" && !lifetimeStats && (
          <div style={{ padding: "24px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "13px" }}>
            暂无生涯数据
          </div>
        )}
      </div>

      {/* Steam */}
      {steam && <SteamSection steam={steam} />}
    </div>
  );
}

function StatsGrid({ stats }: { stats: GameModeStats }) {
  if (!stats.matches) return null;
  const avgDmg = stats.matches > 0 ? Math.round(stats.damageDealt / stats.matches) : 0;
  const winRate = stats.matches > 0 ? ((stats.wins / stats.matches) * 100).toFixed(1) : "0";
  const top10Rate = stats.matches > 0 ? ((stats.top10s / stats.matches) * 100).toFixed(1) : "0";

  return (
    <>
      <div style={s.sectionHeader}>赛季数据</div>
      <div className="resp-grid-4" style={{ padding: "16px 20px" }}>
        <StatBox label="K/D" value={stats.kda.toFixed(2)} color="#d4a030" />
        <StatBox label="总击杀" value={stats.kills.toLocaleString()} />
        <StatBox label="胜场" value={stats.wins.toLocaleString()} />
        <StatBox label="助攻" value={stats.assists.toLocaleString()} />
      </div>
      <div className="resp-grid-4" style={{ padding: "0 20px 8px" }}>
        <StatBox label="场次" value={stats.matches.toLocaleString()} />
        <StatBox label="胜率" value={`${winRate}%`} />
        <StatBox label="Top10率" value={`${top10Rate}%`} />
        <StatBox label="场均伤害" value={avgDmg.toLocaleString()} />
      </div>
      <div style={{ padding: "0 20px 16px" }}>
        <ProgressBar label="K/D" value={stats.kda} max={6} unit="" color="#d4a030" />
        <ProgressBar label="场均伤害" value={avgDmg} max={500} unit="" color="#4ade80" />
        <ProgressBar label="Top10率" value={stats.top10s} max={stats.matches} unit="" color="#60a5fa" />
      </div>
    </>
  );
}

/* ─── 生涯数据面板（PUBG.HK 风格） ─────────── */

function LifetimePanel({ stats: s }: { stats: LifetimeStats }) {
  if (!s.matches) return null;
  const winRate = ((s.wins / s.matches) * 100).toFixed(1);
  const top10Rate = ((s.top10s / s.matches) * 100).toFixed(1);
  const kd = s.kda.toFixed(2);
  const avgDmg = Math.round(s.damageDealt / s.matches);
  const survivedHrs = Math.round(s.timeSurvived / 3600);
  const headshotRate = s.kills > 0 ? ((s.headshotKills / s.kills) * 100).toFixed(1) : "0";

  return (
    <>
      <div style={s2.sectionHeader}>生涯总览</div>

      {/* 概览：核心 4 项 */}
      <div className="resp-grid-4" style={{ padding: "16px 20px 10px" }}>
        <BigStatBox label="总场次" value={s.matches.toLocaleString()} />
        <BigStatBox label="胜率" value={`${winRate}%`} color="#4ade80" />
        <BigStatBox label="Top10率" value={`${top10Rate}%`} color="#60a5fa" />
        <BigStatBox label="K/D" value={kd} color="#d4a030" />
      </div>

      {/* 战斗 */}
      <div style={s2.groupHeader}>⚔️ 战斗</div>
      <div className="resp-grid-4" style={{ padding: "0 20px 8px" }}>
        <StatBox label="击杀" value={s.kills.toLocaleString()} color="#d4a030" />
        <StatBox label="胜场" value={s.wins.toLocaleString()} />
        <StatBox label="助攻" value={s.assists.toLocaleString()} />
        <StatBox label="总伤害" value={s.damageDealt.toLocaleString()} />
      </div>

      {/* 精准 */}
      <div style={s2.groupHeader}>🎯 精准</div>
      <div className="resp-grid-4" style={{ padding: "0 20px 8px" }}>
        <StatBox label="爆头击杀" value={s.headshotKills.toLocaleString()} />
        <StatBox label="爆头率" value={`${headshotRate}%`} />
        <StatBox label="最长击杀" value={`${s.longestKill}m`} />
        <StatBox label="场均伤害" value={avgDmg.toLocaleString()} />
      </div>

      {/* 生存 */}
      <div style={s2.groupHeader}>⏱️ 生存</div>
      <div className="resp-grid-4" style={{ padding: "0 20px 8px" }}>
        <StatBox label="存活时长" value={`${survivedHrs}h`} color="#60a5fa" />
        <StatBox label="Top10" value={s.top10s.toLocaleString()} />
        <StatBox label="平均排名" value={s.avgRank && s.avgRank > 0 ? `#${s.avgRank.toFixed(1)}` : "?"} />
        <StatBox label="载具击杀" value={s.roadKills.toLocaleString()} />
      </div>

      {/* 进度条 */}
      <div style={{ padding: "8px 20px 16px" }}>
        <ProgressBar label="K/D" value={s.kda} max={6} unit="" color="#d4a030" />
        <ProgressBar label="场均伤害" value={avgDmg} max={500} unit="" color="#4ade80" />
        <ProgressBar label="胜率" value={Number(winRate)} max={50} unit="%" color="#60a5fa" />
      </div>
    </>
  );
}

function BigStatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={s2.bigBox}>
      <div style={s2.bigLabel}>{label}</div>
      <div style={{ ...s2.bigValue, color: color || "#fff" }}>{value}</div>
    </div>
  );
}

function SteamSection({ steam }: { steam: NonNullable<QueryResult["steam"]> }) {
  return (
    <div style={s.card}>
      <div style={s.sectionHeader}>Steam 游戏时长</div>
      <div className="resp-grid-2" style={{ padding: "16px 20px" }}>
        <StatBox label="PUBG 总时长" value={`${Math.floor(steam.pubgPlaytimeMinutes / 60).toLocaleString()}h`} color="#60a5fa" />
        <StatBox label="近14天" value={`${Math.floor(steam.pubgPlaytime2wMinutes / 60)}h`} color="#60a5fa" />
      </div>
      <div style={{ padding: "0 20px 16px" }}>
        <ProgressBar label="活跃度" value={steam.pubgPlaytime2wMinutes / 60} max={100} unit="h" color="#60a5fa" />
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", overflow: "hidden",
  } as React.CSSProperties,

  sectionHeader: {
    padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,

  tabRow: {
    display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,

  selectDivider: { width: "1px", height: "20px", background: "rgba(255,255,255,0.08)" } as React.CSSProperties,

  typeBtn: {
    padding: "6px 14px", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.5)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  typeBtnActive: {
    padding: "6px 14px", background: "rgba(212,160,48,0.12)", color: "#d4a030",
    border: "1px solid rgba(212,160,48,0.3)", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer", fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  tab: {
    flex: 1, padding: "12px", background: "transparent", color: "rgba(255,255,255,0.45)",
    border: "none", borderBottom: "2px solid transparent", fontSize: "13px",
    cursor: "pointer", fontWeight: 500,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  tabActive: {
    flex: 1, padding: "12px", background: "transparent", color: "#d4a030",
    border: "none", borderBottom: "2px solid #d4a030", fontSize: "13px",
    cursor: "pointer", fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  selectRow: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)",
  } as React.CSSProperties,

  selectLabel: {
    fontSize: "12px", color: "rgba(255,255,255,0.5)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  select: {
    padding: "6px 12px", background: "rgba(255,255,255,0.04)", color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px",
    fontSize: "13px", outline: "none",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  modeBtn: {
    padding: "6px 12px", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  modeBtnActive: {
    padding: "6px 12px", background: "rgba(212,160,48,0.08)", color: "#d4a030",
    border: "1px solid rgba(212,160,48,0.3)", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer", fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  statBox: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)",
    borderRadius: "6px", padding: "10px 12px", textAlign: "center",
  } as React.CSSProperties,

  statLabel: {
    fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "4px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  statValue: {
    fontSize: "22px", fontWeight: 700,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  progressLabel: {
    fontSize: "11px", color: "rgba(255,255,255,0.5)",
  } as React.CSSProperties,

  progressValue: {
    fontSize: "11px", fontWeight: 600,
  } as React.CSSProperties,

  progressTrack: {
    height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden",
  } as React.CSSProperties,

  progressFill: {
    height: "100%", borderRadius: "2px", transition: "width 0.6s ease",
  } as React.CSSProperties,
};

const s2 = {
  sectionHeader: {
    padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,

  groupHeader: {
    padding: "14px 20px 6px", fontSize: "11px", fontWeight: 600,
    color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px",
  } as React.CSSProperties,

  grid: {
    padding: "0 20px 8px", display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px",
  } as React.CSSProperties,

  bigBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px", padding: "14px 12px", textAlign: "center",
  } as React.CSSProperties,

  bigLabel: {
    fontSize: "10px", color: "rgba(255,255,255,0.45)", letterSpacing: "0.5px",
    marginBottom: "6px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  bigValue: {
    fontSize: "26px", fontWeight: 700,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  rankedHeader: {
    padding: "16px 20px",
    display: "flex", alignItems: "center", gap: "16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "rgba(255,255,255,0.015)",
  } as React.CSSProperties,

  tierBadge: {
    borderRadius: "10px",
    padding: "10px 18px",
    textAlign: "center",
    minWidth: "64px",
  } as React.CSSProperties,

  tierName: {
    fontSize: "14px", fontWeight: 700, color: "#000",
    lineHeight: "1.2",
  } as React.CSSProperties,

  tierSub: {
    fontSize: "18px", fontWeight: 700, color: "#000",
    lineHeight: "1.3",
  } as React.CSSProperties,

  rankedStats: {
    textAlign: "center",
    flexShrink: 0,
  } as React.CSSProperties,

  rpValue: {
    fontSize: "22px", fontWeight: 700, color: "#d4a030",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  rpLabel: {
    fontSize: "10px", color: "rgba(255,255,255,0.4)",
  } as React.CSSProperties,

  rankedQuick: {
    display: "flex", gap: "16px",
  } as React.CSSProperties,

  quickItem: {
    textAlign: "center",
  } as React.CSSProperties,

  quickValue: {
    fontSize: "16px", fontWeight: 600, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  quickLabel: {
    fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "2px",
  } as React.CSSProperties,
};
