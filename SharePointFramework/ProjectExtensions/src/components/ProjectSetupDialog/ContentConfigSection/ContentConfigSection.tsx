import { SearchBox } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { DataGridList, getFluentIcon } from 'pp365-shared-library'
import React from 'react'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './ContentConfigSection.module.scss'
import { useContentConfigSection } from './useContentConfigSection'

/**
 * Section for selection of content configurations.
 */
export const ContentConfigSection: ProjectSetupDialogSectionComponent = () => {
  const {
    items,
    columns,
    selectedRowIds,
    onSelectionChange,
    searchTerm,
    onSearch,
    selectedCountText
  } = useContentConfigSection()

  return (
    <div className={styles.root}>
      <div className={styles.commands}>
        <div className={styles.search}>
          <SearchBox
            placeholder={strings.ContentConfigSectionSearchPlaceholder}
            aria-label={strings.ContentConfigSectionSearchLabel}
            value={searchTerm}
            onChange={(_, { value }) => onSearch(value)}
            size='large'
            appearance='filled-lighter'
            className={styles.searchBox}
            contentAfter={{ onClick: () => onSearch('') }}
          />
        </div>
        <span className={styles.selectedCount} role='status'>
          {getFluentIcon('CheckmarkCircle', { size: 20 })}
          {selectedCountText}
        </span>
      </div>
      <DataGridList
        items={items}
        columns={columns}
        getRowId={(item) => String(item.key)}
        selectionMode='multiselect'
        selectedItems={selectedRowIds}
        onSelectionChange={onSelectionChange}
        sortable
      />
    </div>
  )
}
