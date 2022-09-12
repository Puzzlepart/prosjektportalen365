import { IUserMessageProps } from './types'
import React, { useState } from 'react'
import { UserMessage } from '.'

/**
 * Show a temporarily message
 * 
 * @param {number} defaultDuration Default duration
 * @param {IUserMessageProps} defaultProps Default props
 */
export function useMessage(defaultDuration: number = 5000, defaultProps: Partial<IUserMessageProps> = {}): [IUserMessageProps, (message: IUserMessageProps, duration?: number) => void] {
  const [state, setState] = useState<IUserMessageProps | null>(null)

  const props = { ...defaultProps, ...state }
  const element = state ? <UserMessage {...props} /> : null

  /**
   * Set message
   *
   * @param {IUserMessageProps} message Message
   * @param {number} duration Duration in ms
   */
  function set(message: IUserMessageProps, duration: number = defaultDuration) {
    setState(message)
    window.setTimeout(() => setState(null), duration)
  }

  return [element as IUserMessageProps, set]
}