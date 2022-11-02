import { ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './CustomShimmerElementsGroup.module.scss'

export const CustomShimmerElementsGroup: FC = () => {
  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <ShimmerElementsGroup
          shimmerElements={[
            { type: ShimmerElementType.line, width: '100%', height: 10 },
            { type: ShimmerElementType.gap, width: '100%', height: 2 },
            { type: ShimmerElementType.line, width: '80%', height: 10 },
            { type: ShimmerElementType.gap, width: '100%', height: 4 },
            { type: ShimmerElementType.line, width: '100%', height: 10 },
            { type: ShimmerElementType.gap, width: '100%', height: 2 },
            { type: ShimmerElementType.line, width: '80%', height: 10 },
            { type: ShimmerElementType.gap, width: '100%', height: 4 },
            { type: ShimmerElementType.line, width: '100%', height: 10 },
            { type: ShimmerElementType.gap, width: '100%', height: 2 },
            { type: ShimmerElementType.line, width: '80%', height: 10 }
          ]}
        />
      </div>
    </div>

  )
}