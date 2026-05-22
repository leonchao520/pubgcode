export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      {/* 顶部导航条 */}
      <nav className="flex items-center gap-6 px-4 py-3 border-b border-border bg-surface/50 backdrop-blur">
        <a href="/" className="text-accent font-bold text-lg tracking-tight">
          PUBG<span className="text-sub font-normal">.BAR</span>
        </a>
        <div className="flex gap-4 text-sm">
          <a href="/" className="text-sub hover:text-text transition-colors">首页</a>
          <a href="/leaderboard" className="text-sub hover:text-text transition-colors">排行榜</a>
          <a href="/map" className="text-accent transition-colors">互动地图</a>
        </div>
      </nav>
      {children}
    </div>
  );
}
