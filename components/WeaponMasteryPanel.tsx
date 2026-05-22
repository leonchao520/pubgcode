"use client";

import type { WeaponMastery } from "@/lib/pubg";

const WEAPON_NAMES: Record<string, { name: string; emoji: string }> = {
  m16a4: { name: "M16A4", emoji: "🔫" },
  ak47: { name: "AKM", emoji: "🔫" },
  scar: { name: "SCAR-L", emoji: "🔫" },
  m416: { name: "M416", emoji: "🔫" },
  m249: { name: "M249", emoji: "🔫" },
  groza: { name: "Groza", emoji: "🔫" },
  aug: { name: "AUG", emoji: "🔫" },
  beria: { name: "Beryl M762", emoji: "🔫" },
  mutant: { name: "Mk47 Mutant", emoji: "🔫" },
  qbz: { name: "QBZ", emoji: "🔫" },
  g36c: { name: "G36C", emoji: "🔫" },
  famas: { name: "FAMAS", emoji: "🔫" },
  ace32: { name: "ACE32", emoji: "🔫" },
  k2: { name: "K2", emoji: "🔫" },
  sniper: { name: "狙击枪", emoji: "🎯" },
  kar98k: { name: "Kar98k", emoji: "🎯" },
  m24: { name: "M24", emoji: "🎯" },
  awm: { name: "AWM", emoji: "🎯" },
  win94: { name: "Win94", emoji: "🎯" },
  mini14: { name: "Mini14", emoji: "🔫" },
  sks: { name: "SKS", emoji: "🔫" },
  slr: { name: "SLR", emoji: "🔫" },
  mk14: { name: "Mk14", emoji: "🔫" },
  vss: { name: "VSS", emoji: "🔫" },
  crossbow: { name: "十字弩", emoji: "🏹" },
  shotgun: { name: "霰弹枪", emoji: "💥" },
  s686: { name: "S686", emoji: "💥" },
  s1897: { name: "S1897", emoji: "💥" },
  s12k: { name: "S12K", emoji: "💥" },
  dbs: { name: "DBS", emoji: "💥" },
  smg: { name: "冲锋枪", emoji: "⚡" },
  ump45: { name: "UMP45", emoji: "⚡" },
  vector: { name: "Vector", emoji: "⚡" },
  uzi: { name: "Micro UZI", emoji: "⚡" },
  tommy: { name: "Tommy Gun", emoji: "⚡" },
  bizon: { name: "PP-Bizon", emoji: "⚡" },
  mp5k: { name: "MP5K", emoji: "⚡" },
  mp9: { name: "MP9", emoji: "⚡" },
  p90: { name: "P90", emoji: "⚡" },
  js9: { name: "JS9", emoji: "⚡" },
  pistol: { name: "手枪", emoji: "🔫" },
  throwable: { name: "投掷物", emoji: "💣" },
  pan: { name: "平底锅", emoji: "🍳" },
  machete: { name: "砍刀", emoji: "🔪" },
  crowbar: { name: "撬棍", emoji: "🔧" },
  sickle: { name: "镰刀", emoji: "🔪" },
};

function weaponName(id: string): { name: string; emoji: string } {
  const lower = id.toLowerCase().replace("weapon_", "").replace("_c", "");
  for (const [key, val] of Object.entries(WEAPON_NAMES)) {
    if (lower.includes(key)) return val;
  }
  // 提取可读部分
  const parts = lower.split("_");
  const readable = parts.slice(0, 2).join(" ");
  return { name: readable || id, emoji: "🔫" };
}

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
        const info = weaponName(w.weaponId);
        const killPct = Math.round((w.kills / maxKill) * 100);
        return (
          <div key={w.weaponId} style={s.weaponRow}>
            <div style={s.rankCol}>
              <span style={s.rankNum}>#{i + 1}</span>
            </div>
            <div style={s.weaponInfo}>
              <div style={s.weaponName}>
                <span style={{ fontSize: "14px", marginRight: "6px" }}>{info.emoji}</span>
                {info.name}
              </div>
              <div style={s.weaponMeta}>
                {w.kills}杀 · {w.damageTotal.toLocaleString()}伤害
                {w.headshots > 0 && <> · {w.headshots}爆头</>}
              </div>
              {/* 进度条 */}
              <div style={s.progressTrack}>
                <div style={{ ...s.progressFill, width: `${killPct}%`, background: i === 0 ? "#D4A030" : i === 1 ? "#94A3B8" : "#4B5563" }} />
              </div>
            </div>
            <div style={s.xpCol}>
              <div style={s.xpValue}>Lv.{w.level}</div>
              <div style={s.xpLabel}>{w.xp.toLocaleString()} XP</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  card: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", overflow: "hidden",
  },
  header: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#fff",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  accentBar: { width: "2px", height: "16px", background: "#F97316", borderRadius: "1px" },
  weaponRow: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "12px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  rankCol: { width: "28px", flexShrink: 0 },
  rankNum: { fontSize: "11px", color: "rgba(255,255,255,0.4)", fontWeight: 600 },
  weaponInfo: { flex: 1, minWidth: 0 },
  weaponName: { fontSize: "13px", fontWeight: 600, color: "#fff", display: "flex", alignItems: "center" },
  weaponMeta: { fontSize: "11px", color: "rgba(255,255,255,0.45)", marginTop: "2px" },
  progressTrack: { height: "3px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", marginTop: "6px" },
  progressFill: { height: "100%", borderRadius: "2px", transition: "width 0.5s ease" },
  xpCol: { textAlign: "right", flexShrink: 0 },
  xpValue: { fontSize: "13px", fontWeight: 700, color: "#D4A030" },
  xpLabel: { fontSize: "10px", color: "rgba(255,255,255,0.35)", marginTop: "2px" },
};
