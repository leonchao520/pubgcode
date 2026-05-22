"use client";

import type { LifetimeStats } from "@/lib/pubg";
import type { QueryResult } from "@/lib/query";

/** 统计 Tab — 生涯数据 + 模式对比 */

function StatCell({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? "rgba(212,160,48,0.08)" : "rgba(255,255,255,0.02)",
      border: highlight ? "1px solid rgba(212,160,48,0.15)" : "1px solid rgba(255,255,255,0.04)",
      borderRadius: "6px", padding: "10px 8px", textAlign: "center",
    }}>
      <div style={{ fontSize: "17px", fontWeight: 700, color: highlight ? "#d4a030" : "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", marginBottom: "2px" }}>{value}</div>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{label}</div>
    </div>
  );
}

export default function StatsTab({ result }: { result: QueryResult }) {
  const { lifetimeStats, normalStats, rankedStats, survivalMastery } = result;
  
  // 汇总赛季数据作为生涯数据的补充
  const allModes = { ...(normalStats?.stats || {}), ...(rankedStats?.stats || {}) };
  const seasonKills = Object.values(allModes).reduce((s: number, v: any) => s + (v.kills || 0), 0);
  const seasonMatches = Object.values(allModes).reduce((s: number, v: any) => s + (v.matches || 0), 0);
  const seasonWins = Object.values(allModes).reduce((s: number, v: any) => s + (v.wins || 0), 0);
  const seasonDmg = Object.values(allModes).reduce((s: number, v: any) => s + (v.damageDealt || 0), 0);

  const lt = lifetimeStats;
  const hasLifetime = lt && lt.matches > 0;
  
  // 用生涯数据或赛季汇总
  const kills = hasLifetime ? lt.kills : seasonKills;
  const matches = hasLifetime ? lt.matches : seasonMatches;
  const wins = hasLifetime ? lt.wins : seasonWins;
  const damage = hasLifetime ? lt.damageDealt : seasonDmg;
  const kd = matches > wins ? (kills / (matches - wins)).toFixed(2) : String(kills);
  const winRate = matches > 0 ? ((wins / matches) * 100).toFixed(1) : "0";
  const avgDmg = matches > 0 ? Math.round(damage / matches) : 0;
  const headshotRate = kills > 0 && hasLifetime ? ((lt.headshotKills / kills) * 100).toFixed(1) : "—";
  const top10Rate = matches > 0 ? (((hasLifetime ? lt.top10s : Object.values(allModes).reduce((s: number, v: any) => s + (v.top10s || 0), 0)) / matches) * 100).toFixed(1) : "0";
  const survivedHrs = hasLifetime ? Math.round(lt.timeSurvived / 3600) : "—";
  const avgRank = hasLifetime ? lt.avgRank : null;

  return (
    <div style={s.wrap}>
      {/* ─── 核心 KPI ──────────────── */}
      <div style={s.card}>
        <div style={s.header}>
          <span>{hasLifetime ? "生涯数据" : "赛季汇总"}</span>
          <span style={s.headerMeta}>{matches.toLocaleString()} 场</span>
        </div>
        <div className="resp-grid-4" style={{ padding: "14px 16px", gap: "8px" }}>
          <StatCell label="K/D" value={kd} highlight />
          <StatCell label="胜率" value={`${winRate}%`} />
          <StatCell label="场均伤害" value={avgDmg.toLocaleString()} />
          <StatCell label="Top10率" value={`${top10Rate}%`} />
        </div>
      </div>

      {/* ─── ⚔️ 战斗 ──────────────── */}
      <div style={s.card}>
        <div style={s.sectionTitle}>⚔️ 战斗</div>
        <div className="resp-grid-4" style={{ padding: "0 16px 10px", gap: "6px" }}>
          <StatCell label="击杀" value={kills.toLocaleString()} />
          <StatCell label="胜场" value={wins.toLocaleString()} />
          <StatCell label="总伤害" value={damage.toLocaleString()} />
          <StatCell label="场次" value={matches.toLocaleString()} />
        </div>
      </div>

      {/* ─── 🎯 精准 ──────────────── */}
      <div style={s.card}>
        <div style={s.sectionTitle}>🎯 精准</div>
        <div className="resp-grid-4" style={{ padding: "0 16px 10px", gap: "6px" }}>
          <StatCell label="爆头击杀" value={hasLifetime ? lt.headshotKills.toLocaleString() : "—"} />
          <StatCell label="爆头率" value={`${headshotRate}%`} />
          <StatCell label="最长击杀" value={hasLifetime ? `${lt.longestKill}m` : "—"} />
          <StatCell label="助攻" value={hasLifetime ? lt.assists.toLocaleString() : "—"} />
        </div>
      </div>

      {/* ─── ⏱️ 生存 ──────────────── */}
      <div style={s.card}>
        <div style={s.sectionTitle}>⏱️ 生存</div>
        <div className="resp-grid-4" style={{ padding: "0 16px 10px", gap: "6px" }}>
          <StatCell label="存活时长" value={typeof survivedHrs === "number" ? `${survivedHrs}h` : String(survivedHrs)} />
          <StatCell label="Top10" value={hasLifetime ? lt.top10s.toLocaleString() : "—"} />
          <StatCell label="平均排名" value={avgRank && avgRank > 0 ? `#${avgRank.toFixed(1)}` : "?"} />
          <StatCell label="载具击杀" value={hasLifetime ? lt.roadKills.toLocaleString() : "—"} />
        </div>
      </div>

      {/* ─── 模式对比 ──────────────── */}
      {Object.keys(allModes).length > 0 && (
        <div style={s.card}>
          <div style={s.sectionTitle}>📊 本赛季各模式对比</div>
          <div style={{ padding: "0 16px 12px", overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>模式</th>
                  <th style={s.th}>场次</th>
                  <th style={s.th}>K/D</th>
                  <th style={s.th}>胜率</th>
                  <th style={s.th}>场均伤害</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(allModes).sort(([,a]: any, [,b]: any) => (b.matches || 0) - (a.matches || 0)).map(([mode, stats]: any) => {
                  const m2 = stats.matches || 0;
                  const kd2 = m2 > (stats.wins || 0) ? (stats.kills / (m2 - (stats.wins || 0))).toFixed(2) : "?";
                  const wr2 = m2 > 0 ? `${((stats.wins / m2) * 100).toFixed(1)}%` : "—";
                  const ad2 = m2 > 0 ? Math.round(stats.damageDealt / m2) : "—";
                  const labels: Record<string,string> = { "squad-fpp": "四排FPP", "squad": "四排TPP", "duo-fpp": "双排FPP", "duo": "双排TPP", "solo-fpp": "单排FPP", "solo": "单排TPP" };
                  return (
                    <tr key={mode} style={s.tr}>
                      <td style={s.td}>{labels[mode] || mode}</td>
                      <td style={s.td}>{m2}</td>
                      <td style={{...s.td, color: "#d4a030"}}>{kd2}</td>
                      <td style={s.td}>{wr2}</td>
                      <td style={s.td}>{ad2}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 无数据 */}
      {!hasLifetime && Object.keys(allModes).length === 0 && (
        <div style={s.empty}>
          <div style={{ fontSize: "24px", marginBottom: "8px" }}>📭</div>
          <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>暂无统计数据</div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrap: { display: "flex", flexDirection: "column", gap: "10px" } as React.CSSProperties,
  card: {
    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", overflow: "hidden",
  } as React.CSSProperties,
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)",
    fontSize: "14px", fontWeight: 600, color: "#fff",
  } as React.CSSProperties,
  headerMeta: { fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 400 } as React.CSSProperties,
  sectionTitle: {
    padding: "12px 16px 8px", fontSize: "12px", fontWeight: 600,
    color: "rgba(255,255,255,0.5)",
  } as React.CSSProperties,
  table: {
    width: "100%", borderCollapse: "collapse" as const, fontSize: "12px",
  } as React.CSSProperties,
  th: {
    textAlign: "left" as const, padding: "8px 8px", color: "rgba(255,255,255,0.4)",
    fontWeight: 500, borderBottom: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,
  tr: { borderBottom: "1px solid rgba(255,255,255,0.03)" } as React.CSSProperties,
  td: {
    padding: "8px 8px", color: "rgba(255,255,255,0.7)",
    fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  } as React.CSSProperties,
  empty: {
    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px", padding: "32px", textAlign: "center",
  } as React.CSSProperties,
};
