import Link from "next/link";
import HistoryClient from "@/components/HistoryClient";

const API = process.env.API_URL || "http://127.0.0.1:3001";

export const metadata = { title: "查询历史 — PUBG.BAR" };

interface Props {
  searchParams: { page?: string; q?: string; type?: string };
}

export default async function HistoryPage({ searchParams }: Props) {
  const page = searchParams.page ?? "1";
  const q = searchParams.q ?? "";
  const type = searchParams.type ?? "all";

  const url = `${API}/api/history?page=${page}&q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`;
  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = await res.json();

  return (
    <div style={{ backgroundColor: "#000", color: "#fff", minHeight: "100vh", padding: "24px 20px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <div className="history-container">
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "32px" }}>
          <Link href="/" style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>
            ← 返回查询
          </Link>
          <div style={{ height: "1px", flex: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", letterSpacing: "1px" }}>HISTORY</span>
        </div>

        {/* Title */}
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2px", marginBottom: "2px" }}>
            <div style={{ width: "2px", height: "22px", background: "#D4A030", borderRadius: "1px", marginRight: "8px" }} />
            <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#fff", letterSpacing: "-0.5px", margin: 0 }}>查询历史</h1>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginLeft: "12px", margin: "4px 0 0 12px" }}>
            记录所有用户的查询行为与结果
          </p>
        </div>

        <HistoryClient data={data} initialQ={q} initialType={type} />
      </div>
    </div>
  );
}
