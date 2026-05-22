"use client";

import type { QueryResult } from "@/lib/query";
import { getSurvivalLevel } from "./PlayerHelpers";

/** 精通 Tab — 生存专精 + 武器专精 */

function Bar({ label, value, max, unit, color }: { label: string; value: number; max: number; unit: string; color: string }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "3px" }}>
        <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{label}</span>
        <span style={{ fontSize: "11px", fontWeight: 600, color }}>{value.toLocaleString()}{unit}</span>
      </div>
      <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "2px", transition: "0.3s" }} />
      </div>
    </div>
  );
}

export default function MasteryTab({ result }: { result: QueryResult }) {
  const { survivalMastery, weaponMastery } = result;

  const survival = survivalMastery;
  const weapons = weaponMastery || [];

  if (!survival && weapons.length === 0) {
    return (
      <div style={ms.empty}>
        <div style={{ fontSize: "24px", marginBottom: "8px" }}>🔒</div>
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>暂无专精数据</div>
        <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginTop: "4px" }}>首次查询后缓存 24 小时，稍后再试</div>
      </div>
    );
  }

  const survivalInfo = survival ? getSurvivalLevel(survival.xp) : null;

  return (
    <div style={ms.wrap}>
      {/* ─── 生存专精 ──────────────── */}
      {survival && (
        <div style={ms.card}>
          <div style={ms.header}>
            <span>🧟 生存专精</span>
            <span style={ms.headerMeta}>{survival.totalMatchesPlayed.toLocaleString()} 场</span>
          </div>

          {/* 等级进度 */}
          <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "16px",
              background: "linear-gradient(135deg, #22D3EE, #0891B2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{survival.level}</div>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.7)" }}>Lv.{survival.level}</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                {survivalInfo?.title || "未定级"}
              </div>
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                XP {survival.xp.toLocaleString()} · Tier {survival.tier}
              </div>
              <div style={{ marginTop: "8px", height: "4px", background: "rgba(255,255,255,0.08)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((survival.level % 100) / 100) * 100}%`, background: "#22D3EE", borderRadius: "2px" }} />
              </div>
            </div>
          </div>

          {/* 生存数据 */}
          {survival.stats && (
            <div style={{ padding: "0 16px 14px" }}>
              <Bar label="总伤害" value={survival.stats.damageDealt || 0} max={500000} unit="" color="#d4a030" />
              <Bar label="承受伤害" value={survival.stats.damageTaken || 0} max={500000} unit="" color="#f87171" />
              <Bar label="徒步距离" value={Math.round((survival.stats.distanceOnFoot || 0) / 1000)} max={1000} unit="km" color="#4ade80" />
              <Bar label="载具距离" value={Math.round((survival.stats.distanceByVehicle || 0) / 1000)} max={2000} unit="km" color="#60a5fa" />
              <Bar label="游泳距离" value={Math.round((survival.stats.distanceBySwimming || 0) / 1000)} max={10} unit="km" color="#22d3ee" />
              <Bar label="治疗次数" value={survival.stats.heals || 0} max={5000} unit="" color="#f0c040" />
              <Bar label="强化次数" value={survival.stats.boosts || 0} max={5000} unit="" color="#c4a6ff" />
              <Bar label="载具摧毁" value={survival.stats.vehiclesDestroyed || 0} max={100} unit="" color="#f472b6" />
            </div>
          )}
        </div>
      )}

      {/* ─── 武器专精 ──────────────── */}
      {weapons.length > 0 && (
        <div style={ms.card}>
          <div style={ms.header}>
            <span>🔫 武器专精</span>
            <span style={ms.headerMeta}>{weapons.length} 种武器</span>
          </div>
          <div style={{ padding: "8px 16px 14px" }}>
            {weapons.slice(0, 8).map((w: any) => {
              const name = w.weaponId?.replace(/^Weapon_/, "").replace(/_C$/, "") || "?";
              const lvl = w.level || 1;
              const lvlPct = Math.min((lvl / 100) * 100, 100);
              return (
                <div key={w.weaponId} style={{ marginBottom: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#fff" }}>{name}</span>
                    <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                      Lv.{lvl} · {w.kills || 0} 击杀
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${lvlPct}%`, background: "#d4a030", borderRadius: "2px" }} />
                  </div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
                      爆头率 {w.hitRatio || 0}%
                    </span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
                      最长 {w.longestDefeat || 0}m
                    </span>
                    <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>
                      伤害 {((w.damageTotal || 0) / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const ms = {
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
  empty: {
    background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "8px", padding: "32px", textAlign: "center",
  } as React.CSSProperties,
};
