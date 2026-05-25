"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { getLocalQueries, searchLocalQueries } from "@/lib/localHistory";

interface Log {
  id: string; input: string; type: string;
  success: boolean; createdAt: string;
}

interface PlayerItem {
  name: string; steamId: string | null;
  favorite?: boolean; queriedAt: string;
}

interface Props {
  data: {
    logs: Log[]; recentPlayers: PlayerItem[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
    stats: { totalAll: number; totalSuccess: number; totalName: number; totalSteam: number };
  };
  initialQ: string; initialType: string;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return "now";
}

export default function HistoryClient({ data, initialQ, initialType }: Props) {
  const { logs, recentPlayers, pagination, stats } = data;
  const [q, setQ] = useState(initialQ);
  const [type, setType] = useState(initialType);
  const [isPending] = useTransition();
  const [mode, setMode] = useState<"mine" | "all">("mine");
  const [localLogs, setLocalLogs] = useState(logs.map(l => ({ ...l, _local: false })));
  const router = useRouter();
  const pathname = usePathname();

  function applyFilter(newQ: string, newType: string, newPage = 1) {
    const params = new URLSearchParams();
    if (newQ) params.set("q", newQ);
    if (newType !== "all") params.set("type", newType);
    if (newPage > 1) params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  }

  // 加载本地历史
  const localQueries = typeof window !== "undefined" ? getLocalQueries() : [];
  const activeLogs = mode === "mine"
    ? localQueries.filter(item => {
        if (q && !item.input.toLowerCase().includes(q.toLowerCase())) return false;
        if (type !== "all" && item.type !== type) return false;
        return true;
      })
    : logs.map(l => ({ ...l, createdAt: l.createdAt }));

  const displayTotal = mode === "mine" ? activeLogs.length : pagination.total;
  const successRate = stats.totalAll > 0 ? Math.round((stats.totalSuccess / stats.totalAll) * 100) : 0;
  const favorites = recentPlayers.filter(p => p.favorite);
  const recentOnly = recentPlayers.filter(p => !p.favorite);

  return (
    <div style={s.wrap}>
      {/* 统计卡片 */}
      <div className="stats-card-grid">
        {[
          { label: "总查询", value: stats.totalAll.toLocaleString() },
          { label: "成功率", value: `${successRate}%`, c: successRate >= 90 ? "#E6B849" : "#fff" },
          { label: "昵称", value: stats.totalName.toLocaleString() },
          { label: "Steam ID", value: stats.totalSteam.toLocaleString() },
        ].map(({ label, value, c }) => (
          <div key={label} style={s.statCard}>
            <div style={s.statLabel}>{label}</div>
            <div style={{ ...s.statValue, color: c || "#fff" }}>{value}</div>
          </div>
        ))}
      </div>

      {/* 模式切换 */}
      <div style={{ display: "flex", gap: "6px" }}>
        <button onClick={() => setMode("mine")}
          style={mode === "mine" ? s.filterActive : s.filterBtn}>
          📱 我的查询 ({localQueries.length})
        </button>
        <button onClick={() => setMode("all")}
          style={mode === "all" ? s.filterActive : s.filterBtn}>
          🌐 全部 ({pagination.total})
        </button>
      </div>

      {/* 过滤器 */}
      <div className="filter-row" style={{ gap: "8px" }}>
        <input
          type="text" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilter(q, type)}
          placeholder="搜索昵称或 ID..."
          style={s.filterInput}
        />
        <div style={{ display: "flex", gap: "6px" }}>
          {(["all", "name", "steamid"] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); applyFilter(q, t); }}
              style={type === t ? s.filterActive : s.filterBtn}>
              {t === "all" ? "全部" : t === "name" ? "昵称" : "Steam"}
            </button>
          ))}
          <button onClick={() => applyFilter(q, type)} style={s.searchBtn}>搜索</button>
        </div>
      </div>

      {/* 主区域 */}
      <div className="history-layout">
        {/* 日志列表 */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px", alignItems: "center" }}>
            <span style={s.listCount}>共 {displayTotal} 条</span>
            {isPending && <span style={{ fontSize: "11px", color: "#E6B849" }}>加载中...</span>}
          </div>

          {activeLogs.length === 0 ? (
            <div style={s.emptyCard}>{mode === "mine" ? "暂无本地查询记录，试试搜索一个玩家吧" : "暂无记录"}</div>
          ) : (
            <div style={s.tableCard}>
              <div style={s.tableHdr}>
                <span style={{ flex: 1 }}>输入</span>
                <span style={{ width: "50px", textAlign: "center" }}>类型</span>
                <span style={{ width: "50px", textAlign: "center" }}>状态</span>
                <span style={{ width: "60px", textAlign: "right" }}>时间</span>
              </div>
              {activeLogs.map((log) => (
                <Link key={log.input + log.createdAt} href={`/player/${encodeURIComponent(log.input)}`} style={s.tableRow}>
                  <span style={s.tableInput(log.type)}>{log.input}</span>
                  <span style={{ ...s.tag, color: log.type === "name" ? "#60A5FA" : "#E6B849", background: log.type === "name" ? "rgba(96,165,250,0.1)" : "rgba(230,184,73,0.1)", width: "50px", textAlign: "center" }}>
                    {log.type === "name" ? "昵称" : "Steam"}
                  </span>
                  <span style={{ ...s.tag, color: log.success ? "#4ADE80" : "#F87171", background: log.success ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", width: "50px", textAlign: "center" }}>
                    {log.success ? "成功" : "失败"}
                  </span>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", width: "60px", textAlign: "right" }}>
                    {timeAgo(log.createdAt)}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {mode === "all" && pagination.totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", alignItems: "center" }}>
              <span style={s.listCount}>第 {pagination.page}/{pagination.totalPages} 页</span>
              <div style={{ display: "flex", gap: "6px" }}>
                {pagination.page > 1 && (
                  <button onClick={() => applyFilter(q, type, pagination.page - 1)} style={s.pageBtn}>←</button>
                )}
                {pagination.page < pagination.totalPages && (
                  <button onClick={() => applyFilter(q, type, pagination.page + 1)} style={s.pageBtn}>→</button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 侧边栏 */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* 收藏 */}
          {favorites.length > 0 && (
            <div>
              <div style={s.sidebarHdr}>
                <div style={{ ...s.accentBar, background: "#E6B849" }} />
                <span>⭐ 收藏</span>
              </div>
              <div style={s.sidebarList}>
                {favorites.map((p) => (
                  <FavoriteItem key={p.name} player={p} />
                ))}
              </div>
            </div>
          )}

          {/* 最近查询 */}
          <div>
            <div style={s.sidebarHdr}>
              <div style={s.accentBar} />
              <span>最近查询</span>
            </div>
            <div style={s.sidebarList}>
              {recentOnly.slice(0, 20).map((p) => (
                <PlayerRow key={p.name} player={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoriteItem({ player }: { player: PlayerItem }) {
  const [fav, setFav] = useState(true);

  async function toggle() {
    setFav(false);
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: player.name }),
    });
  }

  return (
    <div style={s.favItem}>
      <Link href={`/player/${encodeURIComponent(player.name)}`} style={s.favLink}>
        <div>
          <div style={s.favName}>⭐ {player.name}</div>
          {player.steamId && <div style={s.sideSteam}>{player.steamId}</div>}
        </div>
      </Link>
      <button onClick={toggle} style={s.unfavBtn} title="取消收藏">✕</button>
    </div>
  );
}

function PlayerRow({ player }: { player: PlayerItem }) {
  const [faved, setFaved] = useState(false);

  async function toggleFav(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setFaved(true);
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: player.name }),
    });
  }

  return (
    <div style={s.playerRow}>
      <Link href={`/player/${encodeURIComponent(player.name)}`} style={s.playerLink}>
        <div>
          <div style={s.playerName}>{player.name}</div>
          {player.steamId && <div style={s.sideSteam}>{player.steamId}</div>}
        </div>
        <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)" }}>{timeAgo(player.queriedAt)}</span>
      </Link>
      <button
        onClick={toggleFav}
        style={{ ...s.starBtn, color: faved ? "#E6B849" : "rgba(255,255,255,0.4)", opacity: faved ? 1 : 0.4 }}
        title="收藏"
      >
        {faved ? "★" : "☆"}
      </button>
    </div>
  );
}

const s: Record<string, React.CSSProperties | any> = {
  wrap: { display: "flex", flexDirection: "column", gap: "16px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "10px" },
  statCard: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", padding: "14px 16px", textAlign: "center",
  },
  statLabel: { fontSize: "10px", color: "rgba(255,255,255,0.45)", letterSpacing: "1px", marginBottom: "4px" },
  statValue: { fontSize: "24px", fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },

  filterRow: { display: "flex", gap: "8px" },
  filterInput: {
    flex: 1, padding: "10px 14px", background: "#0d0d0d", color: "#fff",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px",
    fontSize: "13px", outline: "none",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  filterBtn: {
    padding: "10px 14px", background: "#0d0d0d", color: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  filterActive: {
    padding: "10px 14px", background: "rgba(230,184,73,0.1)", color: "#E6B849",
    border: "1px solid rgba(230,184,73,0.3)", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer", fontWeight: 600,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  searchBtn: {
    padding: "10px 18px", background: "#E6B849", color: "#000",
    border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },

  listCount: { fontSize: "11px", color: "rgba(255,255,255,0.4)" },
  emptyCard: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", padding: "40px", textAlign: "center",
    fontSize: "13px", color: "rgba(255,255,255,0.5)",
  },

  tableCard: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", overflow: "hidden",
  },
  tableHdr: {
    display: "flex", padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "1px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  tableRow: {
    display: "flex", alignItems: "center", padding: "10px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
    textDecoration: "none", transition: "background 0.15s",
  },
  tableInput: (type: string): React.CSSProperties => ({
    flex: 1, fontSize: "13px",
    fontFamily: type === "steamid" ? "Consolas, Monaco, monospace" : "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: type === "steamid" ? "rgba(255,255,255,0.45)" : "#fff",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  }),
  tag: {
    fontSize: "10px", padding: "2px 6px", borderRadius: "3px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  } as React.CSSProperties,

  pageBtn: {
    padding: "6px 14px", background: "#0d0d0d", color: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
    fontSize: "12px", cursor: "pointer",
  },

  sidebarHdr: {
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", padding: "0 4px",
  },
  accentBar: { width: "2px", height: "14px", background: "#E6B849", borderRadius: "1px" },
  sidebarList: { display: "flex", flexDirection: "column", gap: "2px" },

  playerRow: {
    display: "flex", alignItems: "center",
    borderRadius: "6px", border: "1px solid transparent",
    transition: "background 0.15s",
  },
  playerLink: {
    flex: 1, padding: "8px 10px", textDecoration: "none",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  playerName: { fontSize: "12px", color: "rgba(255,255,255,0.6)" },
  sideSteam: {
    fontSize: "10px", color: "rgba(255,255,255,0.5)",
    fontFamily: "Consolas, Monaco, monospace", maxWidth: "120px",
    overflow: "hidden", textOverflow: "ellipsis",
  },
  starBtn: {
    background: "none", border: "none", fontSize: "14px",
    cursor: "pointer", padding: "4px 8px", lineHeight: 1,
    transition: "0.15s",
  },

  favItem: {
    display: "flex", alignItems: "center",
    background: "rgba(230,184,73,0.06)", borderRadius: "6px",
    border: "1px solid rgba(230,184,73,0.12)",
  },
  favLink: {
    flex: 1, padding: "8px 10px", textDecoration: "none",
  },
  favName: { fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 500 },
  unfavBtn: {
    background: "none", border: "none", color: "rgba(255,255,255,0.5)",
    fontSize: "10px", cursor: "pointer", padding: "4px 8px",
    transition: "0.15s",
  },
};
