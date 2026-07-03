import * as strings from 'ProjectWebPartsStrings'
import React, { FC } from 'react'
import { Text } from '@fluentui/react-components'
import { DocumentMultiple16Regular, ListBar16Regular } from '@fluentui/react-icons'
import { format } from '@fluentui/react'
import { FileTypeIcon } from 'pp365-shared-library'
import styles from './ArchiveSelection.module.scss'
import { IArchiveItem } from './types'

export interface ISelectionSummaryProps {
  total: number
  documentsSelected: number
  listsSelected: number
  /**
   * Optional items to list on the right side (icon + title). Omit to show only
   * the count summary.
   */
  selectedItems?: IArchiveItem[]
}

/**
 * Read-only recap of what the user has selected to archive — a big count plus a
 * per-scope breakdown and, optionally, the list of selected items. Shown in the
 * dialog's confirm step and in the phase-change confirm view.
 */
export const SelectionSummary: FC<ISelectionSummaryProps> = ({
  total,
  documentsSelected,
  listsSelected,
  selectedItems
}) => {
  const isEmpty = total === 0
  const showItems = (selectedItems?.length ?? 0) > 0
  return (
    <div className={`${styles.summary} ${isEmpty ? styles.empty : ''}`}>
      <div className={styles.summaryLeft}>
        <Text className={styles.summaryNumber}>{total}</Text>
        <div className={styles.summaryDivider} />
        <div className={styles.summaryBody}>
          <Text className={styles.summaryLabel}>
            {isEmpty ? strings.ArchiveSummaryEmpty : strings.ArchiveSummarySelectedLabel}
          </Text>
          {!isEmpty && (
            <div className={styles.summaryBreakdown}>
              <span className={styles.breakdownItem}>
                <DocumentMultiple16Regular className={styles.breakdownIcon} />
                <span>{format(strings.ArchiveSummaryDocumentCount, documentsSelected)}</span>
              </span>
              <span className={styles.dot}>·</span>
              <span className={styles.breakdownItem}>
                <ListBar16Regular className={styles.breakdownIcon} />
                <span>{format(strings.ArchiveSummaryListCount, listsSelected)}</span>
              </span>
            </div>
          )}
          <Text className={styles.summaryHelp}>
            {isEmpty ? strings.ArchiveSummaryEmptyHelp : strings.ArchiveSummaryHelpText}
          </Text>
        </div>
      </div>
      {showItems && (
        <>
          <div className={styles.summaryDivider} />
          <div className={styles.summaryRight}>
            <Text className={styles.summaryItemsHeader}>
              {strings.ArchiveSummarySelectedItemsHeader}
            </Text>
            <div className={styles.summaryItemsList}>
              {selectedItems.map((item) => (
                <div key={`${item.type}-${item.id}`} className={styles.summaryItem}>
                  {item.type === 'list' ? (
                    <ListBar16Regular className={styles.summaryItemIcon} />
                  ) : (
                    <FileTypeIcon
                      extension={item.title}
                      size={16}
                      className={styles.summaryItemIcon}
                    />
                  )}
                  <span className={styles.summaryItemTitle} title={item.title}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
