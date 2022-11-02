import { HTMLProps } from 'react'

export interface IBaseSectionProps extends HTMLProps<HTMLDivElement> {
  transparent?: boolean
  noPadding?: boolean
  noMargin?: boolean
}
