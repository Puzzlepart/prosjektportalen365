import { Icon } from '@fluentui/react'
import React, { FunctionComponent } from 'react'
import { ITemplateSelectorItemProps } from './types'
import styles from './TemplateSelectorItem.module.scss'

export const TemplateSelectorItem: FunctionComponent<ITemplateSelectorItemProps> = (props) => {
  return (
    <div
      className={[styles.root, props.isHighlighted ?? styles.isHighlighted]
        .filter(Boolean)
        .join(' ')}>
      <div className={styles.icon}>
        <Icon iconName={props.template.iconName} />
      </div>
      <div className={styles.body}>
        <div className={styles.text}>{props.template.text}</div>
        <div className={styles.subText}>{props.template.subText}</div>
      </div>
    </div>
  )
}
