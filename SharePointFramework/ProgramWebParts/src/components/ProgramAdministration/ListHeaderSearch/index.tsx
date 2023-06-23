import {
  CommandBar,
  Link,
  SearchBox,
  SelectAllVisibility,
  Sticky,
  StickyPositionType,
  TooltipHost
} from '@fluentui/react'
import { format } from '@uifabric/utilities'
import strings from 'ProgramWebPartsStrings'
import React, { FC } from 'react'
import styles from './ListHeaderSearch.module.scss'
import { IListHeaderSearchProps } from './types'
import _ from 'underscore'

/**
 * List header for `<DetailsList />` with a optional `<CommandBar />` with a
 * `<SearchBox />` and a `<TooltipHost />` showing the selected items and
 * the count of selected items.
 *
 * @param props Props
 */
export const ListHeaderSearch: FC<IListHeaderSearchProps> = (props) => {
  return (
    <Sticky stickyPosition={StickyPositionType.Header}>
      <CommandBar
        styles={{ root: { padding: 0 } }}
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
            onRender: () => (
              <div className={styles.selectionCount}>
                <TooltipHost
                  calloutProps={{
                    isBeakVisible: !_.isEmpty(props.selectedItems)
                  }}
                  tooltipProps={{
                    onRenderContent: () => {
                      if (_.isEmpty(props.selectedItems)) return null
                      return (
                        <div
                          className={styles.selectionCountTooltip}
                          hidden={_.isEmpty(props.selectedItems)}
                        >
                          <p>{strings.CmdSelectionCountTooltipText}</p>
                          <ul>
                            {props.selectedItems.map((item) => (
                              <li key={item.key}>
                                <Link href={item.SPWebURL} target='_blank'>
                                  {item.Title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    }
                  }}
                >
                  {format(strings.CmdSelectionCountText, props.selectedItems.length)}
                </TooltipHost>
              </div>
            )
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
