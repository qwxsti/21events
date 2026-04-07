import { QRCodeSVG } from 'qrcode.react'
import { motion } from 'framer-motion'
import styled from 'styled-components'

export interface QrItem {
  url: string
  label: string
}

const Wrapper = styled.div`
  padding: 10px;
  border-radius: 14px;
  background: rgba(29, 38, 51, 0.62);
  backdrop-filter: blur(8px);
  display: grid;
  gap: 8px;
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--qr-cols, 2), minmax(0, 1fr));
  gap: 10px;
`

const QrCard = styled(motion.div)`
  display: grid;
  justify-items: center;
  gap: 6px;
`

const Label = styled.span`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.textPrimary};
  opacity: 0.9;
`

interface SmartQRProps {
  items: QrItem[]
  size?: number
}

export const SmartQR = ({ items, size = 124 }: SmartQRProps) => {
  if (items.length === 0) {
    return null
  }

  return (
    <Wrapper as={motion.div} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
      <Grid style={{ ['--qr-cols' as string]: items.length === 1 ? 1 : 2 }}>
        {items.map((item) => (
          <QrCard
            key={`${item.label}-${item.url}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <QRCodeSVG
              value={item.url}
              size={size}
              bgColor="transparent"
              fgColor="#FFFFFF"
              marginSize={1}
            />
            <Label>{item.label}</Label>
          </QrCard>
        ))}
      </Grid>
    </Wrapper>
  )
}
