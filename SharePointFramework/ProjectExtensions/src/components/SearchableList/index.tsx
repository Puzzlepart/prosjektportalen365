import { DetailsList, SearchBox, SelectionMode } from '@fluentui/react'
import React, { FunctionComponent } from 'react'
import styles from './SearchableList.module.scss'
import { ISearchableListProps } from './types'
import { useSearchableList } from './useSearchableList'

export const SearchableList: FunctionComponent<ISearchableListProps> = (props) => {
  const { selection, onSearch, onRenderRow } = useSearchableList(props)

  return (
    <div className={styles.root}>
      <DetailsList
        styles={{ root: { height: 450 } }}
        setKey='set'
        selection={selection}
        selectionMode={SelectionMode.multiple}
        selectionPreservedOnEmptyClick={true}
        onRenderRow={onRenderRow}
        onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
          <div>
            <div style={{ marginTop: 10 }}>
              <SearchBox
                {...props.searchBox}
                onChange={(_, newValue) => onSearch(newValue)}
                onSearch={(newValue) => onSearch(newValue)}
              />
            </div>
            {defaultRender(detailsHeaderProps)}
          </div>
        )}
        items={props.items}
        columns={props.columns}
      />
    </div>
  )
}

SearchableList.defaultProps = {
  searchBox: {},
  selectedKeys: []
}
