import { Text } from '@fluentui/react-components'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { IPackageContentItem } from 'models'
import styles from './PackageDetails.module.scss'

export interface IPackageContentSummaryProps {
  /**
   * Content items derived from the downloaded manifest. The catalog itself
   * carries no content summary, so this is empty until a package is
   * downloaded — in which case a muted "available after download" note shows.
   */
  items?: IPackageContentItem[]
}

export const PackageContentSummary: FC<IPackageContentSummaryProps> = ({ items }) => {
  return (
    <div className={styles.section}>
      <Text weight='semibold' className={styles.sectionTitle}>
        {strings.CatalogContentSummaryTitle}
      </Text>
      {items && items.length > 0 ? (
        items.map((item) => (
          <div key={item.key} className={styles.contentItem}>
            <Text>{item.label}</Text>
            {item.description && (
              <Text size={200} className={styles.muted}>
                {item.description}
              </Text>
            )}
          </div>
        ))
      ) : (
        <Text size={200} className={styles.muted}>
          {strings.CatalogContentSummaryUnavailable}
        </Text>
      )}
    </div>
  )
}
