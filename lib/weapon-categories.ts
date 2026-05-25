/** 武器分类映射 — 用于精通页武器筛选 */

export type WeaponCategory = "ar" | "dmr" | "lmg" | "sg" | "smg" | "sr" | "pistol" | "throwable" | "special";

export interface WeaponCategoryInfo {
  key: WeaponCategory;
  label: string;
}

export const WEAPON_CATEGORIES: WeaponCategoryInfo[] = [
  { key: "ar", label: "突击步枪" },
  { key: "dmr", label: "精确射手步枪" },
  { key: "lmg", label: "轻机枪" },
  { key: "sg", label: "霰弹枪" },
  { key: "smg", label: "冲锋枪" },
  { key: "sr", label: "狙击步枪" },
  { key: "pistol", label: "手枪" },
  { key: "throwable", label: "投掷物" },
  { key: "special", label: "特殊" },
];

/** 武器 ID → 分类映射（基于 PUBG 武器命名规则） */
const CATEGORY_MAP: Record<string, WeaponCategory> = {
  // 突击步枪
  m16a4: "ar", ak47: "ar", scar: "ar", m416: "ar", groza: "ar",
  aug: "ar", beria: "ar", mutant: "ar", qbz: "ar", g36c: "ar",
  famas: "ar", ace32: "ar", k2: "ar", mk47: "ar",
  // 精确射手步枪
  mini14: "dmr", sks: "dmr", slr: "dmr", mk14: "dmr", vss: "dmr",
  mk12: "dmr", qbu: "dmr", dragunov: "dmr",
  // 轻机枪
  m249: "lmg", dp28: "lmg", mg3: "lmg",
  // 霰弹枪
  s686: "sg", s1897: "sg", s12k: "sg", dbs: "sg", pump: "sg",
  // 冲锋枪
  ump45: "smg", vector: "smg", uzi: "smg", tommy: "smg",
  bizon: "smg", mp5k: "smg", mp9: "smg", p90: "smg", js9: "smg",
  // 狙击步枪
  kar98k: "sr", m24: "sr", awm: "sr", win94: "sr", mosin: "sr",
  lynx: "sr",
  // 手枪
  deagle: "pistol", glock: "pistol", p1911: "pistol", p92: "pistol",
  r1895: "pistol", r45: "pistol", scorpion: "pistol", "p18c": "pistol",
  sawedoff: "pistol", flare: "pistol", stun: "pistol",
  // 投掷物
  grenade: "throwable", molotov: "throwable", smoke: "throwable",
  flash: "throwable", bzgrenade: "throwable", c4: "throwable",
  // 特殊 / 近战
  pan: "special", machete: "special", crowbar: "special", sickle: "special",
  crossbow: "special",
};

/** 根据武器 ID 获取分类 */
export function getWeaponCategory(weaponId: string): WeaponCategory {
  const lower = weaponId.toLowerCase().replace("weapon_", "").replace("_c", "");
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return "ar"; // 默认突击步枪
}

/** 武器 ID → 可读名称 */
const WEAPON_READABLE: Record<string, string> = {
  m16a4: "M16A4", ak47: "AKM", scar: "SCAR-L", m416: "M416",
  groza: "Groza", aug: "AUG", beria: "Beryl M762", mutant: "Mk47 Mutant",
  qbz: "QBZ", g36c: "G36C", famas: "FAMAS", ace32: "ACE32", k2: "K2",
  mini14: "Mini14", sks: "SKS", slr: "SLR", mk14: "Mk14", vss: "VSS",
  mk12: "Mk12", dragunov: "Dragunov",
  m249: "M249", dp28: "DP-28", mg3: "MG3",
  s686: "S686", s1897: "S1897", s12k: "S12K", dbs: "DBS",
  ump45: "UMP45", vector: "Vector", uzi: "Micro UZI", tommy: "Tommy Gun",
  bizon: "PP-Bizon", mp5k: "MP5K", mp9: "MP9", p90: "P90", js9: "JS9",
  kar98k: "Kar98k", m24: "M24", awm: "AWM", win94: "Win94", lynx: "Lynx AMR",
  crossbow: "十字弩", pan: "平底锅", machete: "砍刀", crowbar: "撬棍", sickle: "镰刀",
};

export function getWeaponName(weaponId: string): string {
  const lower = weaponId.toLowerCase().replace("weapon_", "").replace("_c", "");
  for (const [key, name] of Object.entries(WEAPON_READABLE)) {
    if (lower.includes(key)) return name;
  }
  return lower.replace(/_/g, " ");
}

/** Tier 转段位名称 */
export function getMasteryTierLabel(tier: number): string {
  const labels = ["新兵", "1段", "2段", "3段", "4段", "5段", "6段", "7段", "8段", "9段", "大师"];
  return labels[Math.min(tier, labels.length - 1)] || `${tier}段`;
}

/** 从 weaponId 构造 PUBG 武器图标 URL（CDN） */
export function getWeaponIconUrl(weaponId: string): string {
  const lower = weaponId.toLowerCase().replace("weapon_", "").replace("_c", "");
  // PUBG 官方 CDN 武器图标
  return `https://pubg-static.akamaized.net/gameassets/Weapons/Item_Weapon_${lower.replace(/_/g, "_")}.png`;
}
