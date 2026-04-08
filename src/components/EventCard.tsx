import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import styled, { css } from 'styled-components'
import type { EventItem } from '../services/api'
import { getTagColor, type TagColorItem } from '../services/configService'

interface EventCardProps {
  event: EventItem
  isNow: boolean
  isActive: boolean
  tagColors: TagColorItem[]
  onClick: (id: number) => void
}

const Card = styled(motion.article)<{
  $isNow: boolean
  $isActive: boolean
  $activeAccent: string
}>`
  background: ${({ theme }) => theme.colors.blockBg};
  border-radius: ${({ theme }) => theme.borderRadius};
  border: 2px solid transparent;
  padding: 8px 10px;
  cursor: pointer;
  user-select: none;
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 8px;
  transition: all 0.4s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.innerCard};
  }

  ${({ $isNow, $isActive, theme }) =>
    $isNow &&
    !$isActive &&
    css`
      border-color: ${theme.colors.brandGreen};
      box-shadow: 0 0 0 1px ${theme.colors.brandGreen} inset;
    `}

  ${({ $isActive, $activeAccent }) =>
    $isActive &&
    css`
      border: 2px solid ${$activeAccent};
      box-shadow: 0 0 20px ${$activeAccent}88;
    `}
`

const Time = styled.div`
  font-size: 26px;
  line-height: 1;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.textPrimary};
`

const Meta = styled.div`
  font-size: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
  margin-top: 3px;
`

const Content = styled.div`
  min-width: 0;
  margin-left: 20px;
`

const Heading = styled.h3`
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: ${(props) => props.theme.colors.textPrimary};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.2;
`

const Chips = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 6px 0 0;
`

const Chip = styled.span<{ $bg: string }>`
  border-radius: 999px;
  font-size: 20px;
  padding: 4px 10px;
  background: ${({ $bg }) => $bg};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 600;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const LiveBadge = styled.span`
  border-radius: 999px;
  font-size: 20px;
  padding: 4px 10px;
  background: ${({ theme }) => theme.colors.brandGreen};
  color: ${({ theme }) => theme.colors.textPrimary};
  font-weight: 700;
`

const formatTime = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

const EventCardComponent = ({
  event,
  isNow,
  isActive,
  tagColors,
  onClick,
}: EventCardProps) => {
  const start = formatTime(event.startDateTime)
  const end = formatTime(event.endDateTime)
  const accentColor = useMemo(
    () => getTagColor(event.location ?? '', tagColors),
    [event.location, tagColors],
  )

  return (
    <Card
      $isNow={isNow}
      $isActive={isActive}
      $activeAccent={accentColor}
      data-event-id={event.id}
      onClick={() => onClick(event.id)}
      whileTap={{ scale: 0.98 }}
      animate={{ scale: isActive ? 1.02 : 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div>
        <Time>{start}</Time>
        <Meta>{end}</Meta>
      </div>
      <Content>
        <Heading>{event.name}</Heading>
        <Chips>
          <Chip $bg={accentColor}>{event.location || 'Без локации'}</Chip>
          {isNow && <LiveBadge>Идет сейчас</LiveBadge>}
        </Chips>
      </Content>
    </Card>
  )
}

export const EventCard = memo(EventCardComponent)
