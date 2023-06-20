import { IUserMessageProps } from './types'
import * as React from 'react'
import { useState } from 'react'
import { UserMessage } from '.'

/**
 * Show a temporarily message
 *
 * @param defaultDuration Default duration
 * @param defaultProps Default props
 */
export function useMessage(
  defaultDuration: number = 5000,
  defaultProps: Partial<IUserMessageProps> = {}
): [
  IUserMessageProps,
  (message: IUserMessageProps, duration?: number) => void
] {
  const [state, setState] = useState<IUserMessageProps | null>(null)

  const props = { ...defaultProps, ...state }
  const element = state ? <UserMessage {...props} /> : null

  /**
   * Set message
   *
   * @param message Message
   * @param duration Duration in ms
   */
  function set(message: IUserMessageProps, duration: number = defaultDuration) {
    setState(message)
    window.setTimeout(() => setState(null), duration)
  }

  return [element as IUserMessageProps, set]
}
