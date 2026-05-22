const STEAM_BASE = "https://api.steampowered.com";

function getSteamApiKey(): string {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    throw new Error(
      "STEAM_API_KEY 未设置，请前往 https://steamcommunity.com/dev/apikey 申请"
    );
  }
  return key;
}

export interface SteamBanInfo {
  vacBanned: boolean;
  numberOfVacBans: number;
  daysSinceLastBan: number;
  numberOfGameBans: number;
  communityBanned: boolean;
  economyBan: string;
}

export interface SteamPlayerInfo {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
  pubgPlaytimeMinutes: number;
  pubgPlaytime2wMinutes: number;
  bans: SteamBanInfo;
}

const PUBG_APP_ID = 578080;

/** 安全解析 JSON，失败返回 null */
async function safeJson<T>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** 尝试通过名字作为 vanity URL 解析 Steam ID */
export async function resolveSteamVanityUrl(name: string): Promise<string | null> {
  // 跳过明显不是 vanity URL 的（含特殊字符、纯数字等）
  if (!name || name.length < 2 || /^\d{17}$/.test(name)) return null;
  try {
    const res = await fetch(
      `${STEAM_BASE}/ISteamUser/ResolveVanityURL/v1/?key=${getSteamApiKey()}&vanityurl=${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const steamId = json?.response?.steamid;
    return steamId && steamId !== "0" ? steamId : null;
  } catch {
    return null;
  }
}

/** 通过 Steam64 ID 查询玩家信息 */
export async function fetchSteamPlayer(
  steamId: string
): Promise<SteamPlayerInfo | null> {
  if (!/^\d{17}$/.test(steamId)) return null;

  const KEY = getSteamApiKey();

  const [summaryRes, banRes, ownedRes] = await Promise.allSettled([
    fetch(
      `${STEAM_BASE}/ISteamUser/GetPlayerSummaries/v2/?key=${KEY}&steamids=${steamId}`
    ),
    fetch(
      `${STEAM_BASE}/ISteamUser/GetPlayerBans/v1/?key=${KEY}&steamids=${steamId}`
    ),
    fetch(
      `${STEAM_BASE}/IPlayerService/GetOwnedGames/v1/?key=${KEY}&steamid=${steamId}&include_appinfo=false`
    ),
  ]);

  if (summaryRes.status !== "fulfilled" || !summaryRes.value.ok) return null;

  const summaryJson = await safeJson<{
    response: { players: Array<Record<string, unknown>> };
  }>(summaryRes.value);
  const player = summaryJson?.response?.players?.[0];
  if (!player) return null;

  // 封禁信息
  let bans: SteamBanInfo = {
    vacBanned: false,
    numberOfVacBans: 0,
    daysSinceLastBan: 0,
    numberOfGameBans: 0,
    communityBanned: false,
    economyBan: "none",
  };

  if (banRes.status === "fulfilled" && banRes.value.ok) {
    const banJson = await safeJson<{
      players: Array<Record<string, unknown>>;
    }>(banRes.value);
    const b = banJson?.players?.[0];
    if (b) {
      bans = {
        vacBanned: !!b.VACBanned,
        numberOfVacBans: (b.NumberOfVACBans as number) ?? 0,
        daysSinceLastBan: (b.DaysSinceLastBan as number) ?? 0,
        numberOfGameBans: (b.NumberOfGameBans as number) ?? 0,
        communityBanned: !!b.CommunityBanned,
        economyBan: (b.EconomyBan as string) ?? "none",
      };
    }
  }

  // 游戏时长
  let pubgPlaytimeMinutes = 0;
  let pubgPlaytime2wMinutes = 0;

  if (ownedRes.status === "fulfilled" && ownedRes.value.ok) {
    const ownedJson = await safeJson<{
      response: { games?: Array<{ appid: number; playtime_forever?: number; playtime_2weeks?: number }> };
    }>(ownedRes.value);
    const pubgGame = ownedJson?.response?.games?.find(
      (g) => g.appid === PUBG_APP_ID
    );
    if (pubgGame) {
      pubgPlaytimeMinutes = pubgGame.playtime_forever ?? 0;
      pubgPlaytime2wMinutes = pubgGame.playtime_2weeks ?? 0;
    }
  }

  return {
    steamId,
    personaName: player.personaname as string ?? "",
    avatarUrl: player.avatarfull as string ?? "",
    profileUrl: player.profileurl as string ?? "",
    pubgPlaytimeMinutes,
    pubgPlaytime2wMinutes,
    bans,
  };
}
