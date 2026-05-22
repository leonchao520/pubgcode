'use client';

import { useState, useEffect } from 'react';
import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { PUBG_MAPS, DEFAULT_MAP, GRID_CONFIG, GRID_COL_LABELS } from '@/lib/maps';
import type { PubgMap } from '@/lib/maps';

// ─── 地图切换控制器 ───────────────────────────────────
function MapController({ mapId }: { mapId: string }) {
  const map = useMap();
  const mapConfig = PUBG_MAPS.find(m => m.id === mapId);
  if (!mapConfig) return null;

  const bounds: L.LatLngBoundsLiteral = [[0, 0], [mapConfig.size, mapConfig.size]];

  // 切换地图时重置视图
  useEffect(() => {
    map.fitBounds(bounds, { animate: true, padding: [20, 20] });
  }, [mapId, map]);

  return <ImageOverlay url={`/maps/${mapConfig.nameEn}.png`} bounds={bounds} />;
}

// ─── 网格线组件 ───────────────────────────────────
function GridOverlay({ mapConfig }: { mapConfig: PubgMap }) {
  const cellSize = mapConfig.size / GRID_CONFIG.mainCols;
  const lines: React.ReactNode[] = [];

  // 主网格线
  for (let i = 0; i <= GRID_CONFIG.mainCols; i++) {
    const pos = i * cellSize;
    lines.push(
      <div
        key={`v-${i}`}
        className="absolute bg-white/10 pointer-events-none"
        style={{
          left: `${(pos / mapConfig.size) * 100}%`,
          top: 0,
          width: '1px',
          height: '100%',
        }}
      />,
      <div
        key={`h-${i}`}
        className="absolute bg-white/10 pointer-events-none"
        style={{
          top: `${(pos / mapConfig.size) * 100}%`,
          left: 0,
          height: '1px',
          width: '100%',
        }}
      />
    );
  }

  // 网格标签
  const labels: React.ReactNode[] = [];
  for (let col = 0; col < GRID_CONFIG.mainCols; col++) {
    for (let row = 0; row < GRID_CONFIG.mainRows; row++) {
      labels.push(
        <div
          key={`label-${col}-${row}`}
          className="absolute text-[10px] text-white/25 font-mono pointer-events-none select-none"
          style={{
            left: `${((col + 0.05) / GRID_CONFIG.mainCols) * 100}%`,
            top: `${((row + 0.85) / GRID_CONFIG.mainRows) * 100}%`,
          }}
        >
          {GRID_COL_LABELS[col]}{row + 1}
        </div>
      );
    }
  }

  return <>{lines}{labels}</>;
}

// ─── 地图选择器 ───────────────────────────────────
function MapSelector({
  currentMap,
  onSelect,
}: {
  currentMap: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 p-3 bg-surface/90 backdrop-blur rounded-lg border border-border">
      {PUBG_MAPS.map((map) => (
        <button
          key={map.id}
          onClick={() => onSelect(map.id)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all
            ${
              currentMap === map.id
                ? 'bg-accent/20 border border-accent text-accent'
                : 'bg-bg/50 border border-border text-sub hover:text-text hover:border-white/20'
            }
          `}
        >
          <span className="text-base">{map.nameEn === 'Erangel' ? '🏝️' :
            map.nameEn === 'Miramar' ? '🏜️' :
            map.nameEn === 'Taego' ? '🌾' :
            map.nameEn === 'Deston' ? '🏙️' :
            map.nameEn === 'Rondo' ? '🎋' :
            '❄️'}</span>
          <span className="hidden sm:inline">{map.name}</span>
          <span className="text-xs text-muted sm:hidden">{map.name}</span>
        </button>
      ))}
    </div>
  );
}

// ─── 工具栏 ──────────────────────────────────────
function Toolbar() {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const tools = [
    { id: 'measure', label: '📏 测距', desc: '迫击炮测距' },
    { id: 'secret', label: '🔒 密室', desc: '密室点位' },
    { id: 'zone', label: '🔵 蓝圈', desc: '蓝圈自定义' },
  ];

  return (
    <div className="flex gap-2 p-2 bg-surface/90 backdrop-blur rounded-lg border border-border">
      {tools.map((tool) => (
        <button
          key={tool.id}
          onClick={() => setActiveTool(activeTool === tool.id ? null : tool.id)}
          title={tool.desc}
          className={`
            px-3 py-2 rounded-md text-xs font-medium transition-all
            ${
              activeTool === tool.id
                ? 'bg-accent/20 border border-accent text-accent'
                : 'bg-bg/50 border border-border text-sub hover:text-text'
            }
          `}
        >
          <span className="hidden sm:inline">{tool.label}</span>
          <span className="sm:hidden">{tool.label.slice(0, 2)}</span>
        </button>
      ))}
      {activeTool && (
        <span className="text-xs text-accent self-center ml-1">
          {tools.find(t => t.id === activeTool)?.desc} 模式 — 即将上线
        </span>
      )}
    </div>
  );
}

// ─── 主组件 ──────────────────────────────────────
export default function MapClient() {
  const [selectedMap, setSelectedMap] = useState(DEFAULT_MAP);
  const mapConfig = PUBG_MAPS.find(m => m.id === selectedMap) || PUBG_MAPS[0];

  const bounds: L.LatLngBoundsLiteral = [[0, 0], [mapConfig.size, mapConfig.size]];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-3 p-3">
      {/* 顶部工具栏 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <MapSelector currentMap={selectedMap} onSelect={setSelectedMap} />
        <div className="flex-1" />
        <Toolbar />
      </div>

      {/* 地图容器 */}
      <div className="flex-1 rounded-xl overflow-hidden border border-border bg-surface relative">
        <MapContainer
          key={selectedMap}
          center={[mapConfig.size / 2, mapConfig.size / 2]}
          zoom={0}
          minZoom={-1}
          maxZoom={3}
          crs={L.CRS.Simple}
          zoomControl={true}
          attributionControl={false}
          className="h-full w-full"
          style={{ background: '#0a0a0a' }}
        >
          <MapController mapId={selectedMap} />
        </MapContainer>

        {/* 网格覆盖层 */}
        <div className="absolute inset-0 pointer-events-none">
          <GridOverlay mapConfig={mapConfig} />
        </div>
      </div>

      {/* 底部状态栏 */}
      <div className="flex items-center gap-4 px-3 py-2 bg-surface/90 backdrop-blur rounded-lg border border-border text-xs text-sub">
        <span>当前地图: <span className="text-text">{mapConfig.name} ({mapConfig.nameEn})</span></span>
        <span>网格: {GRID_CONFIG.mainCols}×{GRID_CONFIG.mainRows}</span>
        <span>尺寸: {mapConfig.size / 1000}km × {mapConfig.size / 1000}km</span>
        {mapConfig.hasSecretRooms && (
          <span className="text-accent">🔒 密室数据已就绪</span>
        )}
        <span className="ml-auto text-muted">测距/密室/蓝圈 开发中</span>
      </div>
    </div>
  );
}
