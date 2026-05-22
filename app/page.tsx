"use client";

import { useState, useRef, useEffect, CSSProperties, useCallback } from "react";
import type { QueryResult } from "@/lib/query";
import OverviewTab from "@/components/OverviewTab";
import StatsPanel from "@/components/StatsPanel";
import MatchHistory from "@/components/MatchHistory";
import MatchDetailModal from "@/components/MatchDetailModal";
import LoadingCard from "@/components/LoadingCard";
import { useMediaQuery } from "@/lib/media";
import type { MatchSummary } from "@/lib/pubg";
import { addQuery, getLocalQueries } from "@/lib/localHistory";

const EXAMPLES = ["shroud", "WackyJacky101", "76561198000000000"];
const API = process.env.NEXT_PUBLIC_API_URL || "";
type Tab = "overview" | "stats" | "matches";

/** 获取最近本地查询作为示例 */
function useRecentExamples(): { examples: string[]; hydrated: boolean } {
  const [examples, setExamples] = useState<string[]>(EXAMPLES);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const queries = getLocalQueries().slice(0, 5).map(q => q.input);
    if (queries.length > 0) setExamples(queries);
    setHydrated(true);
  }, []);
  return { examples, hydrated };
}

export default function HomePage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [selectedMatch, setSelectedMatch] = useState<MatchSummary | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const isMobile = useMediaQuery("(max-width: 767px)");
  const isSteamId = /^\d{12,}$/.test(input.trim());
  const { examples, hydrated } = useRecentExamples();
  const [pubgOnline, setPubgOnline] = useState<string>("...");
  const [pubgStatus, setPubgStatus] = useState<string>("...");

  // 每 60 秒自动刷新 PUBG 状态
  useEffect(() => {
    const fetchStatus = () => {
      fetch("/api/status")
        .then(r => r.json())
        .then(d => {
          setPubgStatus(d.pubgStatus || "未知");
          if (d.steamOnline) setPubgOnline(d.steamOnline.toLocaleString());
          else setPubgOnline("?");
        })
        .catch(() => {
          setPubgStatus("未知");
          setPubgOnline("?");
        });
    };
    fetchStatus();
    const timer = setInterval(fetchStatus, 60000);
    return () => clearInterval(timer);
  }, []);

  /* ─── 发起查询 ──────────────────────────── */
  async function fetchResult(q: string, season?: string) {
    setError("");
    setLoading(true);
    setResult(null);
    setActiveTab("overview");

    try {
      const params = new URLSearchParams({ q });
      if (season) params.set("season", season);
      const url = `${API}/api/query?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "查询失败");
        return;
      }
      setResult(data);
      // 保存到本地历史
      const qtype = /^\d{17}$/.test(q.trim()) ? "steamid" : "name";
      addQuery(q, qtype as "name" | "steamid", true);
    } catch {
      setError("网络错误，请稍后再试");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    const q = input.trim();
    if (!q || q.length < 2) {
      setError("请输入玩家昵称或 17 位 Steam ID");
      return;
    }
    window.location.href = `/player/${encodeURIComponent(q)}`;
  }

  function handleSeasonChange(seasonId: string) {
    const q = input.trim();
    if (!q) return;
    if (seasonId) {
      window.history.pushState(null, "", `/result/${encodeURIComponent(q)}?season=${encodeURIComponent(seasonId)}`);
    } else {
      window.history.pushState(null, "", `/result/${encodeURIComponent(q)}`);
    }
    fetchResult(q, seasonId || undefined);
  }

  const restoreFromUrl = useCallback((path: string) => {
    const match = path.match(/^\/result\/(.+)/);
    if (match) {
      // 旧版 /result 路径重定向到新的 /player 页面
      const full = decodeURIComponent(match[1]);
      const [name] = full.split("?");
      window.location.href = `/player/${encodeURIComponent(name)}`;
    }
  }, []);

  useEffect(() => {
    const path = window.location.pathname + window.location.search;
    // 支持 /result/shroud 和 /?q=shroud 两种格式
    const resultMatch = window.location.pathname.match(/^\/result\/(.+)/);
    const queryMatch = new URLSearchParams(window.location.search).get("q");
    if (resultMatch) {
      restoreFromUrl(path);
    } else if (queryMatch && !input) {
      setInput(queryMatch);
      fetchResult(queryMatch);
    }

    function onPop() {
      const p = window.location.pathname + window.location.search;
      const m = window.location.pathname.match(/^\/result\/(.+)/);
      const qm = new URLSearchParams(window.location.search).get("q");
      if (m) restoreFromUrl(p);
      else if (qm) { setInput(qm); fetchResult(qm); }
      else { setResult(null); setInput(""); }
    }
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  function handleClear() {
    setInput(""); setError(""); setResult(null);
    window.history.pushState(null, "", "/");
  }

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const hasResult = !!result || loading;

  return (
    <>
    <div style={lg.page(hasResult)}>
      <div style={lg.container} className="app-container">
        {/* ─── Header ───────────────────── */}
        <div style={lg.logoArea(hasResult)}>
          <div style={lg.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
              <path d="M10 1L1 6v8l9 5 9-5V6L10 1z" stroke="#D4A030" strokeWidth="1.5" fill="none"/>
              <circle cx="10" cy="10" r="3" stroke="#D4A030" strokeWidth="1.5" fill="none"/>
            </svg>
          </div>
          <h1 style={lg.title}>
            PUBG<span style={{ color: "#D4A030" }}>.</span>BAR
          </h1>
          <p style={lg.subtitle}>玩家状态查询 / 战绩追踪 / 封禁检测</p>

          {/* 导航栏 */}
          <nav style={lg.navBar} className="mobile-nav-btn">
            <a href="/" style={lg.navItemActive} className="mobile-nav-btn">查询首页</a>
            <a href="/leaderboard" style={lg.navItem} className="mobile-nav-btn">竞技排行榜</a>
            <a href="#pubg-mail" style={lg.navItem} className="mobile-nav-btn">PUBG邮箱</a>
            <a href="#faq" style={lg.navItem} className="mobile-nav-btn">常见问题</a>
          </nav>
        </div>

        {/* ─── 搜索框 ───────────────────── */}
        <div style={lg.searchWrapper}>
          <svg style={lg.searchIcon} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <line x1="10" y1="10" x2="14.5" y2="14.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>

          <input
            ref={inputRef} type="text" value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="输入昵称或 Steam ID..."
            style={isMobile ? lg.input : { ...lg.input, ...lg.inputPC }} spellCheck={false} autoComplete="off"
          />

          {input && !loading && (
            <button onClick={handleClear} style={lg.clearBtn} title="清空" aria-label="清空搜索框">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </button>
          )}

          <a href="/history" style={lg.historyBtn} title="查询历史" aria-label="查询历史">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </a>

          <button
            onClick={handleSubmit}
            disabled={loading || !input.trim()}
            style={lg.submitBtn(input, loading)}
            aria-label="查询玩家数据"
          >
            {loading ? "..." : "查询"}
          </button>
        </div>

        {error && !loading && <p style={lg.error}>{error}</p>}

        {/* ─── 示例 ─────────────────────── */}
        {!hasResult && (
          <div style={lg.examples}>
            <span style={lg.examplesLabel}>{hydrated && examples[0] !== EXAMPLES[0] ? "最近查询：" : "示例："}</span>
            {examples.map((ex) => (
              <button key={ex}
                onClick={() => { window.location.href = `/player/${encodeURIComponent(ex)}`; }}
                style={lg.exampleBtn}>{ex}</button>
            ))}
          </div>
        )}

        {/* ─── 结果区 ───────────────────── */}
        <div ref={resultRef} style={{ width: "100%", marginTop: hasResult ? "24px" : "0" }}>
          {loading && <LoadingCard />}

          {result && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {/* Tab 栏 */}
              <div style={lg.tabBar}>
                {([
                  { key: "overview", label: "总览" },
                  { key: "stats", label: "统计" },
                  { key: "matches", label: "战绩" },
                ] as const).map((t) => (
                  <button key={t.key} onClick={() => setActiveTab(t.key)}
                    style={activeTab === t.key ? lg.tabActive : lg.tab}>
                    {t.label}
                    {t.key === "matches" && result.recentMatches && result.recentMatches.length > 0 && (
                      <span style={lg.tabBadge}>{result.recentMatches.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab 内容 */}
              {activeTab === "overview" && <OverviewTab result={result} />}
              {activeTab === "stats" && (
                <StatsPanel result={result} onSeasonChange={handleSeasonChange} />
              )}
              {activeTab === "matches" && (
                <>
                  {result.recentMatches && result.recentMatches.length > 0 ? (
                    <MatchHistory matches={result.recentMatches} onSelectMatch={setSelectedMatch} />
                  ) : (
                    <div style={lg.emptyCard}>
                      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.45)", marginBottom: "4px" }}>
                        暂无近期对局数据
                      </p>
                      <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)" }}>
                        PUBG API 仅返回近期活跃玩家的对局记录
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* 底部信息 */}
              <div style={lg.bottomBar}>
                <span style={lg.cacheInfo}>{result.fromCache ? "● 缓存" : "● 实时"}</span>
                <a href="/history" style={lg.bottomLink}>查询历史 →</a>
              </div>
            </div>
          )}

          {/* PUBG 服务器状态 — 始终显示 */}
          <div style={lg.serverBar} className="server-bar-wrap">
            <span style={lg.serverLabel}>PUBG 服务器</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              fontSize: "12px", fontWeight: 600,
              color: pubgStatus === "正常运行" ? "#4ADE80" : pubgStatus === "维护中" ? "#F87171" : "rgba(255,255,255,0.5)"
            }}>
              <span style={{
                display: "inline-block", width: "6px", height: "6px", borderRadius: "50%",
                background: pubgStatus === "正常运行" ? "#4ADE80" : pubgStatus === "维护中" ? "#F87171" : "rgba(255,255,255,0.3)",
                boxShadow: pubgStatus === "正常运行" ? "0 0 6px rgba(74,222,128,0.6)" : "none"
              }}/>
              {pubgStatus}
            </span>
            <span style={lg.serverDivider}>|</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={lg.serverValue}>{pubgOnline}</span>
            </span>
          </div>

          {/* 功能说明区域 — 始终显示 */}
          <div style={lg.faqSection}>
            <h2 style={lg.faqTitle}>功能说明</h2>
            <div style={lg.faqGrid} className="faq-grid-mobile">
              <div style={lg.faqCard}>
                <div style={lg.faqCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <h3 style={lg.faqCardTitle}>PUBG 玩家查询</h3>
                <p style={lg.faqCardText}>首次使用时，请严格按照游戏内昵称的大小写输入，否则可能无法匹配到正确账号。</p>
              </div>
              <div style={lg.faqCard}>
                <div style={lg.faqCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D4A030" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <h3 style={lg.faqCardTitle}>STEAM 封禁查询</h3>
                <p style={lg.faqCardText}>当输入以 7656 开头的 17 位纯数字时，系统将自动切换至 STEAM 查询模块进行封禁状态查询。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* 对局详情 Modal */}
    {selectedMatch && (
      <MatchDetailModal match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    )}
    </>
  );
}

/* ─── 样式 ──────────────────────────────── */

const lg = {
  page: (hasResult: boolean): CSSProperties => ({
    backgroundColor: "#000", color: "#fff", minHeight: "100vh",
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "20px",
    justifyContent: hasResult ? "flex-start" : "center",
    paddingTop: hasResult ? "40px" : "20px",
    transition: "justify-content 0.3s ease, padding-top 0.3s ease",
  }),
  container: { width: "100%", display: "flex", flexDirection: "column", alignItems: "center" } as CSSProperties,
  logoArea: (hasResult: boolean): CSSProperties => ({
    textAlign: "center", marginBottom: hasResult ? "20px" : "40px",
    transition: "margin-bottom 0.3s ease",
  }),
  logoIcon: { marginBottom: "12px" },
  title: { fontSize: "28px", fontWeight: 700, letterSpacing: "-0.5px", color: "#fff", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  subtitle: { fontSize: "13px", color: "rgba(255,255,255,0.4)", marginTop: "6px", letterSpacing: "0.5px", marginBottom: "16px" },

  // 导航栏
  navBar: { display: "flex", gap: "6px", justifyContent: "center", marginBottom: "20px", flexWrap: "wrap", maxWidth: "560px", width: "100%", marginLeft: "auto", marginRight: "auto" } as CSSProperties,
  navItem: { padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, color: "rgba(255,255,255,0.5)", background: "transparent", border: "1px solid rgba(255,255,255,0.08)", textDecoration: "none", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", transition: "0.15s ease", whiteSpace: "nowrap" } as CSSProperties,
  navItemActive: { padding: "8px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, color: "#D4A030", background: "rgba(212,160,48,0.1)", border: "1px solid rgba(212,160,48,0.25)", textDecoration: "none", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", whiteSpace: "nowrap" } as CSSProperties,
  searchWrapper: { position: "relative", width: "100%", maxWidth: "560px", marginBottom: "12px" } as CSSProperties,
  searchIcon: { position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", width: "16px", height: "16px", color: "#a3a3a3", pointerEvents: "none", zIndex: 1 } as CSSProperties,
  input: { width: "100%", padding: "16px 150px 16px 44px", backgroundColor: "#171717", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", fontSize: "15px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", outline: "none", transition: "0.2s ease", boxSizing: "border-box" } as CSSProperties,
  inputPC: { maxWidth: "560px" } as CSSProperties,
  clearBtn: { position: "absolute", right: "118px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", zIndex: 1 } as CSSProperties,
  historyBtn: { position: "absolute", right: "80px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", zIndex: 1, textDecoration: "none" } as CSSProperties,
  submitBtn: (inputVal: string, loading: boolean): CSSProperties => ({
    position: "absolute", right: "6px", top: "50%", transform: "translateY(-50%)",
    padding: "10px 22px",
    background: inputVal.trim() ? "#D4A030" : "transparent",
    color: inputVal.trim() ? "#000" : "rgba(212,160,48,0.6)",
    border: inputVal.trim() ? "none" : "1px solid rgba(212,160,48,0.4)",
    borderRadius: "8px", fontSize: "14px", fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    cursor: inputVal.trim() && !loading ? "pointer" : loading ? "wait" : "default",
    transition: "0.2s ease",
  }),
  historyLink: undefined as any,
  error: { color: "#ef4444", fontSize: "12px", marginTop: "6px", textAlign: "center", width: "100%" } as CSSProperties,
  examples: { display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", marginTop: "20px" } as CSSProperties,
  examplesLabel: { fontSize: "12px", color: "rgba(255,255,255,0.4)", lineHeight: "28px" },
  exampleBtn: { background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "4px", padding: "4px 12px", fontSize: "12px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", cursor: "pointer", transition: "0.15s ease" },

  tabBar: { display: "flex", gap: "4px", padding: "4px", background: "#0d0d0d", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.06)" } as CSSProperties,
  tab: { flex: 1, padding: "10px", background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 500, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", transition: "0.15s ease", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" } as CSSProperties,
  tabActive: { flex: 1, padding: "10px", background: "rgba(212,160,48,0.15)", color: "#D4A030", border: "none", borderRadius: "8px", fontSize: "13px", cursor: "pointer", fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" } as CSSProperties,
  tabBadge: { background: "rgba(212,160,48,0.25)", color: "#D4A030", fontSize: "10px", padding: "1px 6px", borderRadius: "8px", fontWeight: 600 } as CSSProperties,
  emptyCard: { background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "8px", padding: "32px 20px", textAlign: "center" } as CSSProperties,
  bottomBar: { display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" } as CSSProperties,
  cacheInfo: { fontSize: "11px", color: "rgba(255,255,255,0.45)" },
  bottomLink: { fontSize: "11px", color: "rgba(255,255,255,0.45)", textDecoration: "none" },
  serverBar: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "10px 0 4px", marginTop: "8px",
    borderTop: "1px solid rgba(255,255,255,0.05)",
    maxWidth: "560px", width: "100%", marginLeft: "auto", marginRight: "auto",
  } as CSSProperties,
  serverLabel: { fontSize: "11px", color: "rgba(255,255,255,0.35)" },
  serverValue: {
    fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.6)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  serverDivider: { fontSize: "10px", color: "rgba(255,255,255,0.15)" },

  // 功能说明
  faqSection: { maxWidth: "560px", width: "100%", marginLeft: "auto", marginRight: "auto", marginTop: "32px", padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.05)" } as CSSProperties,
  faqTitle: { fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.7)", marginBottom: "16px", textAlign: "center" } as CSSProperties,
  faqGrid: { display: "flex", gap: "12px", flexWrap: "wrap" } as CSSProperties,
  faqCard: { flex: "1 1 240px", padding: "16px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.05)" } as CSSProperties,
  faqCardIcon: { marginBottom: "10px" },
  faqCardTitle: { fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: "8px" },
  faqCardText: { fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: "1.6" },
};
