import React, { FC } from 'react'
import styles from './LoadingSkeleton.module.scss'
import { Skeleton, SkeletonItem, SkeletonProps } from '@fluentui/react-components'

export const LoadingSkeleton: FC = (props: Partial<SkeletonProps>) => {
  const percentages = [80, 70, 60, 50, 40, 30, 20]

  const randomPercentage = (useHigh?: boolean) => {
    const length = useHigh ? percentages.length - 3 : percentages.length
    return `${percentages[Math.floor(Math.random() * length)]}%`
  }

  return (
    <div className={styles.root}>
      <Skeleton className={styles.skeleton} {...props} >
        <SkeletonItem size={32} style={{ width: '60%' }} />
        <div className={styles.propertiesRow}>
          {Array.from({ length: 8 }).map(() => (
            <div className={styles.propertyFieldRow}>
              <SkeletonItem size={20} style={{ width: randomPercentage(true) }} />
              <SkeletonItem size={16} style={{ width: randomPercentage() }} />
            </div>
          ))}
        </div>
        <div className={styles.actionRow}>
          {Array.from({ length: 5 }).map(() => (
            <SkeletonItem size={24} />
          ))}
        </div>
        <div className={styles.statusRow}>
          <SkeletonItem size={32} style={{ width: '50%' }} />
          <div className={styles.iconRow}>
            {Array.from({ length: 6 }).map(() => (
              <SkeletonItem shape='square' size={28} />
            ))}
          </div>
        </div>
      </Skeleton>
    </div>
  )
}
