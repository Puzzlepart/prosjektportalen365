import {
  SearchBox,
  SelectAllVisibility,
  Sticky,
  StickyPositionType,
  TooltipHost
} from '@fluentui/react'
import { CounterBadge } from '@fluentui/react-components'
import { format } from '@uifabric/utilities'
import strings from 'ProjectExtensionsStrings'
import React, { FC } from 'react'
import _ from 'underscore'
import styles from './ListHeaderSearch.module.scss'
import { IListHeaderSearchProps } from './types'

export const ListHeaderSearch: FC<IListHeaderSearchProps> = (props) => {
  return (
    <Sticky stickyPosition={StickyPositionType.Header}>
      <div className={styles.headerBar}>
        <div className={styles.searchBox} hidden={props.search?.hidden}>
          <SearchBox
            placeholder={props.search?.placeholder}
            onChange={(_, newValue) => props.search?.onSearch(newValue)}
            onSearch={(newValue) => props.search?.onSearch(newValue)}
          />
        </div>
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
                          <span>{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              }
            }}
          >
            <span className={styles.selectionCountLabel}>
              {format(strings.SelectedCountLabel, props.selectedItems.length)}
              <CounterBadge
                count={props.selectedItems.length}
                color='brand'
                size='small'
                appearance='filled'
                overflowCount={99}
                showZero={false}
                className={styles.selectionBadge}
              />
            </span>
          </TooltipHost>
        </div>
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
