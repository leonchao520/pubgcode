"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { QueryResult } from "@/lib/query";
import { getSurvivalLevel, getTierColor, getTierLabel, getSubTierLabel, getTierImage } from "./PlayerHelpers";

/* ═══════════════════════════════════════════
   玩家战绩总览页 — /player/[name]
   设计参考 PUBG.HK 风格，适配 PUBG.BAR 暗色主题
   ═══════════════════════════════════════════ */

type Props = {
  initialName: string;
  initialResult: QueryResult | null;
};

const FAV_KEY = "pubgbar_favorites";

function loadFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}
function saveFavorites(list: string[]) {
  localStorage.setItem(FAV_KEY, JSON.stringify(list));
}

export default function PlayerOverview({ initialName, initialResult }: Props) {
  const router = useRouter();
  const [input, setInput] = useState(initialName);
  const [result, setResult] = useState<QueryResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favHydrated, setFavHydrated] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setFavHydrated(true);
  }, []);

  const pubg = result?.pubg;
  const steam = result?.steam;
  const clan = result?.clan;
  const { normalStats, rankedStats, lifetimeStats, survivalMastery, recentMatches } = result || {};

  const isFav = pubg ? favorites.includes(pubg.name.toLowerCase()) : false;

  const toggleFav = useCallback(() => {
    if (!pubg) return;
    const key = pubg.name.toLowerCase();
    const next = isFav
      ? favorites.filter(f => f !== key)
      : [...favorites, key];
    setFavorites(next);
    saveFavorites(next);
  }, [pubg, isFav, favorites]);

  function handleSearch() {
    const q = input.trim();
    if (!q || q.length < 2) {
      setError("请输入玩家昵称或 Steam ID");
      return;
    }
    setError("");
    setLoading(true);
    router.push(`/player/${encodeURIComponent(q)}`);
    fetch(`/api/query?q=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setError(data.error); setResult(null); }
        else { setResult(data); setError(""); }
      })
      .catch(() => setError("网络错误"))
      .finally(() => setLoading(false));
  }

  // 段位数据
  const rankedModeEntry = rankedStats ? Object.entries(rankedStats.stats)[0] : null;
  const rankedData = rankedModeEntry ? rankedModeEntry[1] : null;
  const tierInfo = rankedData?.currentTier || lifetimeStats?.currentTier || null;
  const modeLabel = rankedModeEntry ? formatMode(rankedModeEntry[0]) : null;
  const rankPoints = rankedData?.rankPoints || 0;
  const bestRP = result?.bestRankPoints || 0;

  // 本赛季普通模式：取 squad-fpp > squad > 场次最多的模式
  const nsModes = Object.entries(normalStats?.stats || {});
  const seasonStats =
    normalStats?.stats?.["squad-fpp"] ||
    normalStats?.stats?.["squad"] ||
    (nsModes.length > 0 ? nsModes.sort((a, b) => (b[1].matches || 0) - (a[1].matches || 0))[0][1] : null);

  // 场均数据
  // avgRank：取非零值，优先赛季普通 > 竞技 > 生涯
  const avgRank = (seasonStats?.avgRank && seasonStats.avgRank > 0) ? seasonStats.avgRank
    : (rankedData?.avgRank && rankedData.avgRank > 0) ? rankedData.avgRank
    : (lifetimeStats?.avgRank && lifetimeStats.avgRank > 0) ? lifetimeStats.avgRank : null;

  // K/D 和 场均伤害：优先竞技 > 普通赛季 > 生涯 > 汇总兜底
  const calcKD = (kills: number, matches: number, wins: number) => {
    const deaths = matches - (wins || 0);
    return deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? String(kills) : "?";
  };
  const getKD = (s: any) => s?.matches >= 5 ? calcKD(s.kills, s.matches, s.wins) : null;
  const getAvgDmg = (s: any) => s?.matches >= 5 ? Math.round(s.damageDealt / s.matches) : null;

  // 汇总赛季数据（所有模式）
  const allKills = nsModes.reduce((s, [,v]) => s + (v.kills || 0), 0) + Object.values(rankedStats?.stats || {}).reduce((s, v) => s + (v.kills || 0), 0);
  const allMatches = nsModes.reduce((s, [,v]) => s + (v.matches || 0), 0) + Object.values(rankedStats?.stats || {}).reduce((s, v) => s + (v.matches || 0), 0);
  const allWins = nsModes.reduce((s, [,v]) => s + (v.wins || 0), 0) + Object.values(rankedStats?.stats || {}).reduce((s, v) => s + (v.wins || 0), 0);
  const allDmg = nsModes.reduce((s, [,v]) => s + (v.damageDealt || 0), 0) + Object.values(rankedStats?.stats || {}).reduce((s, v) => s + (v.damageDealt || 0), 0);

  // 优先级：竞技 > 普通赛季 > 生涯 > 汇总
  const kd = getKD(rankedData) || getKD(seasonStats) || getKD(lifetimeStats) || (allMatches > 0 ? calcKD(allKills, allMatches, allWins) : "?");
  const avgDamage = getAvgDmg(rankedData) || getAvgDmg(seasonStats) || getAvgDmg(lifetimeStats) || (allMatches > 0 ? Math.round(allDmg / allMatches) : null);

  // 总场次：优先 survivalMastery.totalMatchesPlayed（生涯总计），兜底 lifetimeStats.matches
  const totalMatches = survivalMastery?.totalMatchesPlayed || lifetimeStats?.matches || 0;

  // 满级进度（直接用 API 返回的真实等级，不用 getSurvivalLevel 推算）
  const realLevel = survivalMastery?.level || 0;
  const masteryProgress = realLevel > 0 ? ((realLevel / 500) * 100).toFixed(1) : null;

  const tabs = ["overview", "season", "stats", "mastery", "matches"] as const;
  const tabNames: Record<string, string> = {
    overview: "概览", season: "赛季", stats: "统计",
    mastery: "精通", matches: "战绩",
  };

  return (
    <div style={st.page}>
      <div style={st.container}>
        {/* ─── 搜索栏 ──────────────── */}
        <div style={st.searchWrap}>
          <a href="/" style={st.backLink} title="返回首页">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </a>
          <div style={st.searchBox}>
            <svg style={st.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={input}
              onChange={e => { setInput(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="输入玩家昵称或 Steam ID..."
              style={st.searchInput}
              spellCheck={false}
            />
            <button onClick={handleSearch} disabled={loading} style={searchBtnStyle(input, loading)}>
              {loading ? "查询中..." : "查询"}
            </button>
          </div>
        </div>

        {/* ─── Tab 栏 ──────────────── */}
        <div style={st.tabBar}>
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              style={activeTab === t ? st.tabActive : st.tab}
            >
              {tabNames[t]}
            </button>
          ))}
        </div>

        {error && <p style={st.error}>{error}</p>}
        {loading && (
          <div style={st.loadingCard}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4A030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" style={{margin: "0 auto 12px", display: "block"}}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
            <p style={st.loadingText}>查询中...</p>
          </div>
        )}

        {result && !loading && !result.error && !result.pubg && result.steam && (
          <div style={st.card}>
            <div style={st.heroRowSimple}>
              {result.steam.avatarUrl && <img src={result.steam.avatarUrl} alt="" style={st.avatar} />}
              <div>
                <div style={st.steamName}>{result.steam.personaName}</div>
                <div style={st.steamId}>{result.steam.steamId}</div>
              </div>
            </div>
            <div style={st.emptyNote}>该 Steam 账号未绑定 PUBG 数据，或昵称与 PUBG 内不一致。</div>
          </div>
        )}

        {result && !loading && pubg && activeTab === "overview" && (
          <div style={st.content}>
            {/* ─── 个人信息 ──────────── */}
            <div style={st.card}>
              <div style={st.profileHeader}>
                <div style={st.profileLeft}>
                  {steam?.avatarUrl && <img src={steam.avatarUrl} alt="" style={st.avatar} />}
                  <div style={st.profileInfoCol}>
                    {/* 名字行：平台图标 + 名字 + 收藏 */}
                    <div style={st.nameRow}>
                      {/* Steam 平台图标 */}
                      {steam && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <title>Steam</title>
                          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
                          <path d="M16.5 8.5l-5.283 2.223a2.5 2.5 0 0 0-3.467.527 2.5 2.5 0 1 0 3.941 3.009l2.228 3.09a1.25 1.25 0 0 0 1.723.268l1.807-1.303a1.25 1.25 0 0 0 .268-1.723l-2.228-3.09 2.645-1.113a.4.4 0 0 0 .218-.522l-.925-2.197a.4.4 0 0 0-.522-.218L16.5 8.5z" fill="rgba(255,255,255,0.5)"/>
                        </svg>
                      )}
                      {/* PUBG 平台图标（非 Steam） */}
                      {!steam && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                          <title>PUBG</title>
                          <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5"/>
                          <text x="12" y="16" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="9" fontWeight="700">PUBG</text>
                        </svg>
                      )}
                      <div style={st.profileName}>{pubg.name}</div>
                      {/* 收藏按钮 */}
                      {favHydrated && (
                        <button onClick={toggleFav} style={st.favBtn} title={isFav ? "取消收藏" : "收藏"}>
                          {isFav ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="#D4A030" stroke="#D4A030" strokeWidth="1.5">
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" style={{ transition: "0.15s" }}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                    {/* 等级 + 公会行 */}
                    <div style={st.profileMeta}>
                      {survivalMastery && (
                        <span style={st.levelTag}>
                          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M10 1L1 6v8l9 5 9-5V6L10 1z" stroke="#22D3EE" strokeWidth="1.5" fill="none"/>
                            <text x="10" y="13" textAnchor="middle" fill="#22D3EE" fontSize="7" fontWeight="700">L</text>
                          </svg>
                          Lv.{survivalMastery.level}
                          <span style={st.survivalTitle}>{getSurvivalLevel(survivalMastery.xp).title}</span>
                        </span>
                      )}
                      {clan && (
                        <span style={st.clanTag} title={clan.name}>
                          [{clan.tag}] {clan.name}
                        </span>
                      )}
                      {steam?.personaName && pubg.name !== steam.personaName && (
                        <span style={st.steamTag}>{steam.personaName}</span>
                      )}
                    </div>
                  </div>
                </div>
                <StatusBadge banType={pubg.banType} />
              </div>
            </div>

            {/* ─── 核心 KPI ──────────── */}
            <div style={st.card}>
              <div style={st.kpiRow}>
                {steam ? (
                  <KpiBox
                    label="近14天活跃"
                    value={`${Math.floor(steam.pubgPlaytime2wMinutes / 60)}h`}
                    color="#4ADE80"
                  />
                ) : (
                  <KpiBox
                    label="本赛季场次"
                    value={seasonStats?.matches ? String(seasonStats.matches) : "?"}
                    color="#4ADE80"
                  />
                )}
                <KpiBox
                  label="总场次"
                  value={totalMatches > 0 ? totalMatches.toLocaleString() : "?"}
                  color="#D4A030"
                />
                <KpiBox
                  label="满级进度"
                  value={masteryProgress ? `${masteryProgress}%` : "?"}
                  color="#22D3EE"
                />
              </div>
              <div style={st.timeRow}>
                <span>更新时间: {new Date().toLocaleString("zh-CN", { hour12: false })}</span>
                {recentMatches && recentMatches.length > 0 && (
                  <span>最近对局: {recentMatches[0].createdAt.slice(0, 10)}</span>
                )}
              </div>
            </div>

            {/* ─── 段位信息 ──────────── */}
            <div style={st.card}>
              <div style={st.rankHeader}>
                <div style={st.rankLeft}>
                  {tierInfo ? (
                    <img
                      src={getTierImage(tierInfo.tier, tierInfo.subTier)}
                      alt={`${getTierLabel(tierInfo.tier)} ${getSubTierLabel(tierInfo.subTier)}`}
                      style={st.rankIcon}
                    />
                  ) : (
                    <img
                      src="/assets/tiers/Unranked.png"
                      alt="未定级"
                      style={st.rankIcon}
                    />
                  )}
                  <div>
                    <div style={st.rankName}>
                      {tierInfo ? `${getTierLabel(tierInfo.tier)} ${getSubTierLabel(tierInfo.subTier)}` : "未定级"}
                    </div>
                    <div style={st.rankMode}>{modeLabel || "暂无段位数据"}</div>
                  </div>
                </div>
                <div style={st.rpInfo}>
                  <div style={st.rpItem}>
                    <div style={st.rpLabel}>当前 RP</div>
                    <div style={st.rpValue}>{rankPoints > 0 ? rankPoints : "?"}</div>
                  </div>
                  <div style={st.rpItem}>
                    <div style={st.rpLabel}>最高 RP</div>
                    <div style={st.rpValue}>{bestRP > 0 ? bestRP : rankPoints > 0 ? rankPoints : "?"}</div>
                  </div>
                </div>
              </div>

              <div style={st.statsRow}>
                <div style={st.statItem}>
                  <div style={st.statValue}>
                    {avgRank != null ? avgRank.toFixed(1) : "?"}
                  </div>
                  <div style={st.statLabel}>平均排名</div>
                </div>
                <div style={st.statDivider} />
                <div style={st.statItem}>
                  <div style={st.statValue}>{kd}</div>
                  <div style={st.statLabel}>K/D</div>
                </div>
                <div style={st.statDivider} />
                <div style={st.statItem}>
                  <div style={st.statValue}>
                    {avgDamage != null ? avgDamage.toLocaleString() : "?"}
                  </div>
                  <div style={st.statLabel}>平均伤害</div>
                </div>
              </div>
            </div>

            {/* ─── 底部提示 ──────────── */}
            <div style={st.footer}>
              <span>ℹ️</span> 封禁状态及公会信息存在数小时延迟。
            </div>
          </div>
        )}

        {/* 暂无数据 */}
        {!loading && result?.error && (
          <div style={st.card}>
            <div style={st.emptyNote}>{result.error}</div>
          </div>
        )}
        {!loading && !result && !error && (
          <div style={st.card}>
            <div style={st.emptyNote}>输入玩家昵称开始查询</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── 子组件 ───────────────────────────── */

function StatusBadge({ banType }: { banType: string }) {
  const clean = banType === "Innocent";
  return (
    <span style={{
      padding: "6px 14px",
      borderRadius: "6px",
      fontSize: "13px",
      fontWeight: 700,
      background: clean ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
      color: clean ? "#4ADE80" : "#F87171",
      border: `1px solid ${clean ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
    }}>
      {clean ? "正常" : banType}
    </span>
  );
}

function KpiBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={st.kpiBox}>
      <div style={{ ...st.kpiNumber, color }}>{value}</div>
      <div style={st.kpiLabel}>{label}</div>
    </div>
  );
}

/* ─── 工具函数 ─────────────────────────── */

function searchBtnStyle(hasVal: string, loading: boolean): React.CSSProperties {
  const active = hasVal.trim() && !loading;
  return {
    position: "absolute", right: "4px", top: "50%", transform: "translateY(-50%)",
    padding: "8px 20px",
    background: active ? "#D4A030" : "transparent",
    color: active ? "#000" : "rgba(255,255,255,0.4)",
    border: active ? "none" : "1px solid rgba(255,255,255,0.15)",
    borderRadius: "8px", fontSize: "13px", fontWeight: 600,
    cursor: active ? "pointer" : "default",
    transition: "0.15s ease",
  };
}

function formatMode(mode: string): string {
  const map: Record<string, string> = {
    "squad-fpp": "四排-FPP", "squad": "四排-TPP",
    "duo-fpp": "双排-FPP", "duo": "双排-TPP",
    "solo-fpp": "单排-FPP", "solo": "单排-TPP",
  };
  return map[mode] || mode;
}

/* ─── 样式 ─────────────────────────────── */

const st: Record<string, React.CSSProperties> = {
  page: {
    backgroundColor: "#121212", color: "#e0e0e0", minHeight: "100vh",
    padding: "20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  container: {
    maxWidth: "960px", margin: "0 auto",
    display: "flex", flexDirection: "column", gap: "12px",
  },

  // 搜索栏
  searchWrap: {
    display: "flex", alignItems: "center", gap: "10px",
    marginBottom: "8px",
  },
  backLink: {
    color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center",
    textDecoration: "none", flexShrink: 0,
  },
  searchBox: {
    flex: 1, position: "relative", maxWidth: "600px",
  },
  searchIcon: {
    position: "absolute", left: "14px", top: "50%",
    transform: "translateY(-50%)", width: "16px", height: "16px",
    color: "rgba(255,255,255,0.3)", pointerEvents: "none", zIndex: 1,
  },
  searchInput: {
    width: "100%", padding: "14px 110px 14px 42px",
    backgroundColor: "#1a1a1a", color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px",
    fontSize: "15px", outline: "none", boxSizing: "border-box",
  },

  // Tab
  tabBar: {
    display: "flex", gap: "0",
    background: "#1a1a1a", borderRadius: "8px",
    overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)",
  },
  tab: {
    flex: 1, padding: "12px", textAlign: "center",
    background: "transparent", color: "rgba(255,255,255,0.5)",
    border: "none", borderBottom: "2px solid transparent",
    fontSize: "13px", fontWeight: 500, cursor: "pointer",
    transition: "0.15s ease",
  },
  tabActive: {
    flex: 1, padding: "12px", textAlign: "center",
    background: "#222", color: "#D4A030",
    border: "none", borderBottom: "2px solid #D4A030",
    fontSize: "13px", fontWeight: 600, cursor: "pointer",
    transition: "0.15s ease",
  },

  // 内容区
  content: {
    display: "flex", flexDirection: "column", gap: "10px",
  },

  // 卡片
  card: {
    backgroundColor: "#1a1a1a", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  // 个人信息
  profileHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px",
  },
  profileLeft: {
    display: "flex", alignItems: "center", gap: "14px",
    flex: 1, minWidth: 0,
  },
  profileInfoCol: {
    flex: 1, minWidth: 0,
  },
  nameRow: {
    display: "flex", alignItems: "center", gap: "8px",
  },
  profileName: {
    fontSize: "22px", fontWeight: 700, color: "#fff",
  },
  favBtn: {
    background: "none", border: "none", cursor: "pointer",
    padding: "2px", display: "flex", alignItems: "center",
    flexShrink: 0,
  },
  profileMeta: {
    display: "flex", alignItems: "center", gap: "8px", marginTop: "4px",
    flexWrap: "wrap",
  },
  avatar: {
    width: "48px", height: "48px", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.12)", flexShrink: 0,
  },
  levelTag: {
    fontSize: "12px", fontWeight: 600, color: "#22D3EE",
    background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)",
    borderRadius: "5px", padding: "2px 8px",
    display: "inline-flex", alignItems: "center", gap: "4px",
  },
  survivalTitle: {
    color: "rgba(255,255,255,0.5)", fontWeight: 400,
  },
  clanTag: {
    fontSize: "12px", fontWeight: 500, color: "#f0c040",
    background: "rgba(240,192,64,0.1)", border: "1px solid rgba(240,192,64,0.15)",
    borderRadius: "5px", padding: "2px 8px",
  },
  steamTag: {
    fontSize: "11px", color: "rgba(255,255,255,0.5)",
  },

  // KPI 行
  kpiRow: {
    display: "flex", justifyContent: "space-around",
    padding: "24px 20px 16px",
  },
  kpiBox: {
    textAlign: "center",
  },
  kpiNumber: {
    fontSize: "28px", fontWeight: 700, marginBottom: "4px",
  },
  kpiLabel: {
    fontSize: "13px", color: "rgba(255,255,255,0.45)",
  },
  timeRow: {
    display: "flex", justifyContent: "space-between",
    padding: "0 20px 16px", fontSize: "12px",
    color: "rgba(255,255,255,0.35)",
    borderTop: "1px solid rgba(255,255,255,0.04)",
    paddingTop: "10px",
  },

  // 段位
  rankHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 20px 0",
  },
  rankLeft: {
    display: "flex", alignItems: "center", gap: "14px",
  },
  rankIconWrap: {
    width: "56px", height: "56px", borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  rankIcon: {
    width: "56px", height: "56px", borderRadius: "12px",
    flexShrink: 0,
  },
  rankIconLabel: {
    fontSize: "20px", fontWeight: 700, color: "#000",
  },
  rankName: {
    fontSize: "22px", fontWeight: 700, color: "#fff",
  },
  rankMode: {
    fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "2px",
  },
  rpInfo: {
    textAlign: "right",
  },
  rpItem: {
    marginBottom: "6px",
  },
  rpLabel: {
    fontSize: "12px", color: "rgba(255,255,255,0.45)",
  },
  rpValue: {
    fontSize: "22px", fontWeight: 700, color: "#D4A030",
  },

  // 场均数据
  statsRow: {
    display: "flex", justifyContent: "space-around", alignItems: "center",
    padding: "24px 20px", borderTop: "1px solid rgba(255,255,255,0.06)",
    marginTop: "16px",
  },
  statItem: {
    textAlign: "center",
  },
  statValue: {
    fontSize: "26px", fontWeight: 700, color: "#D4A030",
    marginBottom: "4px",
  },
  statLabel: {
    fontSize: "13px", color: "rgba(255,255,255,0.45)",
  },
  statDivider: {
    width: "1px", height: "32px", background: "rgba(255,255,255,0.08)",
  },

  // 底部
  footer: {
    padding: "12px 0", fontSize: "12px", color: "rgba(255,255,255,0.35)",
    textAlign: "center",
  },

  // 错误 & 空
  error: {
    color: "#f87171", fontSize: "13px", textAlign: "center",
    padding: "8px 0",
  },
  loadingCard: {
    backgroundColor: "#1a1a1a", borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: "40px 20px", textAlign: "center",
  },
  loadingText: {
    fontSize: "13px", color: "rgba(255,255,255,0.4)",
  },
  emptyNote: {
    padding: "32px 20px", textAlign: "center",
    fontSize: "13px", color: "rgba(255,255,255,0.5)",
  },
  heroRowSimple: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "20px",
  },
  steamName: {
    fontSize: "18px", fontWeight: 700, color: "#fff",
  },
  steamId: {
    fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "2px",
  },
};
