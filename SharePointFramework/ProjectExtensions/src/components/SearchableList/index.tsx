import { DetailsList, ScrollablePane, SearchBox, SelectionMode, Sticky, StickyPositionType } from '@fluentui/react'
import React, { FunctionComponent } from 'react'
import { ISearchableListProps } from './types'
import styles from './SearchableList.module.scss'
import { useSearchableList } from './useSearchableList'

export const SearchableList: FunctionComponent<ISearchableListProps> = (props) => {
  const { selection, onSearch, onRenderRow } = useSearchableList(props)

  return (
    <div className={styles.root}>
      <div style={{ height: 450 }}>
        <ScrollablePane>
          <DetailsList
            setKey='set'
            selection={selection}
            selectionMode={SelectionMode.multiple}
            selectionPreservedOnEmptyClick={true}
            onRenderRow={onRenderRow}
            onRenderDetailsHeader={(detailsHeaderProps, defaultRender) => (
              <Sticky stickyPosition={StickyPositionType.Header} >
                <SearchBox
                  {...props.searchBox}
                  className={styles.searchBox}
                  onChange={(_, newValue) => onSearch(newValue)}
                  onSearch={(newValue) => onSearch(newValue)}
                />
                {defaultRender(detailsHeaderProps)}
              </Sticky>
            )}
            items={props.items}
            columns={props.columns}
          />
        </ScrollablePane>
      </div>
    </div>
  )
}

SearchableList.defaultProps = {
  searchBox: {},
  selectedKeys: []
}
