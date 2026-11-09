import * as React from 'react'
import { Skeleton, SkeletonItem } from '@fluentui/react-components'
import type { SkeletonProps } from '@fluentui/react-components'
import strings from 'SharedLibraryStrings'
import styles from './LoadingSkeleton.module.scss'

/** Widths available for a skeleton row, as defined in the stylesheet. */
export type LoadingSkeletonRow = 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'

export interface ILoadingSkeletonProps extends Partial<SkeletonProps> {
  /**
   * The rows to render, top to bottom, as width steps. Defaults to the three
   * rows this component has always rendered, so existing call sites are
   * unaffected. Pass a shorter list where the placeholder stands in for
   * something small, such as a single toolbar.
   */
  rows?: LoadingSkeletonRow[]
}

const DEFAULT_ROWS: LoadingSkeletonRow[] = ['xlarge', 'large', 'medium']

/**
 * Placeholder rows while something loads. Fluent's `Skeleton` is a progress bar to assistive
 * technology, which needs a name (WCAG 4.1.2): "Laster..." unless the caller gives one.
 */
export const LoadingSkeleton = ({ rows = DEFAULT_ROWS, ...props }: ILoadingSkeletonProps) => {
  return (
    <Skeleton className={styles.loadingSkeleton} aria-label={strings.LoadingText} {...props}>
      {rows.map((row, index) => (
        <SkeletonItem key={index} className={styles[row]} />
      ))}
    </Skeleton>
  )
}
