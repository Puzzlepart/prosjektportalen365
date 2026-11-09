import { ReactNode } from 'react'

export interface IPlannerTaskItemPropertyProps {
  label?: string
  value?: string

  /**
   * Content shown below the value.
   */
  children?: ReactNode
}
