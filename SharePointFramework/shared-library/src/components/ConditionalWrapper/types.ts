import { HTMLProps } from 'react'

/**
 * Supplies the condition and wrapper for conditional child rendering.
 */
export interface IConditionalWrapperProps extends HTMLProps<HTMLDivElement> {
  condition: boolean
  wrapper: (children: any) => any
}
