import { HTMLProps } from 'react'

/** Shared section layout and background options. */
export interface IBaseSectionProps extends HTMLProps<HTMLDivElement> {
  transparent?: boolean
  noPadding?: boolean
  noMargin?: boolean
}
