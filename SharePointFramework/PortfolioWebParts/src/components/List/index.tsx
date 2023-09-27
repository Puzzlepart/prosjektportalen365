import {
  ConstrainMode,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import { Themed } from 'pp365-shared-library'
import React, { FC } from 'react'
import { ListContext } from './context'
import { IListProps } from './types'
import { useList } from './useList'

/**
 * List component using `ShimmeredDetailsList` from `@fluentui/react`.
 *
 * @param props List properties
 */
export const List: FC<IListProps<any>> = (props) => {
  const listProps = useList(props)
  return (
    <Themed>
      <ListContext.Provider value={{ props: listProps }}>
        <ScrollablePane {...props.scrollablePane}>
          <MarqueeSelection selection={props.selection}>
            <ShimmeredDetailsList {...listProps} />
          </MarqueeSelection>
          {props.layerHostId && <LayerHost id={props.layerHostId} />}
        </ScrollablePane>
      </ListContext.Provider>
    </Themed>
  )
}

List.defaultProps = {
  items: [],
  columns: [],
  menuItems: [],
  isListLayoutModeJustified: true,
  selectionMode: SelectionMode.multiple,
  constrainMode: ConstrainMode.unconstrained,
  scrollablePane: {
    scrollbarVisibility: ScrollbarVisibility.auto
  }
}

export * from './ColumnContextMenu/renderMenuItem'
export * from './ItemColumn'
export * from './types'
export * from './useAddColumn'

