import { CSSProperties, ReactNode } from 'react'

export interface IFluentProps {
  className?: string | undefined
  style?: CSSProperties | undefined
  transparent?: boolean

  /**
   * Content rendered inside the provider.
   */
  children?: ReactNode
}
