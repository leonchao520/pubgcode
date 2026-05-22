"use client";

import { useState } from "react";
import type { MatchSummary } from "@/lib/pubg";
import { MAP_INFO } from "@/lib/assets";

const MAP_NAMES: Record<string, string> = {
  "Desert_Main": "Miramar",
  "DihorOtok_Main": "Vikendi",
  "Erangel_Main": "Erangel",
  "Savage_Main": "Sanhok",
  "Range_Main": "Karakin",
  "Tiger_Main": "Taego",
  "Kiki_Main": "Deston",
  "Neon_Main": "Rondo",
  "Paramo_Main": "Paramo",
  "Baltic_Main": "Erangel",
  "Summerland_Main": "Karakin",
  "Chimera_Main": "Paramo",
  "Heaven_Main": "Haven",
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}分${s}秒`;
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

function placeEmoji(place: number) {
  if (place === 1) return "🥇";
  if (place <= 3) return "🥈";
  if (place <= 10) return "✅";
  return "💀";
}

function formatMode(mode: string): string {
  let m = mode;
  if (m.startsWith("squad-")) m = m.slice(6);
  else if (m.startsWith("duo-")) m = m.slice(4);
  else if (m.startsWith("solo-")) m = m.slice(5);
  return m.replace("-fpp", "FPP").replace("-tpp", "TPP");
}

export default function MatchHistory({ matches, onSelectMatch }: { matches: MatchSummary[]; onSelectMatch?: (m: MatchSummary) => void }) {
  if (!matches || matches.length === 0) return null;

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.accentBar} />
        <span style={s.title}>最近 {matches.length} 场对局</span>
      </div>

      <div style={s.list}>
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} onSelect={onSelectMatch} />
        ))}
      </div>
    </div>
  );
}

function MatchCard({ match: m, onSelect }: { match: MatchSummary; onSelect?: (m: MatchSummary) => void }) {
  const [expanded, setExpanded] = useState(false);
  const mapName = MAP_NAMES[m.mapName] || m.mapName;
  const modeLabel = formatMode(m.gameMode);
  const place = m.winPlace || 0;
  const rankLabel = place > 0 ? `#${place}/${m.totalParticipants || "?"}` : `#?`;
  const survived = formatTime(m.playerStats.timeSurvived);
  const when = timeAgo(m.createdAt);
  const hasTeam = m.teamPlayers.length > 1;

  function handleClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest("[data-expand]")) {
      setExpanded(!expanded);
      return;
    }
    onSelect?.(m);
  }

  return (
    <div style={s.matchCard} onClick={handleClick}>
      <div style={s.rankCol}>
        <span style={s.rankEmoji}>{placeEmoji(place)}</span>
        <span style={s.rankText}>{rankLabel}</span>
      </div>

      {/* 中间：数据 */}
      <div style={s.dataCol}>
        <div style={s.kdaLine}>
          <span style={{ color: "#fff", fontWeight: 600 }}>{m.playerStats.kill}杀</span>
          {m.playerStats.assist > 0 && (
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px" }}>{m.playerStats.assist}助攻</span>
          )}
          {m.playerStats.dbno > 0 && (
            <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "11px" }}>{m.playerStats.dbno}击倒</span>
          )}
          <span style={s.kdaDivider}>/</span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{m.playerStats.damage.toLocaleString()}伤害</span>
          <span style={s.kdaDivider}>/</span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>{survived}</span>
        </div>
        <div style={s.subLine}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            padding: "1px 6px", borderRadius: "3px",
            background: MAP_INFO[m.mapName]?.color ? `${MAP_INFO[m.mapName].color}20` : "rgba(255,255,255,0.04)",
            border: `1px solid ${MAP_INFO[m.mapName]?.color ? `${MAP_INFO[m.mapName].color}30` : "rgba(255,255,255,0.06)"}`,
          }}>
            <span style={{ fontSize: "11px" }}>{MAP_INFO[m.mapName]?.emoji || "🗺️"}</span>
            <span style={{ color: MAP_INFO[m.mapName]?.color || "rgba(255,255,255,0.5)", fontSize: "11px", fontWeight: 500 }}>
              {MAP_INFO[m.mapName]?.name || mapName}
            </span>
          </span>
          <span style={{ margin: "0 4px", color: "rgba(255,255,255,0.2)" }}>·</span>
          {modeLabel}
        </div>
      </div>

      {/* 右侧：时间 */}
      <div style={s.timeCol}>
        <span style={s.timeText}>{when}</span>
        {hasTeam && (
          <span data-expand style={s.expandIcon}>{expanded ? "▲" : "▼"}</span>
        )}
      </div>

      {/* 队友详情（展开） */}
      {expanded && hasTeam && (
        <div data-expand style={s.teamWrap}>
          <TeamDetail players={m.teamPlayers} />
        </div>
      )}
    </div>
  );
}

function TeamDetail({ players }: { players: MatchSummary["teamPlayers"] }) {
  return (
    <div style={s.teamWrap}>
      <div style={s.teamHeader}>队伍成员</div>
      {players.slice(0, 4).map((p, i) => (
        <div key={i} style={s.teamRow}>
          <span style={s.teamName}>{p.name}</span>
          <div style={s.teamStats}>
            <span style={s.teamStat}>{p.kill}杀</span>
            <span style={s.teamStat}>{p.damage.toLocaleString()}伤害</span>
            {p.dbno > 0 && <span style={s.teamStat}>{p.dbno}击倒</span>}
            {p.headshot > 0 && <span style={s.teamStat}>{p.headshot}爆头</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

const s = {
  card: {
    background: "#0d0d0d",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px",
    overflow: "hidden",
  } as React.CSSProperties,

  header: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  } as React.CSSProperties,

  accentBar: {
    width: "2px", height: "16px", background: "#d4a030", borderRadius: "1px",
  } as React.CSSProperties,

  title: {
    fontSize: "13px", fontWeight: 600, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  list: {
    display: "flex", flexDirection: "column",
  } as React.CSSProperties,

  matchCard: {
    display: "flex",
    alignItems: "flex-start",
    flexWrap: "wrap",
    padding: "14px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    gap: "14px",
    cursor: "pointer",
    transition: "background 0.15s",
  } as React.CSSProperties,

  rankCol: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "48px",
    flexShrink: 0,
    paddingTop: "2px",
  } as React.CSSProperties,

  rankEmoji: {
    fontSize: "18px",
    lineHeight: "24px",
  } as React.CSSProperties,

  rankText: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    fontWeight: 500,
    marginTop: "2px",
  } as React.CSSProperties,

  dataCol: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: 0,
  } as React.CSSProperties,

  kdaLine: {
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  kdaDivider: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "12px",
  } as React.CSSProperties,

  subLine: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.45)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  timeCol: {
    flexShrink: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: "4px",
  } as React.CSSProperties,

  timeText: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.5)",
  } as React.CSSProperties,

  expandIcon: {
    fontSize: "8px",
    color: "rgba(255,255,255,0.4)",
  } as React.CSSProperties,

  teamWrap: {
    width: "100%",
    marginTop: "10px",
    paddingTop: "10px",
    borderTop: "1px solid rgba(255,255,255,0.04)",
  } as React.CSSProperties,

  teamHeader: {
    fontSize: "10px",
    color: "rgba(255,255,255,0.4)",
    letterSpacing: "1px",
    marginBottom: "8px",
  } as React.CSSProperties,

  teamRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 0",
  } as React.CSSProperties,

  teamName: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.6)",
    maxWidth: "120px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  } as React.CSSProperties,

  teamStats: {
    display: "flex",
    gap: "10px",
  } as React.CSSProperties,

  teamStat: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.5)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,
};
