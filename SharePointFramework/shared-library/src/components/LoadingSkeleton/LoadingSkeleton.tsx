import * as React from 'react'
import { Skeleton, SkeletonItem } from '@fluentui/react-components'
import type { SkeletonProps } from '@fluentui/react-components'
import styles from './LoadingSkeleton.module.scss'

export const LoadingSkeleton = (props: Partial<SkeletonProps>) => {
  return (
    <Skeleton className={styles.loadingSkeleton} {...props}>
      <SkeletonItem className={styles.xlarge} />
      <SkeletonItem className={styles.large} />
      <SkeletonItem className={styles.medium} />
    </Skeleton>
  )
}
