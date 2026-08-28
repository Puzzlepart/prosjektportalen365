import { Button } from '@fluentui/react-components'
import { UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { PackageCard } from '../PackageCard'
import { useCatalogContext } from '../context'
import styles from './PackageList.module.scss'

export const PackageList: FC = () => {
  const { filteredPackages, state, hasActiveFilters, clearFilters } = useCatalogContext()

  if (filteredPackages.length === 0) {
    return (
      <div className={styles.empty}>
        {hasActiveFilters ? (
          <>
            <UserMessage
              intent='info'
              title={strings.CatalogNoResultsTitle}
              text={strings.CatalogNoResultsDescription}
            />
            <Button appearance='secondary' className={styles.clearButton} onClick={clearFilters}>
              {strings.CatalogClearFiltersText}
            </Button>
          </>
        ) : (
          <UserMessage
            intent='info'
            title={strings.CatalogEmptyTitle}
            text={strings.CatalogEmptyDescription}
          />
        )}
      </div>
    )
  }

  const layoutClass = state.renderMode === 'grid' ? styles.grid : styles.column

  // All matches render at once — the master pane scrolls (no pagination).
  return (
    <div className={styles.list}>
      <div role='list' className={layoutClass}>
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} role='presentation' className={styles.cell}>
            <PackageCard package={pkg} />
          </div>
        ))}
      </div>
    </div>
  )
}
