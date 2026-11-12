import { ReactNode } from 'react'

/** Label, value and optional detail content for a task-preview property. */
export interface IPlannerTaskItemPropertyProps {
  label?: string
  value?: string

  children?: ReactNode
}
