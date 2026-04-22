'use client';

import React from 'react';
import { Crosshair, Trophy, Skull, Activity, Target, Shield } from 'lucide-react';
import { ProcessedPlayerStats } from '@/lib/types'; // 引入我们在后端定义的类型

// 模拟属性接口，允许传入真实数据或用于骨架屏的 loading 状态
interface PlayerStatsCardProps {
  playerName: string;
  stats: ProcessedPlayerStats['squad'] | null;
  isLoading?: boolean;
}

export default function PlayerStatsCard({ playerName, stats, isLoading }: PlayerStatsCardProps) {
  // 处理加载中状态 (骨架屏设计)
  if (isLoading || !stats) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-zinc-900 border border-zinc-800 rounded-2xl animate-pulse">
        <div className="h-8 w-48 bg-zinc-800 rounded mb-6"></div>
        <div className="h-32 bg-zinc-800 rounded-xl mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-24 bg-zinc-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  // 格式化工具函数：将 0.5909 转化为 "59.1%"
  const formatPercent = (ratio: number) => `${(ratio * 100).toFixed(1)}%`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 text-zinc-100 font-sans">
      {/* 头部：玩家名称与赛季信息 */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-black tracking-tight uppercase">
          {playerName}
          <span className="ml-3 text-sm font-medium px-2.5 py-1 bg-zinc-800 text-zinc-400 rounded-md align-middle">
            SQUAD - FPP
          </span>
        </h1>
        <div className="text-right">
          <p className="text-sm text-zinc-500">Total Matches</p>
          <p className="text-xl font-bold text-zinc-300">{stats.roundsPlayed}</p>
        </div>
      </div>

      {/* 核心段位卡片 (Hero Section) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl p-8 flex items-center justify-between shadow-2xl">
        {/* 背景光晕效果 */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
        
        <div className="flex items-center space-x-6 z-10">
          <div className="p-4 bg-zinc-800/50 rounded-2xl border border-zinc-700 shadow-inner">
            <Shield className="w-16 h-16 text-amber-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-semibold tracking-widest uppercase mb-1">Current Tier</p>
            <div className="flex items-baseline space-x-3">
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                {stats.currentTier.tier} {stats.currentTier.subTier}
              </h2>
              <span className="text-xl font-bold text-zinc-500">
                {stats.currentRankPoint} RP
              </span>
            </div>
          </div>
        </div>

        {/* 右侧：胜率核心展示 */}
        <div className="hidden md:flex flex-col items-end z-10">
          <p className="text-zinc-400 text-sm font-semibold tracking-widest uppercase mb-1">Win Rate</p>
          <p className="text-4xl font-black text-emerald-400">
            {formatPercent(stats.winRatio)}
          </p>
        </div>
      </div>

      {/* 详细数据网格 (Stats Grid) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox 
          icon={<Crosshair className="w-5 h-5 text-red-400" />}
          label="KDA" 
          value={stats.kda.toString()} 
          highlight={stats.kda > 2.0} // 如果 KDA 大于2，高亮显示
        />
        <StatBox 
          icon={<Target className="w-5 h-5 text-orange-400" />}
          label="Kills" 
          value={stats.kills.toString()} 
        />
        <StatBox 
          icon={<Skull className="w-5 h-5 text-zinc-500" />}
          label="Deaths" 
          value={stats.deaths.toString()} 
        />
        <StatBox 
          icon={<Activity className="w-5 h-5 text-blue-400" />}
          label="Damage Dealt" 
          value={Math.round(stats.damageDealt).toLocaleString()} // 四舍五入并添加千分位
        />
        <StatBox 
          icon={<Trophy className="w-5 h-5 text-yellow-400" />}
          label="Wins" 
          value={stats.wins.toString()} 
        />
        <StatBox 
          icon={<Trophy className="w-5 h-5 text-zinc-400" />}
          label="Top 10 Rate" 
          value={formatPercent(stats.top10Ratio)} 
        />
        <StatBox 
          icon={<Crosshair className="w-5 h-5 text-purple-400" />}
          label="Assists" 
          value={stats.assists.toString()} 
        />
        <StatBox 
          icon={<Activity className="w-5 h-5 text-zinc-400" />}
          label="Avg Rank" 
          value={stats.avgRank.toFixed(1)} 
        />
      </div>
    </div>
  );
}

// 提取可复用的小数据块组件
function StatBox({ icon, label, value, highlight = false }: { icon: React.ReactNode, label: string, value: string | number, highlight?: boolean }) {
  return (
    <div className="flex flex-col p-5 bg-zinc-900 border border-zinc-800/80 rounded-xl hover:bg-zinc-800/50 transition-colors group">
      <div className="flex items-center space-x-2 mb-3">
        {icon}
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-2xl font-bold ${highlight ? 'text-amber-400' : 'text-zinc-100 group-hover:text-white'}`}>
        {value}
      </span>
    </div>
  );
}
