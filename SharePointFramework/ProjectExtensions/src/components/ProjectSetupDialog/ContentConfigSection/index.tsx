import {
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  SearchBox
} from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { Toolbar } from 'pp365-shared-library'
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
    columnSizingOptions,
    showSearch,
    toolbarItems
  } = useContentConfigSection()

  return (
    <div className={styles.root}>
      <div className={styles.commands}>
        {showSearch && (
          <div className={styles.search}>
            <SearchBox
              placeholder={strings.ContentConfigSectionSearchPlaceholder}
              value={searchTerm}
              onChange={(_, { value }) => onSearch(value)}
              size='medium'
              appearance='filled-lighter'
              className={styles.searchBox}
              contentAfter={{ onClick: () => onSearch('') }}
            />
          </div>
        )}
        <Toolbar items={toolbarItems} />
      </div>
      <DataGrid
        items={items}
        columns={columns}
        selectionMode='multiselect'
        selectedItems={selectedRowIds}
        onSelectionChange={onSelectionChange}
        getRowId={(item) => String(item.key)}
        sortable
        resizableColumns
        columnSizingOptions={columnSizingOptions}
        resizableColumnsOptions={{ autoFitColumns: false }}
      >
        <DataGridHeader>
          <DataGridRow selectionCell={{ checkboxIndicator: { 'aria-label': 'Select all' } }}>
            {({ renderHeaderCell }) => (
              <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
            )}
          </DataGridRow>
        </DataGridHeader>
        <DataGridBody>
          {({ item, rowId }) => (
            <DataGridRow
              key={rowId}
              selectionCell={{ checkboxIndicator: { 'aria-label': 'Select row' } }}
            >
              {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
            </DataGridRow>
          )}
        </DataGridBody>
      </DataGrid>
    </div>
  )
}
