import { DetailsList, ScrollablePane, SearchBox, SelectionMode } from '@fluentui/react'
import React, { FunctionComponent } from 'react'
import { ISearchableListProps } from './types'
import styles from './SearchableList.module.scss'
import { useSearchableList } from './useSearchableList'

export const SearchableList: FunctionComponent<ISearchableListProps> = (props) => {
  const { selection, onSearch, onRenderRow } = useSearchableList(props)

  return (
    <div className={styles.root}>
      <SearchBox
        {...props.searchBox}
        onChange={(_, newValue) => onSearch(newValue)}
        onSearch={(newValue) => onSearch(newValue)}
      />
      <div style={{ height: 300 }}>
        <ScrollablePane>
          <DetailsList
            setKey='set'
            selection={selection}
            selectionMode={SelectionMode.multiple}
            selectionPreservedOnEmptyClick={true}
            onRenderRow={onRenderRow}
            items={props.items}
            columns={props.columns}
          />
        </ScrollablePane>
      </div>
    </div>
  )
}
