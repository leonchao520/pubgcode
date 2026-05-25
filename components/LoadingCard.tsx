export default function LoadingCard() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* 结果卡片骨架 */}
      <div style={s.card}>
        <div style={{ ...s.row, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "2px", height: "20px", background: "rgba(230,184,73,0.3)", borderRadius: "1px" }} />
            <div style={{ width: "60px", height: "14px", background: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
            <div style={{ width: "120px", height: "16px", background: "rgba(255,255,255,0.06)", borderRadius: "4px" }} />
          </div>
          <div style={{ width: "64px", height: "20px", background: "rgba(255,255,255,0.04)", borderRadius: "4px" }} />
        </div>
      </div>

      {/* 战绩骨架 */}
      <div style={s.card}>
        <div style={{ ...s.row, borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "2px", height: "16px", background: "rgba(230,184,73,0.3)", borderRadius: "1px" }} />
            <div style={{ width: "100px", height: "13px", background: "rgba(255,255,255,0.05)", borderRadius: "4px" }} />
          </div>
        </div>
        <div className="resp-grid-4" style={{ padding: "16px 20px" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "6px", padding: "10px 12px" }}>
              <div style={{ width: "30px", height: "10px", background: "rgba(255,255,255,0.04)", borderRadius: "3px", margin: "0 auto 6px" }} />
              <div style={{ width: "40px", height: "20px", background: "rgba(255,255,255,0.05)", borderRadius: "3px", margin: "0 auto" }} />
            </div>
          ))}
        </div>
      </div>

      {/* 加载中 */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "6px", padding: "8px" }}>
        <span style={s.dot(0)} />
        <span style={s.dot(0.15)} />
        <span style={s.dot(0.3)} />
        <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", marginLeft: "4px" }}>查询中</span>
      </div>
    </div>
  );
}

const s = {
  card: {
    background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "8px", overflow: "hidden",
  } as React.CSSProperties,

  row: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
  } as React.CSSProperties,

  dot: (delay: number): React.CSSProperties => ({
    width: "4px", height: "4px", borderRadius: "50%",
    background: "rgba(230,184,73,0.6)",
    animation: `pulse2 1.2s ease-in-out ${delay}s infinite`,
  }),
};
