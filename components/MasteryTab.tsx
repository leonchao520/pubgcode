"use client";

import { useState } from "react";
import type { QueryResult } from "@/lib/query";
import type { WeaponMastery } from "@/lib/pubg";
import { getWeaponCategory, getWeaponName, getWeaponEmoji, getMasteryTierLabel, WEAPON_CATEGORIES, type WeaponCategory } from "@/lib/weapon-categories";

/* ═══════════════════════════════════════════
   精通 Tab — 武器专精（分类 + 卡片 + 详情弹窗）
   ═══════════════════════════════════════════ */

/* ─── 武器详情弹窗 ─────────────────────── */
function WeaponDetailModal({ weapon, onClose }: { weapon: WeaponMastery; onClose: () => void }) {
  const name = getWeaponName(weapon.weaponId);
  const tierLabel = getMasteryTierLabel(weapon.tier);

  const rows = [
    { label: "累计淘汰玩家", value: weapon.kills.toLocaleString() },
    { label: "累计击倒玩家", value: (weapon.dbnoTotal || 0).toLocaleString() },
    { label: "累计造成伤害", value: weapon.damageTotal.toLocaleString() },
    { label: "累计爆头次数", value: weapon.headshots.toLocaleString() },
    { label: "单局最多淘汰", value: weapon.mostDefeatsInGame.toLocaleString() },
    { label: "单局最多击倒", value: (weapon.mostDbnoInGame || 0).toLocaleString() },
    { label: "最远淘汰距离", value: `${weapon.longestDefeat}m` },
    { label: "累计命中次数", value: weapon.hitsTotal.toLocaleString() },
    { label: "命中率", value: `${weapon.hitRatio || 0}%` },
    { label: "总开火次数", value: weapon.shotsFired.toLocaleString() },
    { label: "累计淘汰", value: weapon.defeats.toLocaleString() },
  ];

  return (
    <div style={md.overlay} onClick={onClose}>
      <div style={md.modal} onClick={e => e.stopPropagation()}>
        <div style={md.head}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={md.icon}>
              <img
                src={`/assets/weapons/${weapon.weaponId}.png`}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
            <div>
              <div style={md.wpnName}>{name}</div>
              <div style={md.wpnTier}>{tierLabel} · Lv.{weapon.level}</div>
            </div>
          </div>
          <button onClick={onClose} style={md.closeBtn}>✕</button>
        </div>
        <div style={md.body}>
          {rows.map((r, i) => (
            <div key={i} style={md.row}>
              <span style={md.rowLabel}>{r.label}</span>
              <span style={md.rowValue}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════ */

export default function MasteryTab({ result }: { result: QueryResult }) {
  const { weaponMastery } = result;
  const weapons: WeaponMastery[] = weaponMastery || [];

  const [filter, setFilter] = useState<WeaponCategory | "all">("all");
  const [selectedWeapon, setSelectedWeapon] = useState<WeaponMastery | null>(null);

  if (weapons.length === 0) {
    return (
      <div style={ms.empty}>
        <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</div>
        <div style={{ fontSize: "14px", color: "#A3A3A3", marginBottom: "4px" }}>暂无武器专精数据</div>
        <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>PUBG API 限流中，请稍后刷新重试</div>
      </div>
    );
  }

  // 按分类过滤武器
  const allWeapons = [...weapons].sort((a, b) => b.kills - a.kills);
  const filteredWeapons = filter === "all"
    ? allWeapons
    : allWeapons.filter(w => getWeaponCategory(w.weaponId) === filter);

  // 每个分类的数量
  const catCounts: Record<string, number> = {};
  allWeapons.forEach(w => {
    const cat = getWeaponCategory(w.weaponId);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  return (
    <div style={ms.wrap}>
      {/* ─── 武器专精 ──────────────── */}
      <div style={ms.card}>
        <div style={ms.header}>
          <span>🔫 武器精通</span>
          <span style={ms.headerMeta}>{weapons.length} 种武器</span>
        </div>

        {/* 分类筛选栏 */}
        <div style={ms.filterBar}>
          <button
            onClick={() => setFilter("all")}
            style={{ ...ms.filterBtn, ...(filter === "all" ? ms.filterBtnActive : {}) }}
          >
            全部 ({weapons.length})
          </button>
          {WEAPON_CATEGORIES.map(cat => {
            const count = catCounts[cat.key] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat.key}
                onClick={() => setFilter(cat.key)}
                style={{ ...ms.filterBtn, ...(filter === cat.key ? ms.filterBtnActive : {}) }}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        {/* 武器卡片网格 */}
        {filteredWeapons.length > 0 ? (
          <div className="weapon-grid-resp">
            {filteredWeapons.map(w => {
              const name = getWeaponName(w.weaponId);
              const emoji = getWeaponEmoji(w.weaponId);
              const tierLabel = getMasteryTierLabel(w.tier);
              return (
                <div
                  key={w.weaponId}
                  style={ms.weaponCard}
                  onClick={() => setSelectedWeapon(w)}
                >
                  <div style={ms.weaponIcon}>
                    <img
                      src={`/assets/weapons/${w.weaponId}.png`}
                      alt={name}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                      onError={e => {
                        const t = e.target as HTMLImageElement;
                        t.style.display = "none";
                        t.parentElement!.innerHTML = `<span style="font-size:24px">${emoji}</span>`;
                      }}
                    />
                    <span style={{ fontSize: "24px", display: "none" }} className="weapon-emoji-fallback">{emoji}</span>
                  </div>
                  <div style={ms.weaponInfo}>
                    <div style={ms.weaponName}>{name}</div>
                    <div style={ms.weaponMeta}>
                      {w.kills.toLocaleString()} 淘汰 · {w.longestDefeat}m
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={ms.weaponLevel}>{tierLabel}</div>
                    <div style={ms.weaponLv}>Lv.{w.level}</div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "40px 0", textAlign: "center", color: "#A3A3A3", fontSize: "13px" }}>
            该分类暂无武器数据
          </div>
        )}

        {/* 武器总数统计 */}
        <div style={ms.footer}>
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <span style={ms.footerStat}>
              <span style={{ color: "#E6B849" }}>{allWeapons.reduce((s, w) => s + w.kills, 0).toLocaleString()}</span>
              <span style={{ color: "#A3A3A3", marginLeft: "4px" }}>总淘汰</span>
            </span>
            <span style={ms.footerStat}>
              <span style={{ color: "#E6B849" }}>{allWeapons.length}</span>
              <span style={{ color: "#A3A3A3", marginLeft: "4px" }}>种武器</span>
            </span>
            <span style={ms.footerStat}>
              <span style={{ color: "#E6B849" }}>{allWeapons.reduce((s, w) => s + w.damageTotal, 0).toLocaleString()}</span>
              <span style={{ color: "#A3A3A3", marginLeft: "4px" }}>总伤害</span>
            </span>
          </div>
        </div>
      </div>

      {/* ─── 武器详情弹窗 ──────────── */}
      {selectedWeapon && (
        <WeaponDetailModal
          weapon={selectedWeapon}
          onClose={() => setSelectedWeapon(null)}
        />
      )}
    </div>
  );
}

/* ─── 样式 ────────────────────────────── */

const ms: Record<string, React.CSSProperties> = {
  wrap: { display: "flex", flexDirection: "column", gap: "12px" },

  card: {
    background: "#1E1E1E", border: "1px solid #333333",
    borderRadius: "8px", overflow: "hidden",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 16px", borderBottom: "1px solid #333333",
    fontSize: "14px", fontWeight: 600, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  headerMeta: { fontSize: "11px", color: "#A3A3A3", fontWeight: 400 },

  empty: {
    background: "#1E1E1E", border: "1px solid #333333",
    borderRadius: "8px", padding: "40px 20px", textAlign: "center",
  },

  filterBar: {
    display: "flex", gap: "2px", borderBottom: "1px solid #333333",
    padding: "6px 8px", overflowX: "auto",
    msOverflowStyle: "none", scrollbarWidth: "none",
  } as React.CSSProperties,
  filterBtn: {
    padding: "8px 14px", fontSize: "12px", background: "transparent",
    color: "#A3A3A3", border: "none", cursor: "pointer",
    whiteSpace: "nowrap", borderRadius: "4px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,
  filterBtnActive: {
    color: "#E6B849", fontWeight: 600,
    background: "rgba(230,184,73,0.08)",
  } as React.CSSProperties,

  weaponGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px",
    padding: "14px",
  },

  weaponCard: {
    background: "rgba(255,255,255,0.02)",
    border: "1px solid #333333", borderRadius: "8px",
    padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px",
    cursor: "pointer", transition: "background 0.15s, border-color 0.15s",
  },

  weaponIcon: {
    width: "44px", height: "36px", borderRadius: "6px",
    background: "rgba(255,255,255,0.04)",
    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
  },

  weaponInfo: { flex: 1, minWidth: 0 },

  weaponName: {
    fontSize: "13px", fontWeight: 600, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },

  weaponMeta: {
    fontSize: "11px", color: "#A3A3A3", marginTop: "2px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },

  weaponLevel: {
    fontSize: "13px", color: "#E6B849", fontWeight: 700,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    lineHeight: 1.3,
  },

  weaponLv: {
    fontSize: "10px", color: "#A3A3A3",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  footer: {
    padding: "12px 16px", borderTop: "1px solid #333333",
    display: "flex", alignItems: "center",
  },
  footerStat: {
    fontSize: "12px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

const md: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 100,
    background: "rgba(0,0,0,0.7)", display: "flex",
    alignItems: "center", justifyContent: "center",
    padding: "20px",
    backdropFilter: "blur(4px)",
  },
  modal: {
    background: "#1E1E1E", border: "1px solid #333333",
    borderRadius: "12px", width: "100%", maxWidth: "440px",
    maxHeight: "80vh", overflow: "hidden",
    display: "flex", flexDirection: "column",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  },
  head: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px", borderBottom: "1px solid #333333",
  },
  icon: {
    width: "56px", height: "44px", borderRadius: "8px",
    background: "rgba(255,255,255,0.04)", flexShrink: 0,
    overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
  },
  wpnName: {
    fontSize: "18px", fontWeight: 700, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  wpnTier: {
    fontSize: "13px", color: "#E6B849", fontWeight: 600, marginTop: "2px",
  },
  closeBtn: {
    background: "none", border: "none", color: "#A3A3A3",
    fontSize: "18px", cursor: "pointer", padding: "4px 8px",
    borderRadius: "4px",
  },
  body: {
    padding: "16px 20px", overflowY: "auto",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  row: {
    display: "flex", justifyContent: "space-between",
    padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  rowLabel: {
    fontSize: "13px", color: "#A3A3A3",
  },
  rowValue: {
    fontSize: "13px", fontWeight: 600, color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};
