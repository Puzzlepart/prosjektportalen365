import React, { FC } from 'react'
import { getFluentIconWithFallback } from '../../icons'
import styles from './StatusMark.module.scss'
import { IStatusMarkProps } from './types'
import { useStatusMark } from './useStatusMark'

/**
 * A small shape beside a status icon, so the status is not told by its colour alone
 * (WCAG 1.4.1): a check, a warning or a cross. It shows in Windows contrast themes too, where the
 * colours give way. Hidden from screen readers, for the icon beside it is named by its status.
 *
 * @param props Props for the component
 */
export const StatusMark: FC<IStatusMarkProps> = (props) => {
  const { mark, size } = useStatusMark(props)
  if (!mark) return null
  return (
    <span className={styles.statusMark} aria-hidden='true' data-status-mark={mark.iconName}>
      {getFluentIconWithFallback(mark.iconName, {
        bundle: false,
        filled: true,
        color: mark.color,
        size
      })}
    </span>
  )
}

StatusMark.displayName = 'StatusMark'
