/** 武器分类映射 + 名称 + 图标 — 用于精通页 */

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

/* ─── 分类映射 ────────────────────────── */

const CATEGORY_MAP: Record<string, WeaponCategory> = {
  // 突击步枪
  m16a4: "ar", ak47: "ar", scar: "ar", hk416: "ar", m416: "ar",
  groza: "ar", aug: "ar", beria: "ar", beryl: "ar",
  mutant: "ar", mk47: "ar", qbz: "ar", qbz95: "ar",
  g36c: "ar", famas: "ar", famasg2: "ar", ace32: "ar",
  k2: "ar", fnfal: "ar",
  // 精确射手步枪
  mini14: "dmr", sks: "dmr", slr: "dmr", mk14: "dmr", vss: "dmr",
  mk12: "dmr", qbu: "dmr", qbu88: "dmr", dragunov: "dmr",
  // 轻机枪
  m249: "lmg", dp28: "lmg", mg3: "lmg", dp12: "lmg",
  // 霰弹枪
  s686: "sg", s1897: "sg", s12k: "sg", dbs: "sg", pump: "sg",
  berreta: "sg", saiga12: "sg", sawnoff: "sg", origin: "sg",
  // 冲锋枪
  ump45: "smg", ump: "smg", vector: "smg", uzi: "smg",
  tommy: "smg", thompson: "smg", bizon: "smg", bizonpp19: "smg",
  mp5k: "smg", mp9: "smg", p90: "smg", js9: "smg",
  // 狙击步枪
  kar98k: "sr", m24: "sr", awm: "sr", win94: "sr",
  winchester: "sr", win1894: "sr", mosin: "sr",
  lynx: "sr", l6: "sr",
  // 手枪
  deagle: "pistol", desert: "pistol", glock: "pistol",
  m1911: "pistol", p1911: "pistol", p92: "pistol", m9: "pistol",
  r1895: "pistol", r45: "pistol", scorpion: "pistol",
  "p18c": "pistol", g18: "pistol", sawedoff: "pistol",
  flare: "pistol", stun: "pistol", rhino: "pistol",
  nagant: "pistol", vz61: "pistol",
  // 投掷物
  grenade: "throwable", molotov: "throwable", smoke: "throwable",
  flash: "throwable", bzgrenade: "throwable",
  bluezone: "throwable", c4: "throwable", sticky: "throwable",
  mortar: "throwable",
  // 特殊 / 近战 / 其他
  pan: "special", machete: "special", crowbar: "special",
  sickle: "special", crossbow: "special",
  panzerfaust: "special", panzer: "special",
};

export function getWeaponCategory(weaponId: string): WeaponCategory {
  const lower = weaponId.toLowerCase().replace("item_weapon_", "").replace("_c", "");
  for (const [key, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(key)) return cat;
  }
  return "ar";
}

/* ─── 名称映射 ────────────────────────── */

const NAME_MAP: Record<string, { name: string; emoji: string }> = {
  // 突击步枪
  m16a4: { name: "M16A4", emoji: "🔫" }, ak47: { name: "AKM", emoji: "🔫" },
  scar: { name: "SCAR-L", emoji: "🔫" }, hk416: { name: "M416", emoji: "🔫" },
  m416: { name: "M416", emoji: "🔫" }, groza: { name: "Groza", emoji: "🔫" },
  aug: { name: "AUG", emoji: "🔫" }, beria: { name: "Beryl M762", emoji: "🔫" },
  beryl: { name: "Beryl M762", emoji: "🔫" }, mutant: { name: "Mk47 Mutant", emoji: "🔫" },
  mk47: { name: "Mk47 Mutant", emoji: "🔫" }, qbz: { name: "QBZ", emoji: "🔫" },
  qbz95: { name: "QBZ", emoji: "🔫" }, g36c: { name: "G36C", emoji: "🔫" },
  famas: { name: "FAMAS", emoji: "🔫" }, famasg2: { name: "FAMAS", emoji: "🔫" },
  ace32: { name: "ACE32", emoji: "🔫" }, k2: { name: "K2", emoji: "🔫" },
  fnfal: { name: "FAL", emoji: "🔫" },
  // 精确射手步枪
  mini14: { name: "Mini14", emoji: "🎯" }, sks: { name: "SKS", emoji: "🎯" },
  slr: { name: "SLR", emoji: "🎯" }, mk14: { name: "Mk14", emoji: "🎯" },
  vss: { name: "VSS", emoji: "🎯" }, mk12: { name: "Mk12", emoji: "🎯" },
  qbu: { name: "QBU", emoji: "🎯" }, qbu88: { name: "QBU", emoji: "🎯" },
  dragunov: { name: "Dragunov", emoji: "🎯" },
  // 轻机枪
  m249: { name: "M249", emoji: "🔫" }, dp28: { name: "DP-28", emoji: "🔫" },
  dp12: { name: "DP-12", emoji: "🔫" }, mg3: { name: "MG3", emoji: "🔫" },
  // 霰弹枪
  s686: { name: "S686", emoji: "💥" }, berreta: { name: "S686", emoji: "💥" },
  s1897: { name: "S1897", emoji: "💥" }, s12k: { name: "S12K", emoji: "💥" },
  saiga12: { name: "S12K", emoji: "💥" }, dbs: { name: "DBS", emoji: "💥" },
  sawnoff: { name: "短管霰弹", emoji: "💥" }, origin: { name: "O12", emoji: "💥" },
  // 冲锋枪
  ump: { name: "UMP45", emoji: "⚡" }, ump45: { name: "UMP45", emoji: "⚡" },
  vector: { name: "Vector", emoji: "⚡" }, uzi: { name: "Micro UZI", emoji: "⚡" },
  thompson: { name: "Tommy Gun", emoji: "⚡" }, tommy: { name: "Tommy Gun", emoji: "⚡" },
  bizon: { name: "PP-Bizon", emoji: "⚡" }, bizonpp19: { name: "PP-Bizon", emoji: "⚡" },
  mp5k: { name: "MP5K", emoji: "⚡" }, mp9: { name: "MP9", emoji: "⚡" },
  p90: { name: "P90", emoji: "⚡" }, js9: { name: "JS9", emoji: "⚡" },
  // 狙击步枪
  kar98k: { name: "Kar98k", emoji: "🔭" }, m24: { name: "M24", emoji: "🔭" },
  awm: { name: "AWM", emoji: "🔭" }, win94: { name: "Win94", emoji: "🔭" },
  winchester: { name: "Win94", emoji: "🔭" }, win1894: { name: "Win94", emoji: "🔭" },
  mosin: { name: "Mosin Nagant", emoji: "🔭" }, lynx: { name: "Lynx AMR", emoji: "🔭" },
  l6: { name: "Lynx AMR", emoji: "🔭" },
  // 手枪
  deagle: { name: "沙漠之鹰", emoji: "🔫" }, desert: { name: "沙漠之鹰", emoji: "🔫" },
  m1911: { name: "M1911", emoji: "🔫" }, p1911: { name: "P1911", emoji: "🔫" },
  m9: { name: "M9", emoji: "🔫" }, g18: { name: "G18", emoji: "🔫" },
  nagant: { name: "纳甘M1895", emoji: "🔫" }, rhino: { name: "犀牛左轮", emoji: "🔫" },
  scorpion: { name: "蝎式手枪", emoji: "🔫" }, vz61: { name: "蝎式手枪", emoji: "🔫" },
  // 投掷物
  grenade: { name: "手榴弹", emoji: "💣" }, molotov: { name: "燃烧瓶", emoji: "💣" },
  bluezone: { name: "蓝圈手雷", emoji: "💣" }, c4: { name: "C4", emoji: "💣" },
  sticky: { name: "粘性炸弹", emoji: "💣" }, mortar: { name: "迫击炮", emoji: "💣" },
  // 特殊
  crossbow: { name: "十字弩", emoji: "🏹" }, pan: { name: "平底锅", emoji: "🍳" },
  panzer: { name: "铁拳火箭筒", emoji: "🚀" }, panzerfaust: { name: "铁拳火箭筒", emoji: "🚀" },
};

export function getWeaponName(weaponId: string): string {
  const lower = weaponId.toLowerCase().replace("item_weapon_", "").replace("_c", "");
  for (const [key, val] of Object.entries(NAME_MAP)) {
    if (lower.includes(key)) return val.name;
  }
  // Fallback: 去掉 Item_Weapon_ 前缀和 _C 后缀，替换下划线
  return lower.replace(/_/g, " ");
}

export function getWeaponEmoji(weaponId: string): string {
  const lower = weaponId.toLowerCase().replace("item_weapon_", "").replace("_c", "");
  for (const [key, val] of Object.entries(NAME_MAP)) {
    if (lower.includes(key)) return val.emoji;
  }
  const cat = getWeaponCategory(weaponId);
  const defaults: Record<string, string> = {
    ar: "🔫", dmr: "🎯", lmg: "🔫", sg: "💥",
    smg: "⚡", sr: "🔭", pistol: "🔫", throwable: "💣", special: "🔧",
  };
  return defaults[cat] || "🔫";
}

export function getMasteryTierLabel(tier: number): string {
  const labels = ["新兵", "1段", "2段", "3段", "4段", "5段", "6段", "7段", "8段", "9段", "大师"];
  return labels[Math.min(tier, labels.length - 1)] || `${tier}段`;
}
