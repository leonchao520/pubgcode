"use client";

import { useEffect } from "react";
import type { MatchSummary } from "@/lib/pubg";
import { MAP_INFO } from "@/lib/assets";

const MAP_NAMES: Record<string, string> = {
  "Desert_Main": "Miramar", "DihorOtok_Main": "Vikendi",
  "Erangel_Main": "Erangel", "Savage_Main": "Sanhok",
  "Range_Main": "Karakin", "Tiger_Main": "Taego",
  "Kiki_Main": "Deston", "Neon_Main": "Rondo",
  "Paramo_Main": "Paramo", "Baltic_Main": "Erangel",
  "Chimera_Main": "Paramo", "Heaven_Main": "Haven",
};

function fmtDist(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function deathLabel(type: string): string {
  const map: Record<string, string> = { alive: "存活", byplayer: "被击杀", suicide: "自杀", bluezone: "蓝圈", drowning: "溺水", fall: "坠落", vehicle: "载具" };
  return map[type] || type;
}

function formatMode(mode: string): string {
  let m = mode;
  if (m.startsWith("squad-")) m = m.slice(6);
  else if (m.startsWith("duo-")) m = m.slice(4);
  else if (m.startsWith("solo-")) m = m.slice(5);
  return m.replace("-fpp", "FPP").replace("-tpp", "TPP");
}

export default function MatchDetailModal({ match, onClose }: { match: MatchSummary; onClose: () => void }) {
  const ps = match.playerStats;
  const mapName = MAP_NAMES[match.mapName] || match.mapName;
  const mode = formatMode(match.gameMode);
  const rank = match.winPlace || 0;

  // Esc 关闭
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div style={md.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={md.modal}>
        {/* 头部 */}
        <div style={md.head}>
          <div>
            <div style={md.headTitle}>
              {rank === 1 ? "🥇" : rank <= 3 ? "🥈" : rank <= 10 ? "✅" : "💀"}
              {" "}#{rank}/{match.totalParticipants || "?"}
            </div>
            <div style={{ ...md.headSub, display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "2px 8px", borderRadius: "4px",
                background: MAP_INFO[match.mapName]?.color ? `${MAP_INFO[match.mapName].color}20` : "#333333",
                border: `1px solid ${MAP_INFO[match.mapName]?.color ? `${MAP_INFO[match.mapName].color}30` : "#333333"}`,
              }}>
                <span>{MAP_INFO[match.mapName]?.emoji || "🗺️"}</span>
                <span style={{ color: MAP_INFO[match.mapName]?.color || "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                  {MAP_INFO[match.mapName]?.name || mapName}
                </span>
              </span>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
              <span>{mode}</span>
            </div>
            <div style={md.headDate}>{new Date(match.createdAt).toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <button onClick={onClose} style={md.closeBtn}>✕</button>
        </div>

        {/* 4 大核心 KPI */}
        <div style={md.kpiGrid} className="resp-grid-4">
          <KpiBox label="击杀" value={String(ps.kill)} color="#E6B849" />
          <KpiBox label="伤害" value={ps.damage.toLocaleString()} color="#F87171" />
          <KpiBox label="存活" value={fmtTime(ps.timeSurvived)} color="#60A5FA" />
          <KpiBox label="最远击杀" value={`${ps.longestKill}m`} color="#22D3EE" />
        </div>

        {/* 详细参数 */}
        <div style={md.section}>
          <div style={md.sectionTitle}>⚔️ 战斗</div>
          <div style={md.detailGrid}>
            <DItem label="助攻" value={String(ps.assist)} />
            <DItem label="击倒" value={String(ps.dbno)} />
            <DItem label="爆头" value={String(ps.headshot)} />
            <DItem label="治疗次数" value={String(ps.heals)} />
            <DItem label="强化物品" value={String(ps.boosts)} />
            <DItem label="救援队友" value={String(ps.revives)} />
            <DItem label="死亡方式" value={deathLabel(ps.deathType)} />
            <DItem label="击杀排名" value={`#${ps.killPlace || "?"}`} />
          </div>
        </div>

        <div style={md.section}>
          <div style={md.sectionTitle}>🚶 移动</div>
          <div style={md.detailGrid}>
            <DItem label="步行距离" value={fmtDist(ps.walkDistance)} />
            <DItem label="驾车距离" value={fmtDist(ps.rideDistance)} />
            <DItem label="游泳距离" value={fmtDist(ps.swimDistance)} />
          </div>
        </div>

        {/* 队伍对比 */}
        <div style={md.section}>
          <div style={md.sectionTitle}>👥 队伍表现</div>
          <div style={md.teamTable}>
            <div style={md.teamHdr}>
              <span style={{ width: "90px" }}>玩家</span>
              <span style={{ flex: 1, textAlign: "center" }}>击杀</span>
              <span style={{ flex: 1, textAlign: "center" }}>伤害</span>
              <span style={{ flex: 1, textAlign: "center" }}>击倒</span>
              <span style={{ flex: 1, textAlign: "center" }}>存活</span>
            </div>
            {match.teamPlayers.slice(0, 4).map((p, i) => (
              <div key={i} style={{ ...md.teamRow, background: p.name === ps.name ? "rgba(230,184,73,0.08)" : "transparent" }}>
                <span style={{ width: "90px", fontSize: "12px", color: p.name === ps.name ? "#E6B849" : "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name === ps.name ? "👤 " : ""}{p.name}
                </span>
                <span style={{ flex: 1, textAlign: "center", fontSize: "12px", color: p.kill >= 5 ? "#E6B849" : "rgba(255,255,255,0.5)", fontWeight: 600 }}>{p.kill}</span>
                <span style={{ flex: 1, textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{p.damage.toLocaleString()}</span>
                <span style={{ flex: 1, textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{p.dbno}</span>
                <span style={{ flex: 1, textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{fmtTime(p.timeSurvived)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={md.kpiBox}>
      <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontSize: "20px", fontWeight: 700, color, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>{value}</div>
    </div>
  );
}

function DItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={md.dItem}>
      <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{label}</span>
      <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginLeft: "auto" }}>{value}</span>
    </div>
  );
}

const md = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.85)", display: "flex",
    alignItems: "center", justifyContent: "center",
    padding: "16px",
  } as React.CSSProperties,

  modal: {
    background: "#1E1E1E", border: "1px solid #333333",
    borderRadius: "14px", width: "100%", maxWidth: "600px",
    maxHeight: "90vh", overflow: "auto",
  } as React.CSSProperties,

  head: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    padding: "20px 20px 16px", borderBottom: "1px solid #333333",
  } as React.CSSProperties,

  headTitle: { fontSize: "20px", fontWeight: 700, color: "#fff" },
  headSub: { fontSize: "12px", color: "rgba(255,255,255,0.5)", marginTop: "4px" },
  headDate: { fontSize: "11px", color: "rgba(255,255,255,0.5)", marginTop: "2px" },
  closeBtn: {
    background: "none", border: "none", color: "rgba(255,255,255,0.45)",
    fontSize: "18px", cursor: "pointer", padding: "4px 8px",
  },

  kpiGrid: {
    padding: "16px 20px",
    borderBottom: "1px solid #333333",
  } as React.CSSProperties,
  kpiBox: {
    background: "rgba(255,255,255,0.02)", border: "1px solid #333333",
    borderRadius: "8px", padding: "12px 8px", textAlign: "center",
  } as React.CSSProperties,

  section: {
    padding: "14px 20px", borderBottom: "1px solid #333333",
  } as React.CSSProperties,
  sectionTitle: { fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: "10px", letterSpacing: "0.5px" },

  detailGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 12px",
  } as React.CSSProperties,
  dItem: {
    display: "flex", alignItems: "center", padding: "6px 0",
    borderBottom: "1px solid rgba(255,255,255,0.02)",
  } as React.CSSProperties,

  teamTable: { display: "flex", flexDirection: "column" } as React.CSSProperties,
  teamHdr: {
    display: "flex", alignItems: "center", padding: "6px 0",
    fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.5px",
    borderBottom: "1px solid #333333",
  } as React.CSSProperties,
  teamRow: {
    display: "flex", alignItems: "center", padding: "8px 0",
    borderBottom: "1px solid rgba(255,255,255,0.02)", borderRadius: "4px",
  } as React.CSSProperties,
};
