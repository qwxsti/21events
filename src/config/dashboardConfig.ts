export interface SchoolAdItem {
  id: string
  type: 'AD'
  text: string
  subtext: string
  imageUrl?: string
}

export const ROTATION_INTERVAL_MS = 25000
export const DEBUG_MOCK_LIVE = false
export const CLUB_ASSETS: Record<string, string> = {
  'SONIC HUB:': '/clubs_preview/example.jpg',
}

export const TAG_COLORS: Record<string, string> = {
  Орион: '#9D4EDD',
  Erehwon: '#10B981',
  Bellatrix: '#4CC2D7',
  Orion: '#9D4EDD',
}

export const getTagColor = (location: string): string => {
  const normalized = location.toLowerCase()
  const match = Object.entries(TAG_COLORS).find(([key]) =>
    normalized.includes(key.toLowerCase()),
  )
  return match ? match[1] : '#4CC2D7'
}

export const SCHOOL_ADS: SchoolAdItem[] = [
  {
    id: 'ad1',
    type: 'AD',
    text: 'Пройди квартальный опрос!',
    subtext: 'Твой голос важен для развития Школы',
    imageUrl: '/clubs_preview/example.jpg',
  },
  {
    id: 'ad2',
    type: 'AD',
    text: 'Проверь дедлайны проектов',
    subtext: 'Актуальные сроки и новости уже на платформе',
  },
  {
    id: 'ad3',
    type: 'AD',
    text: 'Участвуй в клубной жизни',
    subtext: 'Новые активности открыты для записи каждую неделю',
    imageUrl: '/clubs_preview/example.jpg',
  },
]
