import { mergeClasses, Skeleton, SkeletonItem } from '@fluentui/react-components'
import React, { FC } from 'react'
import { PackageListSkeleton } from './PackageList'
import styles from './TemplatePackageCatalog.module.scss'

/**
 * Reserves the catalog toolbar, card grid and desktop detail-pane layout while data loads.
 */
export const CatalogSkeleton: FC = () => (
  <>
    <Skeleton aria-hidden className={styles.skeletonToolbar}>
      <div className={styles.skeletonToolbarRow}>
        <SkeletonItem className={styles.skeletonSearch} />
        <SkeletonItem className={styles.skeletonControl} />
        <SkeletonItem className={styles.skeletonControl} />
        <SkeletonItem className={styles.skeletonControl} />
      </div>
      <div className={styles.skeletonToolbarRow}>
        <SkeletonItem className={styles.skeletonControl} />
        <SkeletonItem className={styles.skeletonToggle} />
      </div>
    </Skeleton>
    <div className={styles.grid}>
      <div className={styles.master}>
        <PackageListSkeleton />
      </div>
      <div className={mergeClasses(styles.detail, styles.detailCollapsedHidden)}>
        <Skeleton aria-hidden className={styles.skeletonDetail}>
          <SkeletonItem shape='rectangle' className={styles.skeletonDetailThumbnail} />
          <SkeletonItem size={24} className={styles.skeletonDetailTitle} />
          <SkeletonItem size={12} className={styles.skeletonDetailMeta} />
          <SkeletonItem size={12} />
          <SkeletonItem size={12} />
          <SkeletonItem size={12} className={styles.skeletonDetailMeta} />
          <div className={styles.skeletonDetailActions}>
            <SkeletonItem className={styles.skeletonControl} />
            <SkeletonItem className={styles.skeletonControl} />
          </div>
        </Skeleton>
      </div>
    </div>
  </>
)
