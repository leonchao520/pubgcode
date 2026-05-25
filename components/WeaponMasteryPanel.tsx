"use client";

import type { WeaponMastery } from "@/lib/pubg";
import { getWeaponName, getMasteryTierLabel } from "@/lib/weapon-categories";

/** 概览 Tab 内嵌的武器专精 Top 5 — 简洁版 */

export default function WeaponMasteryPanel({ weapons }: { weapons: WeaponMastery[] }) {
  if (!weapons || weapons.length === 0) return null;

  const top5 = weapons.slice(0, 5);
  const maxKill = Math.max(...top5.map(w => w.kills), 1);

  return (
    <div style={s.card}>
      <div style={s.header}>
        <div style={s.accentBar} />
        <span>🔫 武器专精 Top 5</span>
      </div>

      {top5.map((w, i) => {
        const name = getWeaponName(w.weaponId);
        const tierLabel = getMasteryTierLabel(w.tier);
        const killPct = Math.round((w.kills / maxKill) * 100);

        return (
          <div key={w.weaponId} style={s.weaponRow}>
            {/* 排名 */}
            <div style={s.rankCol}>
              <span style={s.rankNum}>#{i + 1}</span>
            </div>

            {/* 图标 */}
            <div style={s.weaponIcon}>
              <img
                src={`/assets/weapons/${w.weaponId}.png`}
                alt={name}
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>

            {/* 信息 */}
            <div style={s.weaponInfo}>
              <div style={s.weaponName}>{name}</div>
              <div style={s.weaponMeta}>
                {w.kills} 杀 · {w.damageTotal.toLocaleString()} 伤害
                {w.headshots > 0 && <> · {w.headshots} 爆头</>}
              </div>
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${killPct}%`, background: i === 0 ? "#E6B849" : i === 1 ? "#94A3B8" : "#4B5563" }} />
              </div>
            </div>

            {/* 等级 */}
            <div style={s.xpCol}>
              <div style={s.xpValue}>{tierLabel}</div>
              <div style={s.xpLabel}>Lv.{w.level}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: "#1E1E1E", border: "1px solid #333333",
    borderRadius: "8px", overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#fff",
    borderBottom: "1px solid #333333",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  accentBar: { width: "2px", height: "16px", background: "#E6B849", borderRadius: "1px" },

  weaponRow: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "12px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  rankCol: { width: "24px", flexShrink: 0 },
  rankNum: { fontSize: "11px", color: "#A3A3A3", fontWeight: 600 },

  weaponIcon: {
    width: "40px", height: "32px", borderRadius: "6px",
    background: "rgba(255,255,255,0.04)", flexShrink: 0,
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
  },

  weaponInfo: { flex: 1, minWidth: 0 },
  weaponName: {
    fontSize: "13px", fontWeight: 600, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  weaponMeta: {
    fontSize: "11px", color: "#A3A3A3", marginTop: "2px",
  },
  progressTrack: { height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", marginTop: "6px" },
  progressFill: { height: "100%", borderRadius: "2px", transition: "width 0.5s ease" },

  xpCol: { textAlign: "right", flexShrink: 0 },
  xpValue: { fontSize: "13px", fontWeight: 700, color: "#E6B849" },
  xpLabel: { fontSize: "10px", color: "#A3A3A3", marginTop: "2px" },
};
