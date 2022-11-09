import {
  CommandBar,
  SearchBox,
  SelectAllVisibility,
  Sticky,
  StickyPositionType
} from '@fluentui/react'
import { format } from '@uifabric/utilities'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import styles from './ListHeaderSearch.module.scss'
import { IListHeaderSearchProps } from './types'

/**
 * List header for `<DetailsList />` with a optional `<CommandBar />` with a
 * `<SearchBox />`.
 *
 * @param props Props
 */
export const ListHeaderSearch: FC<IListHeaderSearchProps> = (props) => {
  return (
    <Sticky stickyPosition={StickyPositionType.Header}>
      <CommandBar
        items={[
          {
            key: 'cmdSearchBox',
            onRender: () => (
              <div className={styles.searchBox} hidden={props.search?.hidden}>
                <SearchBox
                  placeholder={props.search?.placeholder}
                  onChange={(_, newValue) => props.search?.onSearch(newValue)}
                  onSearch={(newValue) => props.search?.onSearch(newValue)}
                />
              </div>
            )
          }
        ]}
        farItems={[
          {
            key: 'cmdSelectionCount',
            text: format(strings.CmdSelectionCountText, props.selectedCount)
          }
        ]}
      />
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
