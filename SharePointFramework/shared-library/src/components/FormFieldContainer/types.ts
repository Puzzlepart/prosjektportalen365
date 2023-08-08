import { ReactNode, HTMLAttributes } from 'react'

export interface IFormFieldContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  description?: string
}
