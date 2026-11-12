import { FC } from 'react'
import { IConditionalWrapperProps } from './types'

/**
 * Applies a wrapper to its children only when the condition holds.
 */
export const ConditionalWrapper: FC<IConditionalWrapperProps> = ({
  condition,
  wrapper,
  children
}) => (condition ? wrapper(children) : children)
