import { FC } from 'react'
import { IConditionalWrapperProps } from './types'

export const ConditionalWrapper: FC<IConditionalWrapperProps> = ({
  condition,
  wrapper,
  children
}) => (condition ? wrapper(children) : children)
