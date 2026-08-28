import { mergeClasses, Skeleton, SkeletonItem } from '@fluentui/react-components'
import React, { FC } from 'react'
import { PackageListSkeleton } from './PackageList'
import styles from './TemplatePackageCatalog.module.scss'

/**
 * Full-drawer loading skeleton mirroring the loaded layout's big pieces —
 * the two toolbar rows (search + filter dropdowns, then sort/view controls),
 * the card grid in the master column and the detail pane — so nothing reflows
 * when the catalog arrives. The first package is auto-selected on load, so
 * the detail placeholder sketches a package view (thumbnail, title, meta,
 * description, action buttons); it is hidden on mobile like the real pane.
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
