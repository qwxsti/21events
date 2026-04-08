import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { DateGroup } from './components/DateGroup'
import { MainDisplay } from './components/MainDisplay'
import { Sidebar } from './components/Sidebar'
import {
  DEFAULT_DYNAMIC_CONFIG,
  fetchDynamicConfig,
  type DynamicDashboardConfig,
} from './services/configService'
import { authenticate, fetchEvents, type EventItem } from './services/api'

interface GroupedEvents {
  title: string
  events: EventItem[]
}

type RotationItem = { type: 'event'; event: EventItem } | { type: 'ad-slot' }

const Dashboard = styled.div`
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  padding: 16px;
  display: flex;
  gap: 16px;
`

const SidebarContent = styled.div`
  height: 100%;
  display: grid;
  gap: 12px;
  padding: 0 30px;
  align-content: start;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`

const Message = styled.p`
  margin: 0;
  font-size: 16px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Toast = styled.div`
  position: fixed;
  top: 24px;
  right: 24px;
  max-width: 420px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(195, 57, 77, 0.95);
  color: ${({ theme }) => theme.colors.textPrimary};
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
  z-index: 999;
  font-size: 14px;
  line-height: 1.35;
`

const REFRESH_INTERVAL_MS = 30 * 60 * 1000
const TOAST_VISIBLE_MS = 7000

const dayKey = (date: Date) =>
  `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`

const dateLabel = (date: Date, now: Date) => {
  const today = dayKey(now)
  const tomorrowDate = new Date(now)
  tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrow = dayKey(tomorrowDate)
  const value = dayKey(date)

  if (value === today) {
    return 'Сегодня'
  }
  if (value === tomorrow) {
    return 'Завтра'
  }

  const label = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
  }).format(date)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function App() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [config, setConfig] = useState<DynamicDashboardConfig>(
    DEFAULT_DYNAMIC_CONFIG,
  )
  const [error, setError] = useState<string | null>(null)
  const [toastError, setToastError] = useState<string | null>(null)
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)
  const [activeEventIndex, setActiveEventIndex] = useState(0)
  const [adDisplayIndex, setAdDisplayIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const [nowTs, setNowTs] = useState(Date.now())
  const sidebarContentRef = useRef<HTMLDivElement | null>(null)
  const wasAdSlotRef = useRef(false)
  const currentPreloadedAssetRef = useRef<string | null>(null)
  const isLoadingRef = useRef(false)
  const rotationTimerRef = useRef<number | null>(null)

  const getDashboardErrorText = useCallback((loadError: unknown): string => {
    const message =
      loadError instanceof Error ? loadError.message : String(loadError)
    const normalized = message.toLowerCase()

    if (
      normalized.includes('missing credentials') ||
      normalized.includes('auth failed: 401') ||
      normalized.includes('unauthorized')
    ) {
      return 'Ошибка авторизации: проверьте логин/пароль API школы 21.'
    }

    return 'Не удалось обновить события. Проверьте сеть и попробуйте снова.'
  }, [])

  const resolveEventAsset = useCallback(
    (event: EventItem | null): string | null => {
      if (!event) {
        return null
      }
      const haystack =
        `${event.name} ${event.description} ${event.location}`.toUpperCase()
      const pair = Object.entries(config.clubAssets).find(([key]) =>
        haystack.includes(key.toUpperCase()),
      )
      return pair ? pair[1] : null
    },
    [config.clubAssets],
  )

  const loadEvents = useCallback(async () => {
    if (isLoadingRef.current) {
      return
    }
    isLoadingRef.current = true

    try {
      setIsRefreshing(true)
      const token = await authenticate()
      const loadedEvents = await fetchEvents(token)
      const sorted = [...loadedEvents].sort(
        (a, b) =>
          new Date(a.startDateTime).getTime() -
          new Date(b.startDateTime).getTime(),
      )
      setEvents(
        sorted.filter(
          (event) => new Date(event.endDateTime).getTime() > Date.now(),
        ),
      )
      setError(null)
    } catch (loadError) {
      console.error('Failed to load events:', loadError)
      const uiError = getDashboardErrorText(loadError)
      setError(uiError)
      setToastError(uiError)
    } finally {
      isLoadingRef.current = false
      setIsRefreshing(false)
      setHasLoadedOnce(true)
    }
  }, [getDashboardErrorText])

  useEffect(() => {
    if (!toastError) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setToastError(null)
    }, TOAST_VISIBLE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [toastError])

  const loadConfig = useCallback(async () => {
    const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID?.trim()
    if (!sheetId) {
      setConfig(DEFAULT_DYNAMIC_CONFIG)
      setIsConfigLoaded(true)
      return
    }

    try {
      const loadedConfig = await fetchDynamicConfig(sheetId)
      setConfig(loadedConfig)
      setIsConfigLoaded(true)
    } catch (err) {
      console.error('Failed to refresh config:', err)
      // Если не удалось загрузить, оставляем старый конфиг в памяти
    }
  }, [])

  // Первоначальная загрузка конфига и установка таймера на его обновление
  useEffect(() => {
    void loadConfig()

    const configRefreshId = window.setInterval(
      () => {
        void loadConfig()
      },
      15 * 60 * 1000,
    )

    return () => window.clearInterval(configRefreshId)
  }, [loadConfig])

  useEffect(() => {
    if (!isConfigLoaded) {
      return
    }

    void loadEvents()
    const refreshId = window.setInterval(() => {
      void loadEvents()
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(refreshId)
    }
  }, [isConfigLoaded, loadEvents])
  useEffect(() => {
    const tickId = window.setInterval(() => {
      setNowTs(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(tickId)
    }
  }, [])

  useEffect(() => {
    let hideCursorTimer = window.setTimeout(() => {
      document.body.classList.add('cursor-hidden')
    }, 5000)

    const handlePointerActivity = () => {
      document.body.classList.remove('cursor-hidden')
      window.clearTimeout(hideCursorTimer)
      hideCursorTimer = window.setTimeout(() => {
        document.body.classList.add('cursor-hidden')
      }, 5000)
    }

    window.addEventListener('mousemove', handlePointerActivity)
    window.addEventListener('mousedown', handlePointerActivity)
    window.addEventListener('touchstart', handlePointerActivity)

    return () => {
      window.clearTimeout(hideCursorTimer)
      document.body.classList.remove('cursor-hidden')
      window.removeEventListener('mousemove', handlePointerActivity)
      window.removeEventListener('mousedown', handlePointerActivity)
      window.removeEventListener('touchstart', handlePointerActivity)
    }
  }, [])

  const now = useMemo(() => new Date(nowTs), [nowTs])

  const liveEvents = useMemo(
    () =>
      events.filter(
        (event) => new Date(event.endDateTime).getTime() > Date.now(),
      ),
    [events],
  )

  const rotationItems = useMemo<RotationItem[]>(() => {
    if (liveEvents.length === 0) {
      return []
    }

    const mixed: RotationItem[] = []
    const freq = config.adFrequency || 3

    liveEvents.forEach((event, index) => {
      mixed.push({ type: 'event', event })
      if ((index + 1) % freq === 0 && config.schoolAds.length > 0) {
        mixed.push({ type: 'ad-slot' })
      }
    })

    return mixed
  }, [config.schoolAds.length, config.adFrequency, liveEvents])

  const safeIndex =
    rotationItems.length > 0 ? activeEventIndex % rotationItems.length : 0
  const activeSlide = rotationItems[safeIndex] ?? null
  const activeEvent = activeSlide?.type === 'event' ? activeSlide.event : null
  const activeAd =
    activeSlide?.type === 'ad-slot' && config.schoolAds.length > 0
      ? config.schoolAds[adDisplayIndex % config.schoolAds.length]
      : null
  const forcedLiveEventId =
    config.debugMockLive && liveEvents.length > 0 ? liveEvents[0].id : null

  useEffect(() => {
    if (activeSlide?.type === 'ad-slot') {
      wasAdSlotRef.current = true
    } else if (wasAdSlotRef.current) {
      setAdDisplayIndex((prev) => prev + 1)
      wasAdSlotRef.current = false
    }
  }, [activeEventIndex, activeSlide?.type])

  useEffect(() => {
    if (!activeEvent || !sidebarContentRef.current) {
      return
    }

    const activeNode = sidebarContentRef.current.querySelector<HTMLElement>(
      `[data-event-id="${activeEvent.id}"]`,
    )

    activeNode?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeEventIndex, activeEvent])

  useEffect(() => {
    if (rotationItems.length === 0) {
      return
    }
    const nextIndex = (safeIndex + 1) % rotationItems.length
    const nextSlide = rotationItems[nextIndex]
    const nextAsset =
      nextSlide.type === 'event'
        ? resolveEventAsset(nextSlide.event)
        : (config.schoolAds[adDisplayIndex % config.schoolAds.length]
            ?.imageUrl ?? null)

    if (!nextAsset || nextAsset === currentPreloadedAssetRef.current) {
      return
    }

    const img = new Image()
    img.src = nextAsset
    currentPreloadedAssetRef.current = nextAsset
  }, [
    adDisplayIndex,
    config.schoolAds,
    resolveEventAsset,
    rotationItems,
    safeIndex,
  ])

  const groups = useMemo<GroupedEvents[]>(() => {
    const map = new Map<string, EventItem[]>()

    for (const event of liveEvents) {
      const startDate = new Date(event.startDateTime)
      const key = dayKey(startDate)
      const current = map.get(key) ?? []
      current.push(event)
      map.set(key, current)
    }

    return [...map.entries()]
      .sort((a, b) => {
        const first = new Date(a[1][0].startDateTime).getTime()
        const second = new Date(b[1][0].startDateTime).getTime()
        return first - second
      })
      .map(([, groupedEvents]) => ({
        title: dateLabel(new Date(groupedEvents[0].startDateTime), now),
        events: groupedEvents,
      }))
  }, [liveEvents, now])

  const startRotation = useCallback(() => {
    if (rotationItems.length <= 1) return
    rotationTimerRef.current = window.setInterval(() => {
      setActiveEventIndex((prev) => prev + 1)
    }, config.rotationIntervalMs)
  }, [config.rotationIntervalMs, rotationItems.length])

  const handleManualSelect = useCallback(
    (eventId: number) => {
      const index = rotationItems.findIndex(
        (item) => item.type === 'event' && item.event.id === eventId,
      )
      if (index !== -1) {
        setActiveEventIndex(index)
        if (rotationTimerRef.current)
          window.clearInterval(rotationTimerRef.current)
        startRotation()
      }
    },
    [rotationItems, startRotation],
  )

  useEffect(() => {
    startRotation()
    return () => {
      if (rotationTimerRef.current)
        window.clearInterval(rotationTimerRef.current)
    }
  }, [startRotation])

  return (
    <>
      {toastError && <Toast>{toastError}</Toast>}
      <Dashboard>
        <MainDisplay
          activeEvent={activeEvent}
          activeAd={activeAd}
          clubAssets={config.clubAssets}
          tagColors={config.tagColors}
          debugMockLive={config.debugMockLive}
          slideKey={
            activeSlide?.type === 'event'
              ? `event-${activeSlide.event.id}`
              : `ad-${activeAd?.id ?? 'fallback'}`
          }
          activeIndex={safeIndex}
          forcedLiveEventId={forcedLiveEventId}
          duration={config.rotationIntervalMs}
        />
        <Sidebar>
          <SidebarContent ref={sidebarContentRef}>
            {(error || isRefreshing) && (
              <Message>{error ?? 'Обновление данных...'}</Message>
            )}
            {groups.map((group) => (
              <DateGroup
                key={group.title}
                title={group.title}
                events={group.events}
                now={now}
                tagColors={config.tagColors}
                activeEventId={activeEvent?.id ?? null}
                forcedLiveEventId={forcedLiveEventId}
                onEventClick={handleManualSelect}
              />
            ))}
            {!isConfigLoaded && (
              <Message>Загружаем конфигурацию экрана...</Message>
            )}
            {groups.length === 0 &&
              !error &&
              !isRefreshing &&
              !hasLoadedOnce && <Message>Обновление данных...</Message>}
            {groups.length === 0 &&
              !error &&
              !isRefreshing &&
              hasLoadedOnce && (
                <Message>Нет активных ивентов на этой неделе</Message>
              )}
          </SidebarContent>
        </Sidebar>
      </Dashboard>
    </>
  )
}

export default App
