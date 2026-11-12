import { CSSProperties, ReactNode } from 'react'

/**
 * Configures a themed surface with an optional transparent background.
 */
export interface IFluentProps {
  className?: string | undefined
  style?: CSSProperties | undefined
  transparent?: boolean

  children?: ReactNode
}
