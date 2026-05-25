/** PUBG 官方素材映射 — 地图、段位、生存称号 */
export {};

/* ─── 地图 ──────────────────────────────── */

export const MAP_INFO: Record<string, { name: string; color: string; emoji: string }> = {
  Erangel_Main:    { name: "艾伦格",   color: "#4ADE80", emoji: "🏝️" },
  Desert_Main:     { name: "米拉玛",   color: "#F59E0B", emoji: "🏜️" },
  Savage_Main:     { name: "萨诺",     color: "#22D3EE", emoji: "🌴" },
  DihorOtok_Main:  { name: "维寒迪",   color: "#E0F2FE", emoji: "❄️" },
  Range_Main:      { name: "卡拉金",   color: "#A78BFA", emoji: "🏔️" },
  Tiger_Main:      { name: "泰戈",     color: "#F97316", emoji: "🐅" },
  Kiki_Main:       { name: "帝斯顿",   color: "#34D399", emoji: "🏙️" },
  Neon_Main:       { name: "荣都",     color: "#F472B6", emoji: "🏮" },
  Paramo_Main:     { name: "帕拉莫",   color: "#FB923C", emoji: "🌋" },
  Baltic_Main:     { name: "艾伦格",   color: "#4ADE80", emoji: "🏝️" },
  Summerland_Main: { name: "卡拉金",   color: "#A78BFA", emoji: "🏔️" },
  Chimera_Main:    { name: "帕拉莫",   color: "#FB923C", emoji: "🌋" },
  Heaven_Main:     { name: "天堂",     color: "#FDE68A", emoji: "🏟️" },
};

/* ─── 段位颜色 ───────────────────────────── */

export const TIER_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  bronze:     { bg: "#8B5E3C", text: "#F5DEB3", label: "青铜" },
  silver:     { bg: "#888888", text: "#E0E0E0", label: "白银" },
  gold:       { bg: "#E6B849", text: "#000000", label: "黄金" },
  platinum:   { bg: "#40C9FF", text: "#000000", label: "铂金" },
  diamond:    { bg: "#185ABD", text: "#FFFFFF", label: "钻石" },
  master:     { bg: "#C4A6FF", text: "#000000", label: "大师" },
  survivor:   { bg: "#FF4D4D", text: "#FFFFFF", label: "生存者" },
  unknown:    { bg: "#555555", text: "#999999", label: "未定级" },
};

/* ─── 生存专精称号 ────────────────────────── */

export const SURVIVAL_TITLES: Record<string, { title: number; name: string }> = {
  UNKNOWN:      { title: 0, name: "未定级" },
  BEGINNER:     { title: 1, name: "初学者" },
  NOVICE:       { title: 2, name: "新手" },
  EXPERIENCED:  { title: 3, name: "熟练者" },
  SKILLED:      { title: 4, name: "精通者" },
  SPECIALIST:   { title: 5, name: "专家" },
  EXPERT:       { title: 6, name: "大师" },
  SURVIVOR:     { title: 7, name: "幸存者" },
  "LONE SURVIVOR": { title: 7, name: "孤胆幸存者" },
};

/** 根据 XP 计算生存专精等级和称号 */
export function getSurvivalLevel(xp: number): { title: string; level: number; tier: number } {
  if (xp >= 6000) return { title: "幸存者", level: 500, tier: 7 };
  if (xp >= 5000) return { title: "大师", level: 500, tier: 6 };
  const brackets = [
    { min: 4000, max: 4999, tier: 5, name: "专家" },
    { min: 3000, max: 3999, tier: 4, name: "精通者" },
    { min: 2000, max: 2999, tier: 3, name: "熟练者" },
    { min: 1000, max: 1999, tier: 2, name: "新手" },
    { min: 1,    max: 999,  tier: 1, name: "初学者" },
  ];
  for (const b of brackets) {
    if (xp >= b.min) {
      const level = b.min === 0 ? 1 : Math.min(500, Math.floor(((xp - b.min) / (b.max - b.min + 1)) * 100) + (b.tier - 1) * 100 + 1);
      return { title: b.name, level, tier: b.tier };
    }
  }
  return { title: "未定级", level: 0, tier: 0 };
}
