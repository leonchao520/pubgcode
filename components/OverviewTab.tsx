"use client";

import type { QueryResult } from "@/lib/query";
import type { GameModeStats } from "@/lib/pubg";
import { getSurvivalLevel } from "@/lib/assets";
import WeaponMasteryPanel from "./WeaponMasteryPanel";

/* ─── 总览 Tab ─────────────────────────── */

export default function OverviewTab({ result }: { result: QueryResult }) {
  const { pubg, steam, normalStats, rankedStats, lifetimeStats, seasons, recentMatches, survivalMastery, weaponMastery } = result;

  if (!pubg) return null;

  const lt = lifetimeStats;

  // 段位信息（优先竞技模式，回退到生涯数据）
  let tierData: { tier: string; subTier: string; rankPoints: number } | null = null;
  if (rankedStats) {
    const r = Object.values(rankedStats.stats)[0];
    if (r?.currentTier?.tier) tierData = { tier: r.currentTier.tier, subTier: r.currentTier.subTier, rankPoints: r.rankPoints || 0 };
  }
  // 回退：生涯数据中的段位
  if (!tierData && lt?.currentTier?.tier) {
    tierData = { tier: lt.currentTier.tier, subTier: lt.currentTier.subTier || "", rankPoints: lt.rankPoints || 0 };
  }

  // 本赛季普通模式数据（取 squad-fpp 优先）
  const seasonStats = normalStats?.stats?.["squad-fpp"] || Object.values(normalStats?.stats || {})[0] || null;

  // 核心 KPI
  // avgRank 优先本赛季普通模式 → 竞技模式 → 生涯 → 兜底 ?
  const rankedModeStats = rankedStats ? Object.values(rankedStats.stats)[0] : null;
  const avgRank = (seasonStats?.avgRank && seasonStats.avgRank > 0) ? seasonStats.avgRank
    : (rankedModeStats?.avgRank && rankedModeStats.avgRank > 0) ? rankedModeStats.avgRank
    : (lt?.avgRank && lt.avgRank > 0) ? lt.avgRank : null;
  const winRate = seasonStats && seasonStats.matches > 0 ? seasonStats.wins / seasonStats.matches : lt ? lt.wins / lt.matches : 0;
  const kd = seasonStats && seasonStats.matches > 0 ? (seasonStats.kills / Math.max(seasonStats.matches - (seasonStats.wins || 0), 1)) : lt ? lt.kda : 0;
  const avgDmg = seasonStats && seasonStats.matches > 0 ? Math.round(seasonStats.damageDealt / seasonStats.matches) : lt ? Math.round(lt.damageDealt / Math.max(lt.matches, 1)) : 0;
  const seasonName = seasons?.find(s => s.isCurrentSeason)?.displayName || "当前赛季";

  const currentSeasonId = seasons?.find(s => s.isCurrentSeason)?.displayName || "?";

  return (
    <div style={st.wrap}>
      {/* ─── Hero 卡片 ─────────────────── */}
      <div style={st.card}>
        {/* 玩家信息行 */}
        <div style={st.heroRow}>
          {steam?.avatarUrl && (
            <img src={steam.avatarUrl} alt="" style={st.heroAvatar} />
          )}
          <div style={st.heroInfo}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={st.heroName}>{pubg.name}</div>
              {survivalMastery && (
                <span style={st.levelBadge} title={`${getSurvivalLevel(survivalMastery.xp).title} · XP ${survivalMastery.xp.toLocaleString()}`}>
                  Lv.{survivalMastery.level}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
              <StatusBadge banType={pubg.banType} />
              {steam && (
                <span style={st.heroSteamName}>{steam.personaName}</span>
              )}
            </div>
          </div>
          {tierData && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
              <div style={{ ...st.tierBadge, background: getTierColor(tierData.tier) }}>
                <div style={st.tierName}>{getTierLabel(tierData.tier)}</div>
                <div style={st.tierSub}>{getSubTierLabel(tierData.subTier)}</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={st.tierRp}>{tierData.rankPoints}</div>
                <div style={st.tierRpLabel}>RP</div>
              </div>
            </div>
          )}
        </div>

        {/* 最后活跃 */}
        {recentMatches && recentMatches.length > 0 && (
          <div style={st.lastActive}>
            最近对局：{recentMatches.length} 场可查 | 最后活跃：{timeAgo(recentMatches[0].createdAt)}
          </div>
        )}
      </div>

      {/* ─── 核心 KPI ──────────────────── */}
      <div style={st.card}>
        <div style={st.sectionTitle}>
          <div style={st.accentBar} />
          <span>{seasonName} · 核心数据</span>
        </div>
        <div className="resp-grid-4" style={{ padding: "20px", gap: "20px" }}>
          <KpiBox label="K/D" value={kd > 0 ? kd.toFixed(2) : "?"} color="#E6B849" />
          <KpiBox label="场均伤害" value={avgDmg > 0 ? String(avgDmg) : "?"} color="#4ADE80" />
          <KpiBox label="吃鸡率" value={winRate > 0 ? `${(winRate * 100).toFixed(1)}%` : "?"} color="#FF6B6B" />
          <KpiBox label="场均排名" value={avgRank ? `#${avgRank.toFixed(1)}` : "?"} color="#22D3EE" />
        </div>
      </div>

      {/* ─── Steam ─────────────────────── */}
      {steam && (
        <div style={st.card}>
          <div style={st.sectionTitle}>
            <div style={{ ...st.accentBar, background: "#60A5FA" }} />
            <span>Steam 账号信息</span>
          </div>
          <div className="resp-grid-2" style={{ padding: "8px 20px 16px", gap: "4px 10px" }}>
            <SnapshotItem label="PUBG 总时长" value={`${Math.floor(steam.pubgPlaytimeMinutes / 60)}h`} color="#60A5FA" />
            <SnapshotItem label="近14天" value={`${Math.floor(steam.pubgPlaytime2wMinutes / 60)}h`} color="#60A5FA" />
          </div>
          {/* 封禁详情 */}
          <div style={{ padding: "0 20px 16px" }}>
            <div style={{ ...st.sectionTitle, padding: "0 0 12px 0", borderBottom: "none" }}>
              <div style={{ ...st.accentBar, background: steam.bans.vacBanned || steam.bans.numberOfGameBans > 0 ? "#F87171" : "#4ADE80" }} />
              <span>封禁状态</span>
            </div>
            <div className="resp-grid-3" style={{ gap: "4px 10px" }}>
              <SnapshotItem label="VAC 封禁" value={steam.bans.vacBanned ? `是 ×${steam.bans.numberOfVacBans}` : "无"} color={steam.bans.vacBanned ? "#F87171" : "#4ADE80"} />
              <SnapshotItem label="游戏封禁" value={steam.bans.numberOfGameBans > 0 ? `×${steam.bans.numberOfGameBans}` : "无"} color={steam.bans.numberOfGameBans > 0 ? "#F87171" : "#4ADE80"} />
              <SnapshotItem label="社区封禁" value={steam.bans.communityBanned ? "是" : "无"} color={steam.bans.communityBanned ? "#F87171" : "#4ADE80"} />
              {steam.bans.numberOfGameBans > 0 && (
                <SnapshotItem label="距上次封禁" value={`${steam.bans.daysSinceLastBan}天`} color="rgba(255,255,255,0.6)" />
              )}
              <SnapshotItem label="交易封禁" value={steam.bans.economyBan !== "none" ? steam.bans.economyBan : "无"} color={steam.bans.economyBan !== "none" ? "#F87171" : "#4ADE80"} />
            </div>
          </div>
        </div>
      )}

      {/* ─── 武器专精 ──────────────────── */}
      {weaponMastery && weaponMastery.length > 0 && (
        <WeaponMasteryPanel weapons={weaponMastery} />
      )}
    </div>
  );
}

/* ─── 子组件 ──────────────────────────── */

function StatusBadge({ banType }: { banType: string }) {
  const clean = banType === "Innocent";
  return (
    <span style={{
      fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
      background: clean ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
      color: clean ? "#4ADE80" : "#F87171",
      border: `1px solid ${clean ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
      fontWeight: 500,
    }}>
      {clean ? "正常状态" : banType}
    </span>
  );
}

function KpiBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={st.kpiBox}>
      <div style={st.kpiValue(color)}>{value}</div>
      <div style={st.kpiLabel}>{label}</div>
    </div>
  );
}

function SnapshotItem({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={st.snapItem}>
      <div style={st.snapLabel}>{label}</div>
      <div style={{ ...st.snapValue, color: color || "#fff" }}>{value}</div>
    </div>
  );
}

function getTierColor(tier: string): string {
  const t = tier.toLowerCase();
  if (t.includes("bronze")) return "#8B5E3C";
  if (t.includes("silver")) return "#888";
  if (t.includes("gold")) return "#E6B849";
  if (t.includes("platinum")) return "#40C9FF";
  if (t.includes("diamond")) return "#185ABD";
  if (t.includes("master")) return "#C4A6FF";
  if (t.includes("survivor")) return "#FF4D4D";
  return "#E6B849";
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

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}天前`;
  if (h > 0) return `${h}小时前`;
  if (m > 0) return `${m}分钟前`;
  return "刚刚";
}

/* ─── 样式 ────────────────────────────── */

const st: Record<string, any> = {
  wrap: { display: "flex", flexDirection: "column", gap: "12px" } as React.CSSProperties,
  card: {
    background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  } as React.CSSProperties,

  heroRow: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "16px 20px",
  } as React.CSSProperties,
  heroAvatar: {
    width: "44px", height: "44px", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.12)",
    flexShrink: 0,
  } as React.CSSProperties,
  heroInfo: { flex: 1, minWidth: 0 } as React.CSSProperties,
  heroName: {
    fontSize: "18px", fontWeight: 700, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,
  heroSteamName: {
    fontSize: "11px", color: "rgba(255,255,255,0.5)",
  } as React.CSSProperties,
  levelBadge: {
    fontSize: "12px", fontWeight: 700, color: "#22D3EE",
    background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)",
    borderRadius: "6px", padding: "2px 8px",
  } as React.CSSProperties,
  lastActive: {
    padding: "8px 20px 12px",
    fontSize: "11px", color: "rgba(255,255,255,0.5)",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  } as React.CSSProperties,

  tierBadge: {
    borderRadius: "10px", padding: "8px 14px",
    textAlign: "center", minWidth: "56px",
  } as React.CSSProperties,
  tierName: { fontSize: "12px", fontWeight: 700, color: "#000", lineHeight: "1.2" } as React.CSSProperties,
  tierSub: { fontSize: "16px", fontWeight: 700, color: "#000", lineHeight: "1.3" } as React.CSSProperties,
  tierRp: {
    fontSize: "18px", fontWeight: 700, color: "#E6B849",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,
  tierRpLabel: { fontSize: "10px", color: "rgba(255,255,255,0.4)" } as React.CSSProperties,

  sectionTitle: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: "13px", fontWeight: 600, color: "#fff",
  } as React.CSSProperties,
  accentBar: { width: "2px", height: "16px", background: "#E6B849", borderRadius: "1px" } as React.CSSProperties,

  kpiGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    padding: "20px", gap: "20px",
  } as React.CSSProperties,
  kpiBox: {
    textAlign: "center",
  } as React.CSSProperties,
  kpiValue: (c: string): React.CSSProperties => ({
    fontSize: "28px", fontWeight: 700, color: c,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    marginBottom: "4px",
  }),
  kpiLabel: { fontSize: "11px", color: "rgba(255,255,255,0.45)" } as React.CSSProperties,

  snapshotGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
    padding: "8px 20px 16px", gap: "4px 10px",
  } as React.CSSProperties,
  snapItem: {
    padding: "8px 4px",
  } as React.CSSProperties,
  snapLabel: {
    fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "3px",
  } as React.CSSProperties,
  snapValue: {
    fontSize: "16px", fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  expandBtn: {
    marginLeft: "auto", background: "none", border: "none",
    color: "rgba(255,255,255,0.4)", fontSize: "11px", cursor: "pointer",
  } as React.CSSProperties,
  emptyText: {
    padding: "24px 20px", textAlign: "center",
    fontSize: "13px", color: "rgba(255,255,255,0.4)",
  } as React.CSSProperties,
};
