import { Shimmer, ShimmerElementsGroup, ShimmerElementType } from '@fluentui/react'
import React, { FC, HTMLProps } from 'react'
import styles from './ProjectCard.module.scss'

export const ShimmeredCard: FC<HTMLProps<HTMLDivElement>> = (props) => {
  return (
    <Shimmer
      className={styles.root}
      isDataLoaded={false}
      customElementsGroup={
        <div>
          <div className={styles.shimmerGroup}>
            <ShimmerElementsGroup
              shimmerElements={[
                { type: ShimmerElementType.line, width: '100%', height: props.height as number }
              ]}
            />
            <ShimmerElementsGroup
              shimmerElements={[{ type: ShimmerElementType.gap, width: '100%', height: 10 }]}
            />
          </div>
        </div>
      }
    />
  )
}
