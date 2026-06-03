import { format } from '@fluentui/react/lib/Utilities'
import { Button, Text } from '@fluentui/react-components'
import { ChevronLeft20Regular, ChevronRight20Regular } from '@fluentui/react-icons'
import { UserMessage } from 'pp365-shared-library'
import strings from 'PortfolioExtensionsStrings'
import React, { FC } from 'react'
import { PackageCard } from '../PackageCard'
import { useCatalogContext } from '../context'
import { PAGE_SIZE } from '../types'
import styles from './PackageList.module.scss'

export const PackageList: FC = () => {
  const { pagedPackages, filteredPackages, state, pageCount, setPage } = useCatalogContext()

  if (filteredPackages.length === 0) {
    return (
      <div className={styles.empty}>
        <UserMessage
          intent="info"
          title={strings.CatalogEmptyTitle}
          text={strings.CatalogEmptyDescription}
        />
      </div>
    )
  }

  const page = state.page
  const start = (page - 1) * PAGE_SIZE + 1
  const end = Math.min(filteredPackages.length, page * PAGE_SIZE)

  return (
    <div className={styles.list}>
      <div role="list">
        {pagedPackages.map((pkg) => (
          <PackageCard key={pkg.id} package={pkg} />
        ))}
      </div>
      {pageCount > 1 && (
        <div className={styles.pagination}>
          <Button
            appearance="subtle"
            icon={<ChevronLeft20Regular />}
            disabled={page <= 1}
            aria-label={strings.CatalogPaginationPrevious}
            onClick={() => setPage(page - 1)}
          />
          <Text size={200}>
            {format(strings.CatalogPaginationText, start, end, filteredPackages.length)}
          </Text>
          <Button
            appearance="subtle"
            icon={<ChevronRight20Regular />}
            disabled={page >= pageCount}
            aria-label={strings.CatalogPaginationNext}
            onClick={() => setPage(page + 1)}
          />
        </div>
      )}
    </div>
  )
}
