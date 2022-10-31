import { Icon } from '@fluentui/react/lib/Icon'
import React, { FC, useContext } from 'react'
import { SectionContext } from '../Sections/context'
import styles from './StatusElement.module.scss'

export const StatusElement: FC = () => {
  const { headerProps } = useContext(SectionContext)
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div
          className={styles.statusIcon}
          style={{ fontSize: headerProps.iconSize, color: headerProps.iconColor }}>
          <Icon iconName={headerProps.iconName} />
        </div>
        <div className={styles.statusContent}>
          <div className={styles.statusElementLabel}>{headerProps.label}</div>
          <div className={styles.statusElementValue}>{headerProps.value}</div>
          {headerProps.comment && (
            <div
              className={styles.statusElementComment}
              dangerouslySetInnerHTML={{
                __html: headerProps.comment.replace(/\n/g, '<br />')
              }}></div>
          )}
        </div>
      </div>
    </div>
  )
}
