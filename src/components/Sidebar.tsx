import styled from 'styled-components'
import type { ReactNode } from 'react'

interface SidebarProps {
  children: ReactNode
}

const Wrapper = styled.aside`
  flex: 1.2;
  height: 100%;
  background: ${({ theme }) => theme.colors.blockBg};
  border-radius: ${({ theme }) => theme.borderRadius};
  overflow: hidden;
`

const Title = styled.h2`
  margin: 0 0 14px;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 700;
  margin: 20px;
  color: ${({ theme }) => theme.colors.textSecondary};
`

const Body = styled.div`
  height: calc(100% - 52px);
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`

export const Sidebar = ({ children }: SidebarProps) => {
  return (
    <Wrapper>
      <Title>Ивенты на этой неделе</Title>
      <Body>{children}</Body>
    </Wrapper>
  )
}
