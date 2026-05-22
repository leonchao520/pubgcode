const STORAGE_KEY = "pubgbar_query_history";
const MAX_ITEMS = 100;

export interface LocalQuery {
  input: string;
  type: "name" | "steamid";
  success: boolean;
  createdAt: string; // ISO string
}

function getAll(): LocalQuery[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addQuery(input: string, type: "name" | "steamid", success: boolean) {
  if (typeof window === "undefined") return;
  const list = getAll();
  list.unshift({ input, type, success, createdAt: new Date().toISOString() });
  // 去重 + 限制条数
  const seen = new Set<string>();
  const deduped = list.filter((q) => {
    const key = q.input.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped.slice(0, MAX_ITEMS)));
  } catch { /* quota exceeded, ignore */ }
}

export function getLocalQueries(): LocalQuery[] {
  return getAll();
}

export function searchLocalQueries(q: string, type: string): LocalQuery[] {
  const list = getAll();
  return list.filter((item) => {
    if (q && !item.input.toLowerCase().includes(q.toLowerCase())) return false;
    if (type !== "all" && item.type !== type) return false;
    return true;
  });
}
