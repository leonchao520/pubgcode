"use client";

import Link from "next/link";
import type { QueryResult } from "@/lib/query";
import StatsPanel from "./StatsPanel";
import MatchHistory from "./MatchHistory";

export default function ResultCard({ result, onSeasonChange }: { result: QueryResult; onSeasonChange?: (seasonId: string) => void }) {
  if (result.error) {
    return (
      <div style={st.card}>
        <p style={st.errorTitle}>查询失败</p>
        <p style={st.errorMsg}>{result.error}</p>
        <Link href="/" style={st.backLink}>← 返回</Link>
      </div>
    );
  }

  const { pubg, steam } = result;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Steam 独立卡片 (无 PUBG 数据时也显示) */}
      {steam && !pubg && (
        <div style={st.card}>
          <div style={st.cardHeader}>
            <div style={st.cardHeaderLeft}>
              <div style={{ ...st.accentBar, background: "#60a5fa" }} />
              <div>
                <div style={st.label}>Steam 玩家</div>
                <div style={st.playerName}>{steam.personaName}</div>
              </div>
            </div>
            <div style={st.cardHeaderRight}>
              <span style={steam.bans.vacBanned || steam.bans.numberOfGameBans > 0 ? st.badgeBan : st.badgeClean}>
                {steam.bans.vacBanned ? `VAC ×${steam.bans.numberOfVacBans}`
                  : steam.bans.numberOfGameBans > 0 ? `游戏封禁 ×${steam.bans.numberOfGameBans}`
                  : "Steam 无封禁"}
              </span>
              {steam.avatarUrl && <img src={steam.avatarUrl} alt="" style={st.avatar} />}
            </div>
          </div>
          <div style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>PUBG 总时长</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#60a5fa" }}>{Math.floor(steam.pubgPlaytimeMinutes / 60).toLocaleString()}h</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: "6px", padding: "10px 12px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>近 14 天</div>
              <div style={{ fontSize: "22px", fontWeight: 700, color: "#60a5fa" }}>{Math.floor(steam.pubgPlaytime2wMinutes / 60)}h</div>
            </div>
          </div>
          <div style={{ padding: "0 20px 16px", textAlign: "center" }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
              该 Steam 账户未关联到 PUBG 玩家，可能昵称不同或未玩过 PUBG
            </p>
            <a href={steam.profileUrl} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: "12px", color: "#60a5fa", textDecoration: "none", marginTop: "8px", display: "inline-block" }}>
              查看 Steam 主页 ↗
            </a>
          </div>
        </div>
      )}

      {/* PUBG 玩家卡片 */}
      {pubg && (
        <div style={st.card}>
          <div style={st.cardHeader}>
            <div style={st.cardHeaderLeft}>
              <div style={st.accentBar} />
              <div>
                <div style={st.label}>PUBG 玩家</div>
                <div style={st.playerName}>{pubg.name}</div>
              </div>
            </div>
            <div style={st.cardHeaderRight}>
              <span style={pubg.banType !== "Innocent" ? st.badgeBan : st.badgeClean}>
                {pubg.banType !== "Innocent" ? `封禁: ${pubg.banType}` : "无封禁"}
              </span>
              {steam?.avatarUrl && (
                <img src={steam.avatarUrl} alt="" style={st.avatar} />
              )}
            </div>
          </div>

          {/* Steam 关联 */}
          {steam && (
            <div style={st.steamRow}>
              <span style={st.steamLabel}>Steam</span>
              <span style={st.steamName}>{steam.personaName}</span>
              <span style={st.steamDivider} />
              <span style={steam.bans.vacBanned || steam.bans.numberOfGameBans > 0 ? st.badgeBan : st.badgeClean}>
                {steam.bans.vacBanned ? `VAC ×${steam.bans.numberOfVacBans}`
                  : steam.bans.numberOfGameBans > 0 ? `游戏封禁 ×${steam.bans.numberOfGameBans}`
                  : "Steam 无封禁"}
              </span>
              <a href={steam.profileUrl} target="_blank" rel="noopener noreferrer" style={st.steamLink}>
                主页 ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* 战绩面板 */}
      <StatsPanel result={result} onSeasonChange={onSeasonChange} />

      {result.recentMatches && result.recentMatches.length > 0 && (
        <MatchHistory matches={result.recentMatches} />
      )}

      {/* 无赛季数据 */}
      {pubg && !result.normalStats && !result.rankedStats && !result.lifetimeStats && (
        <div style={st.card}>
          <p style={st.noData}>本赛季暂无战绩数据</p>
        </div>
      )}

      {/* 底部信息 */}
      <div style={st.bottomBar}>
        <span style={st.cacheInfo}>{result.fromCache ? "● 缓存数据" : "● 实时查询"}</span>
        <Link href="/history" style={st.historyLink}>历史记录 →</Link>
      </div>
    </div>
  );
}

/* ─── 样式 ────────────────────────────────── */

const st = {
  card: {
    background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  } as React.CSSProperties,

  cardHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,

  cardHeaderLeft: { display: "flex", alignItems: "center", gap: "12px" } as React.CSSProperties,
  cardHeaderRight: { display: "flex", alignItems: "center", gap: "10px" } as React.CSSProperties,

  accentBar: { width: "2px", height: "20px", background: "#d4a030", borderRadius: "1px" } as React.CSSProperties,

  label: {
    fontSize: "10px", color: "rgba(255,255,255,0.45)", letterSpacing: "1.5px",
    textTransform: "uppercase", marginBottom: "2px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  playerName: {
    fontSize: "16px", fontWeight: 600, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  badgeClean: {
    fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
    background: "rgba(34,197,94,0.08)", color: "#4ade80",
    border: "1px solid rgba(34,197,94,0.2)",
  } as React.CSSProperties,

  badgeBan: {
    fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
    background: "rgba(239,68,68,0.08)", color: "#f87171",
    border: "1px solid rgba(239,68,68,0.2)",
  } as React.CSSProperties,

  avatar: {
    width: "32px", height: "32px", borderRadius: "4px",
    border: "1px solid rgba(255,255,255,0.1)",
  } as React.CSSProperties,

  steamRow: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "10px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
    background: "rgba(255,255,255,0.01)",
    fontSize: "12px",
  } as React.CSSProperties,

  steamLabel: { color: "rgba(255,255,255,0.4)", fontSize: "11px" } as React.CSSProperties,
  steamName: { color: "rgba(255,255,255,0.6)", fontSize: "12px" } as React.CSSProperties,
  steamDivider: { width: "1px", height: "12px", background: "rgba(255,255,255,0.08)" } as React.CSSProperties,
  steamLink: {
    marginLeft: "auto", color: "rgba(255,255,255,0.45)", fontSize: "11px",
    textDecoration: "none",
  } as React.CSSProperties,

  bottomBar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    paddingTop: "4px",
  } as React.CSSProperties,

  cacheInfo: { fontSize: "11px", color: "rgba(255,255,255,0.45)" } as React.CSSProperties,
  historyLink: { fontSize: "11px", color: "rgba(255,255,255,0.45)", textDecoration: "none" } as React.CSSProperties,
  noData: { padding: "20px", textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.45)" } as React.CSSProperties,

  errorTitle: { fontSize: "14px", fontWeight: 600, color: "#f87171", marginBottom: "8px" } as React.CSSProperties,
  errorMsg: { fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "12px" } as React.CSSProperties,
  backLink: { color: "#d4a030", fontSize: "13px", textDecoration: "none" } as React.CSSProperties,
};
