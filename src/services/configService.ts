import Papa from 'papaparse'

export interface SchoolAdItem {
  id: string
  type: 'AD'
  text: string
  subtext: string
  imageUrl?: string
}

export interface TagColorItem {
  keyword: string
  color: string
}

export interface DynamicDashboardConfig {
  rotationIntervalMs: number
  adFrequency: number
  debugMockLive: boolean
  clubAssets: Record<string, string>
  tagColors: TagColorItem[]
  schoolAds: SchoolAdItem[]
}

const SETTINGS_GID = import.meta.env.VITE_GOOGLE_SHEET_GID_SETTINGS ?? '0'
const TAG_COLORS_GID = import.meta.env.VITE_GOOGLE_SHEET_GID_TAG_COLORS ?? '0'
const CLUB_ASSETS_GID = import.meta.env.VITE_GOOGLE_SHEET_GID_CLUB_ASSETS ?? '0'
const SCHOOL_ADS_GID = import.meta.env.VITE_GOOGLE_SHEET_GID_SCHOOL_ADS ?? '0'

const DEFAULT_TAG_COLOR = '#4CC2D7'

export const DEFAULT_DYNAMIC_CONFIG: DynamicDashboardConfig = {
  rotationIntervalMs: 25000,
  adFrequency: 3,
  debugMockLive: false,
  clubAssets: { 'SONIC HUB': '/clubs_preview/example.jpg' },
  tagColors: [
    { keyword: 'Орион', color: '#9D4EDD' },
    { keyword: 'Erehwon', color: '#10B981' },
    { keyword: 'Bellatrix', color: '#4CC2D7' },
  ],
  schoolAds: [
    {
      id: 'ad-def',
      type: 'AD',
      text: 'Загрузка...',
      subtext: 'Синхронизация с Google Sheets',
    },
  ],
}

const buildSheetCsvUrl = (sheetId: string, gid: string) =>
  `https://docs.google.com/spreadsheets/d/e/${sheetId}/pub?gid=${gid}&single=true&output=csv&t=${Date.now()}`

const fetchAndParseSheet = <T>(url: string): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data as T[]),
      error: (err) => reject(err),
    })
  })
}

interface RawSettingsRow {
  key?: string
  value?: string
}
interface RawTagColorRow {
  name?: string
  color?: string
}
interface RawClubAssetRow {
  keyword?: string
  url?: string
}
interface RawSchoolAdRow {
  text?: string
  subtext?: string
  imageUrl?: string
  image?: string
}

export const fetchDynamicConfig = async (
  sheetId: string,
): Promise<DynamicDashboardConfig> => {
  try {
    console.log('[Config] 🔥 Syncing with Google Sheets...')

    const [settingsData, tagsData, assetsData, adsData] = await Promise.all([
      fetchAndParseSheet<RawSettingsRow>(
        buildSheetCsvUrl(sheetId, SETTINGS_GID),
      ),
      fetchAndParseSheet<RawTagColorRow>(
        buildSheetCsvUrl(sheetId, TAG_COLORS_GID),
      ),
      fetchAndParseSheet<RawClubAssetRow>(
        buildSheetCsvUrl(sheetId, CLUB_ASSETS_GID),
      ),
      fetchAndParseSheet<RawSchoolAdRow>(
        buildSheetCsvUrl(sheetId, SCHOOL_ADS_GID),
      ),
    ])

    // 1. Settings
    const settingsMap: Record<string, string> = {}
    settingsData.forEach((item) => {
      const k = (item.key || '').trim().toUpperCase()
      if (k && item.value) settingsMap[k] = item.value
    })

    const rotationIntervalMs = parseInt(settingsMap['ROTATION_INTERVAL_MS'], 10)
    const adFrequency = parseInt(settingsMap['AD_FREQUENCY'], 10)
    const debugMockLive =
      settingsMap['DEBUG_MOCK_LIVE']?.toUpperCase() === 'TRUE'

    // 2. Tag Colors
    const tagColors = tagsData
      .map((t) => ({
        keyword: t.name || '',
        color: t.color || '#4CC2D7',
      }))
      .filter((t) => t.keyword)

    // 3. Club Assets
    const clubAssets: Record<string, string> = {}
    assetsData.forEach((item) => {
      const k = item.keyword
      const v = item.url
      if (k && v) clubAssets[k.trim()] = v.trim()
    })

    // 4. School Ads
    const schoolAds: SchoolAdItem[] = adsData
      .map((ad, index) => ({
        id: `ad-${index}`,
        type: 'AD' as const,
        text: ad.text || '',
        subtext: ad.subtext || '',
        imageUrl: ad.imageUrl || ad.image || undefined,
      }))
      .filter((ad) => ad.text)

    const finalConfig = {
      rotationIntervalMs:
        rotationIntervalMs > 0
          ? rotationIntervalMs
          : DEFAULT_DYNAMIC_CONFIG.rotationIntervalMs,
      adFrequency:
        adFrequency > 0 ? adFrequency : DEFAULT_DYNAMIC_CONFIG.adFrequency,
      debugMockLive,
      tagColors:
        tagColors.length > 0 ? tagColors : DEFAULT_DYNAMIC_CONFIG.tagColors,
      clubAssets:
        Object.keys(clubAssets).length > 0
          ? clubAssets
          : DEFAULT_DYNAMIC_CONFIG.clubAssets,
      schoolAds:
        schoolAds.length > 0 ? schoolAds : DEFAULT_DYNAMIC_CONFIG.schoolAds,
    }

    console.log('[Config] ✅ Dynamic config ready:', finalConfig)
    return finalConfig
  } catch (error) {
    console.error('[Config] ❌ Sync failed, using local defaults:', error)
    return DEFAULT_DYNAMIC_CONFIG
  }
}

export const getTagColor = (
  location: string,
  tagColors: TagColorItem[],
): string => {
  const normalized = location.toLowerCase()
  const match = tagColors.find((item) =>
    normalized.includes(item.keyword?.toLowerCase() || ''),
  )
  return match ? match.color : DEFAULT_TAG_COLOR
}
