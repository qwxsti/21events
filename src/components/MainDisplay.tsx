import { memo, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import styled from 'styled-components'
import type { EventItem } from '../services/api'
import {
  getTagColor,
  type TagColorItem,
  type SchoolAdItem,
} from '../services/configService'
import { SmartQR, type QrItem } from './SmartQR'

interface MainDisplayProps {
  activeEvent: EventItem | null
  activeAd: SchoolAdItem | null
  clubAssets: Record<string, string>
  tagColors: TagColorItem[]
  debugMockLive: boolean
  slideKey: string
  activeIndex: number
  forcedLiveEventId?: number | null
}

const Wrapper = styled.main`
  position: relative;
  flex: 2.8;
  height: 100%;
  border-radius: ${({ theme }) => theme.borderRadius};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bg};
`

const Slide = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: ${({ theme }) => `
    radial-gradient(circle at 20% 20%, ${theme.colors.brandPurple} 0%, transparent 45%),
    radial-gradient(circle at 75% 30%, ${theme.colors.brandGreen} 0%, transparent 40%),
    radial-gradient(circle at 60% 80%, ${theme.colors.brandBlue} 0%, transparent 45%),
    ${theme.colors.bg}
  `};
`

const BackgroundImage = styled.img`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transform: translateZ(0);
  will-change: opacity;
`

const GradientFlow = styled.div`
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle at 30% 35%, rgba(255, 255, 255, 0.14), transparent 45%),
    radial-gradient(circle at 70% 65%, rgba(255, 255, 255, 0.1), transparent 40%);
  filter: blur(12px);
`

const Overlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: linear-gradient(
    165deg,
    rgba(29, 38, 51, 0.2) 0%,
    rgba(29, 38, 51, 0.8) 65%,
    rgba(29, 38, 51, 0.95) 100%
  );
`

const Content = styled.div`
  position: absolute;
  left: 30px;
  right: 30px;
  top: 28px;
  bottom: 30px;
  z-index: 1;
  display: grid;
  align-content: end;
`

const TextMotion = styled(motion.div)`
  display: grid;
  gap: 12px;
`

const QrHolder = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 2;
  max-width: 280px;
`

const MeshLayer = styled(motion.div)<{ $color: string }>`
  position: absolute;
  border-radius: 999px;
  filter: blur(72px);
  background: ${({ $color }) => $color};
  opacity: 0.55;
  transform: translateZ(0);
  will-change: opacity, transform;
`

const Label = styled.p`
  margin: 0;
  font-size: 28px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const PillsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
`

const Pill = styled.span<{ $bg?: string }>`
  display: inline-flex;
  width: fit-content;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  background: ${({ $bg }) => $bg ?? 'rgba(255, 255, 255, 0.16)'};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const StatusBadge = styled.span<{ $isLive: boolean }>`
  display: inline-flex;
  width: fit-content;
  padding: 8px 18px;
  border-radius: 999px;
  font-size: 28px;
  font-weight: 700;
  background: ${({ $isLive, theme }) =>
    $isLive ? theme.colors.brandGreen : theme.colors.brandBlue};
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Title = styled.h1`
  margin: 0;
  font-size: clamp(5rem, 4.2vw, 8.2rem);
  line-height: 1.04;
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 700;
`

const Description = styled.p`
  margin: 2px 0 0;
  max-width: 100%;
  font-size: clamp(2rem, 2.0vw, 2.5rem);
  line-height: 1.35;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const formatDateTime = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

const resolveClubAsset = (
  event: EventItem | null,
  clubAssets: Record<string, string>,
) => {
  if (!event) {
    return null
  }

  const haystack = `${event.name} ${event.location} ${event.description}`.toUpperCase()
  const match = Object.entries(clubAssets).find(([clubKey]) =>
    haystack.includes(clubKey.toUpperCase()),
  )

  return match ? match[1] : null
}

const isEventLive = (
  event: EventItem | null,
  forcedLiveEventId: number | null,
  debugMockLive: boolean,
) => {
  if (!event) {
    return false
  }
  if (debugMockLive && event.id === forcedLiveEventId) {
    return true
  }
  const now = Date.now()
  const start = new Date(event.startDateTime).getTime()
  const end = new Date(event.endDateTime).getTime()
  return now >= start && now <= end
}

const extractUrls = (text: string) => {
  const matches = text.match(/https?:\/\/[^\s]+/giu)
  return matches ?? []
}

const hostFromUrl = (url: string) => {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace(/^www\./iu, '')
  } catch {
    return 'Ссылка'
  }
}

const buildQrItems = (event: EventItem | null): QrItem[] => {
  if (!event) {
    return []
  }

  const locationUrls = extractUrls(event.location).map((url) => ({
    url,
    label: hostFromUrl(url),
  }))
  const descriptionUrls = extractUrls(event.description).map((url) => ({
    url,
    label: hostFromUrl(url),
  }))

  const dedup = new Map<string, QrItem>()
  ;[...locationUrls, ...descriptionUrls].forEach((item) => {
    if (!dedup.has(item.url)) {
      dedup.set(item.url, item)
    }
  })

  return [...dedup.values()]
}

const MainDisplayComponent = ({
  activeEvent,
  activeAd,
  clubAssets,
  tagColors,
  debugMockLive,
  slideKey,
  activeIndex,
  forcedLiveEventId = null,
}: MainDisplayProps) => {
  const clubAsset = useMemo(
    () => resolveClubAsset(activeEvent, clubAssets),
    [activeEvent, clubAssets],
  )
  const adImage = activeAd?.imageUrl
  const imageUrl = adImage ?? clubAsset
  const isLive = useMemo(
    () => isEventLive(activeEvent, forcedLiveEventId, debugMockLive),
    [activeEvent, debugMockLive, forcedLiveEventId],
  )
  const qrItems = useMemo(
    () => (activeAd ? [] : buildQrItems(activeEvent)),
    [activeAd, activeEvent],
  )
  const locationColor = useMemo(
    () => getTagColor(activeEvent?.location ?? '', tagColors),
    [activeEvent?.location, tagColors],
  )
  const paletteSeed = (activeEvent?.id ?? activeIndex) % 3
  const meshPalette = useMemo(
    () =>
    paletteSeed === 0
      ? ['rgba(157, 78, 221, 0.95)', 'rgba(76, 194, 215, 0.88)', 'rgba(93, 114, 255, 0.72)', 'rgba(134, 70, 255, 0.62)']
      : paletteSeed === 1
        ? ['rgba(16, 185, 129, 0.92)', 'rgba(76, 194, 215, 0.88)', 'rgba(29, 125, 159, 0.72)', 'rgba(41, 180, 147, 0.62)']
        : ['rgba(241, 90, 181, 0.9)', 'rgba(157, 78, 221, 0.84)', 'rgba(76, 194, 215, 0.76)', 'rgba(201, 81, 219, 0.62)'],
    [paletteSeed],
  )

  return (
    <Wrapper>
      <AnimatePresence mode="wait" initial={false}>
        {qrItems.length > 0 && (
          <QrHolder as={motion.div} key={`qr-${slideKey}`} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            <SmartQR items={qrItems} />
          </QrHolder>
        )}
      </AnimatePresence>
      <AnimatePresence mode="wait" initial={false}>
        <Slide
          key={slideKey}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {imageUrl && <BackgroundImage src={imageUrl} alt="" loading="eager" />}
          {!imageUrl && (
            <>
              <GradientFlow />
              <MeshLayer
                $color={meshPalette[0]}
                style={{ width: 460, height: 460, top: '-4%', left: '-3%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.55 }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
              <MeshLayer
                $color={meshPalette[1]}
                style={{ width: 540, height: 540, top: '28%', right: '-6%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
              <MeshLayer
                $color={meshPalette[2]}
                style={{ width: 480, height: 480, bottom: '-14%', left: '26%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.52 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
              <MeshLayer
                $color={meshPalette[3]}
                style={{ width: 420, height: 420, top: '10%', left: '35%' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.46 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
              />
            </>
          )}
          <Overlay
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
          <Content>
            <AnimatePresence mode="wait" initial={false}>
              <TextMotion
                key={slideKey}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                {activeAd ? (
                  <>
                    <Label>Объявление школы</Label>
                    <Title>{activeAd.text}</Title>
                    <Description>{activeAd.subtext}</Description>
                  </>
                ) : (
                  <>
                    <PillsRow>
                      <Pill $bg={locationColor}>{activeEvent?.location ?? 'Локация'}</Pill>
                      <Pill>
                        {activeEvent
                          ? formatDateTime(activeEvent.startDateTime)
                          : 'Дата уточняется'}
                      </Pill>
                      {isLive && <StatusBadge $isLive>ИДЕТ СЕЙЧАС</StatusBadge>}
                    </PillsRow>
                    <Title>{activeEvent?.name ?? 'Ивенты скоро появятся'}</Title>
                    <Description>
                      {activeEvent?.description || 'Описание события скоро появится.'}
                    </Description>
                  </>
                )}
              </TextMotion>
            </AnimatePresence>
          </Content>
        </Slide>
      </AnimatePresence>
    </Wrapper>
  )
}

export const MainDisplay = memo(
  MainDisplayComponent,
  (prev, next) =>
    prev.slideKey === next.slideKey &&
    prev.activeIndex === next.activeIndex &&
    prev.debugMockLive === next.debugMockLive &&
    prev.clubAssets === next.clubAssets &&
    prev.tagColors === next.tagColors &&
    prev.forcedLiveEventId === next.forcedLiveEventId &&
    prev.activeEvent?.id === next.activeEvent?.id &&
    prev.activeAd?.id === next.activeAd?.id,
)
