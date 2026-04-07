import React from 'react'
import { IStatusColumnProps } from '../types'
import styles from './TooltipContent.module.scss'
import { getFluentIconWithFallback } from 'pp365-shared-library'
import { Divider, Text } from '@fluentui/react-components'

export const TooltipContent = (props: IStatusColumnProps): JSX.Element => {
  if (!props?.status?.sections?.length) return null
  return (
    <div className={styles.root}>
      {props.status.sections.map(({ fieldName, name, value, comment, iconName, color }, idx) => (
        <div
          key={fieldName}
          className={styles.section}
          style={{ animationDelay: `${idx * props.animation.delay}ms` }}
        >
          <div className={styles.iconContainer} style={{ color }}>
            {getFluentIconWithFallback(iconName, true, color)}
          </div>
          <div className={styles.body}>
            <Text weight='semibold' className={styles.name}>
              {name}
            </Text>
            <Text size={200} className={styles.value}>
              {value}
            </Text>
            {comment && (
              <Text size={200} className={styles.comment}>
                {comment}
              </Text>
            )}
          </div>
          {idx < props.status.sections.length - 1 && <Divider className={styles.divider} />}
        </div>
      ))}
      <div className={styles.footer}>
        <Text size={200}>Status rapportert {props.status.created}</Text>
      </div>
    </div>
  )
}
