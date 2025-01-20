import { Icon } from '@fluentui/react/lib/Icon'
import React from 'react'
import FadeIn from 'react-fade-in'
import { IStatusColumnProps } from '../types'
import styles from './TooltipContent.module.scss'

export const TooltipContent = (props: IStatusColumnProps): JSX.Element => {
  return (
    <FadeIn className={styles.root} delay={250} transitionDuration={300}>
      {props?.status?.sections?.map(({ fieldName, name, value, comment, iconName, color }) => (
        <div key={fieldName} className={styles.section}>
          <div className={styles.iconContainer}>
            <Icon iconName={iconName} styles={{ root: { color } }} />
          </div>
          <div className={styles.body}>
            <div className={styles.name}>{name}</div>
            <div className={styles.value}>{value}</div>
            <div className={styles.comment}>{comment}</div>
          </div>
        </div>
      ))}
      <div className={styles.footer}>Status rapportert {props?.status?.created}</div>
    </FadeIn>
  )
}
