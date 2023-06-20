import { Icon } from '@fluentui/react'
import React, { FC } from 'react'
import { ITemplateSelectorItemProps } from './types'
import styles from './TemplateSelectorItem.module.scss'

export const TemplateSelectorItem: FC<ITemplateSelectorItemProps> = ({
  template,
  isHighlighted
}) => {
  return (
    <div className={[styles.root, isHighlighted && styles.isHighlighted].filter(Boolean).join(' ')}>
      <div className={styles.icon}>
        <Icon {...template.iconProps} />
      </div>
      <div className={styles.body}>
        <div className={styles.text}>{template.text}</div>
        <div className={styles.subText}>{template.subText}</div>
      </div>
    </div>
  )
}
