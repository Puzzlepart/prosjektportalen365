import { Skeleton, SkeletonItem } from '@fluentui/react-components'
import React, { FC } from 'react'
import styles from './PackageList.module.scss'

/**
 * Number of placeholder cards in the loading grid — roughly one viewport's
 * worth (the real list is unpaginated and scrolls).
 */
const SKELETON_CARD_COUNT = 8

/**
 * Placeholder card shown while the catalog loads — mirrors {@link PackageCard}'s
 * shape (preview image, title line, description line) so the layout doesn't jump
 * when real cards arrive.
 */
const PackageCardSkeleton: FC = () => (
  <Skeleton aria-hidden className={styles.skeletonCard}>
    <SkeletonItem shape='rectangle' className={styles.skeletonPreview} />
    <SkeletonItem className={styles.skeletonTitle} />
    <SkeletonItem className={styles.skeletonText} />
  </Skeleton>
)

/**
 * A grid of {@link PackageCardSkeleton}s (one viewport's worth), used as the
 * loading state in place of a single centered spinner.
 */
export const PackageListSkeleton: FC = () => (
  <div role='presentation' className={styles.grid}>
    {Array.from({ length: SKELETON_CARD_COUNT }).map((_, index) => (
      <div key={index} className={styles.cell}>
        <PackageCardSkeleton />
      </div>
    ))}
  </div>
)
