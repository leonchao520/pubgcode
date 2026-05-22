/**
 * PUBG 地图定义 — 互动地图核心配置
 * 坐标系统: L.CRS.Simple (1 unit = 1 游戏米)
 * 底图来源: pubg/api-assets 官方 PNG
 */

export interface PubgMap {
  id: string;
  name: string;
  nameEn: string;
  size: number; // 地图尺寸 (米), 8×8km = 8000
  thumbnail: string;
  hasSecretRooms: boolean; // 是否有密室数据
}

export const PUBG_MAPS: PubgMap[] = [
  {
    id: 'erangel',
    name: '艾伦格',
    nameEn: 'Erangel',
    size: 8000,
    thumbnail: '/maps/Erangel.png',
    hasSecretRooms: true,
  },
  {
    id: 'miramar',
    name: '米拉玛',
    nameEn: 'Miramar',
    size: 8000,
    thumbnail: '/maps/Miramar.png',
    hasSecretRooms: false,
  },
  {
    id: 'taego',
    name: '泰戈',
    nameEn: 'Taego',
    size: 8000,
    thumbnail: '/maps/Taego.png',
    hasSecretRooms: true,
  },
  {
    id: 'deston',
    name: '帝斯顿',
    nameEn: 'Deston',
    size: 8000,
    thumbnail: '/maps/Deston.png',
    hasSecretRooms: false,
  },
  {
    id: 'rondo',
    name: '荣都',
    nameEn: 'Rondo',
    size: 8000,
    thumbnail: '/maps/Rondo.png',
    hasSecretRooms: false,
  },
  {
    id: 'vikendi',
    name: '维寒迪',
    nameEn: 'Vikendi',
    size: 8000,
    thumbnail: '/maps/Vikendi.png',
    hasSecretRooms: false,
  },
];

/** 网格系统配置 */
export const GRID_CONFIG = {
  mainCols: 8, // A-H
  mainRows: 8, // 1-8
  subDivisions: 10, // 每个主格 10×10 细分
} as const;

/** 主网格列标签 (A-H) */
export const GRID_COL_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** 默认显示的地图 */
export const DEFAULT_MAP = 'erangel';
