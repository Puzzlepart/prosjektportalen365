import { Icon } from 'office-ui-fabric-react/lib/Icon'
import React from 'react'
import { IStatusElementProps } from './types'
import styles from './StatusElement.module.scss'

export const StatusElement = ({
  iconName,
  label,
  value,
  comment,
  iconSize = 30,
  iconColor
}: IStatusElementProps) => {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.statusIcon} style={{ fontSize: iconSize, color: iconColor }}>
          <Icon iconName={iconName} />
        </div>
        <div className={styles.statusContent}>
          <div className={styles.statusElementLabel}>{label}</div>
          <div className={styles.statusElementValue}>{value}</div>
          {comment && (
            <div
              className={styles.statusElementComment}
              dangerouslySetInnerHTML={{ __html: comment.replace(/\n/g, '<br />') }}></div>
          )}
        </div>
      </div>
    </div>
  )
}
