/* ─── 玩家页工具函数 ────────────────────── */

/** 段位颜色 */
export function getTierColor(tier: string): string {
  const t = tier.toLowerCase();
  if (t.includes("bronze")) return "#8B5E3C";
  if (t.includes("silver")) return "#888";
  if (t.includes("gold")) return "#E6B849";
  if (t.includes("platinum")) return "#40C9FF";
  if (t.includes("diamond")) return "#185ABD";
  if (t.includes("master")) return "#C4A6FF";
  if (t.includes("survivor")) return "#FF4D4D";
  return "#555";
}

/** 段位中文名 */
export function getTierLabel(tier: string): string {
  const map: Record<string, string> = {
    Survivor: "生存者", Master: "大师", Diamond: "钻石",
    Platinum: "铂金", Gold: "黄金", Silver: "白银", Bronze: "青铜",
  };
  return map[tier] || tier;
}

/** 段位图标路径 */
export function getTierImage(tier: string, subTier: string): string {
  const t = tier?.toLowerCase() || "";
  const s = subTier || "1";
  if (t.includes("master")) return "/assets/tiers/Master.png";
  if (t.includes("bronze")) return `/assets/tiers/Bronze-${s}.png`;
  if (t.includes("silver")) return `/assets/tiers/Silver-${s}.png`;
  if (t.includes("gold")) return `/assets/tiers/Gold-${s}.png`;
  if (t.includes("platinum")) return `/assets/tiers/Platinum-${s}.png`;
  if (t.includes("diamond")) return `/assets/tiers/Diamond-${s}.png`;
  if (t.includes("survivor")) return "/assets/tiers/Survivor.png";
  return "/assets/tiers/Unranked.png";
}

/** 段位子级（罗马数字） */
export function getSubTierLabel(subTier: string): string {
  const map: Record<string, string> = { "1": "Ⅰ", "2": "Ⅱ", "3": "Ⅲ", "4": "Ⅳ", "5": "Ⅴ" };
  return map[subTier] || subTier;
}

/** 生存等级 */
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
