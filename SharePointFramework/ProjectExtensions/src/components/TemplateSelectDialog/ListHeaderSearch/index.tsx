import { SearchBox, SelectAllVisibility, Sticky, StickyPositionType } from '@fluentui/react'
import React, { FC } from 'react'
import styles from './ListHeaderSearch.module.scss'
import { IListHeaderSearchProps } from './types'

/**
 * List header for `<DetailsList />` with a optional `<SearchBox />`
 *
 * @param props Props
 */
export const ListHeaderSearch: FC<IListHeaderSearchProps> = (props) => {
  return (
    <Sticky stickyPosition={StickyPositionType.Header}>
      <div className={styles.searchBox} hidden={props.search?.hidden}>
        <SearchBox
          placeholder={props.search?.placeholder}
          onChange={(_, newValue) => props.search?.onSearch(newValue)}
          onSearch={(newValue) => props.search?.onSearch(newValue)}
        />
      </div>
      {props.defaultRender({
        ...props.detailsHeaderProps,
        selectAllVisibility: props.selectAllVisibility
      })}
    </Sticky>
  )
}

ListHeaderSearch.defaultProps = {
  search: {
    hidden: true,
    placeholder: '',
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onSearch: () => {}
  },
  selectAllVisibility: SelectAllVisibility.hidden
}
