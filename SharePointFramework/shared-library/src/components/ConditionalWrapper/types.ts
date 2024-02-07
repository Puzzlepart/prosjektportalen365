import { HTMLProps } from 'react'

export interface IConditionalWrapperProps extends HTMLProps<HTMLDivElement> {
  condition: boolean
  wrapper: (children: any) => any
}
