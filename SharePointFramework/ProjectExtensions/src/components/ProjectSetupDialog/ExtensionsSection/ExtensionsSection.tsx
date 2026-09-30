import { SearchBox } from '@fluentui/react-components'
import strings from 'ProjectExtensionsStrings'
import { DataGridList, Toolbar } from 'pp365-shared-library'
import React from 'react'
import { ProjectSetupDialogSectionComponent } from '../types'
import styles from './ExtensionsSection.module.scss'
import { useExtensionsSection } from './useExtensionsSection'

/**
 * Section for selection of project extensions.
 */
export const ExtensionsSection: ProjectSetupDialogSectionComponent = () => {
  const { items, columns, selectedRowIds, onSelectionChange, searchTerm, onSearch, toolbarItems } =
    useExtensionsSection()

  return (
    <div className={styles.root}>
      <div className={styles.commands}>
        <div className={styles.search}>
          <SearchBox
            placeholder={strings.ExtensionsSectionSearchPlaceholder}
            value={searchTerm}
            onChange={(_, { value }) => onSearch(value)}
            size='large'
            appearance='filled-lighter'
            className={styles.searchBox}
            contentAfter={{ onClick: () => onSearch('') }}
          />
        </div>
        <Toolbar farItems={toolbarItems} />
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
