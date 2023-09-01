import {
  ConstrainMode,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
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
    <ListContext.Provider value={{ props: listProps }}>
      <ScrollablePane {...props.scrollablePane}>
        <MarqueeSelection selection={props.selection}>
          <ShimmeredDetailsList {...listProps} />
        </MarqueeSelection>
        {props.layerHostId && <LayerHost id={props.layerHostId} />}
      </ScrollablePane>
    </ListContext.Provider>
  )
}

List.defaultProps = {
  items: [],
  columns: [],
  menuItems: [],
  selectionMode: SelectionMode.multiple,
  constrainMode: ConstrainMode.unconstrained,
  scrollablePane: {
    scrollbarVisibility: ScrollbarVisibility.auto
  }
}

export * from './ItemColumn'
export * from '../Toolbar'
export * from './types'
export * from './useAddColumn'
