'use client';

import React, { useState } from 'react';
import { Search, Crosshair, AlertCircle } from 'lucide-react';
import PlayerStatsCard from '@/components/PlayerStatsCard';
import { ProcessedPlayerStats, ApiResponse } from '@/lib/types';

export default function Home() {
  const [searchInput, setSearchInput] = useState('');
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [playerData, setPlayerData] = useState<ProcessedPlayerStats['squad'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const query = searchInput.trim();
    if (!query) {
      setError('请输入玩家名称');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentPlayer(query);
    setPlayerData(null);

    try {
      const response = await fetch(`/api/stats/${encodeURIComponent(query)}`);
      const result: ApiResponse<ProcessedPlayerStats> = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '未找到该玩家或服务器繁忙');
      }

      // 安全取值：使用可选链替代非空断言
      if (result.data) {
        setPlayerData(result.data.squad);
      } else {
        throw new Error('返回数据为空');
      }
    } catch (err: unknown) {
      console.error('Search failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : '网络请求失败，请稍后再试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-amber-500/30">
      <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center space-x-3">
          <Crosshair className="w-6 h-6 text-amber-500" />
          <span className="font-black text-xl tracking-wider uppercase">PUBG.Nexus</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
            追踪你的<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">战场数据</span>
          </h1>
          <p className="text-zinc-400 max-w-lg mx-auto">
            输入绝地求生玩家 ID，获取实时 SQUAD 战绩。由高速缓存驱动，数据精准无延迟。
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto mb-16 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={`w-5 h-5 transition-colors ${isLoading ? 'text-amber-500 animate-pulse' : 'text-zinc-500 group-focus-within:text-amber-500'}`} />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="输入玩家 ID，例如: shroud..."
            className="w-full bg-zinc-900 border-2 border-zinc-800 text-white rounded-2xl pl-12 pr-32 py-4 focus:outline-none focus:border-amber-500/50 focus:bg-zinc-800/50 transition-all text-lg placeholder:text-zinc-600 shadow-xl"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !searchInput.trim()}
            className="absolute right-2 top-2 bottom-2 px-6 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold rounded-xl transition-colors"
          >
            {isLoading ? '搜索中...' : '检索'}
          </button>
        </form>

        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-950/30 border border-red-900/50 rounded-xl flex items-center space-x-3 animate-in fade-in slide-in-from-bottom-4">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {(isLoading || playerData) && !error && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <PlayerStatsCard
              playerName={currentPlayer}
              stats={playerData}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </main>
  );
}
