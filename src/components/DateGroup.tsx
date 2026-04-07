import { memo } from 'react'
import styled from 'styled-components'
import type { EventItem } from '../services/api'
import type { TagColorItem } from '../services/configService'
import { EventCard } from './EventCard'

interface DateGroupProps {
  title: string
  events: EventItem[]
  now: Date
  tagColors: TagColorItem[]
  activeEventId: number | null
  forcedLiveEventId?: number | null
}

const Wrapper = styled.section`
  display: grid;
  gap: 8px;
`

const Title = styled.h3`
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
  color: ${({ theme }) => theme.colors.textSecondary};
  font-weight: 700;
`

const isNowInRange = (now: Date, startDateTime: string, endDateTime: string) => {
  const start = new Date(startDateTime).getTime()
  const end = new Date(endDateTime).getTime()
  const current = now.getTime()
  return current >= start && current <= end
}

const DateGroupComponent = ({
  title,
  events,
  now,
  tagColors,
  activeEventId,
  forcedLiveEventId = null,
}: DateGroupProps) => {
  return (
    <Wrapper>
      <Title>{title}</Title>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          isNow={
            event.id === forcedLiveEventId ||
            isNowInRange(now, event.startDateTime, event.endDateTime)
          }
          tagColors={tagColors}
          isActive={activeEventId === event.id}
        />
      ))}
    </Wrapper>
  )
}

export const DateGroup = memo(DateGroupComponent)
