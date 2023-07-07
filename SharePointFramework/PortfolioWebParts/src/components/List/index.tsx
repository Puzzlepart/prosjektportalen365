import {
  ConstrainMode,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  ShimmeredDetailsList,
  Target
} from '@fluentui/react'
import React, { FC } from 'react'
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
    <ScrollablePane {...props.scrollablePane}>
      <MarqueeSelection selection={props.selection}>
        <ShimmeredDetailsList
          {...listProps}
          onColumnHeaderClick={(event, column) =>
            props.onColumnContextMenu({ column, target: event.target as Target })
          }
          onColumnHeaderContextMenu={(column, event) =>
            props.onColumnContextMenu({ column, target: event.target as Target })
          }
        />
      </MarqueeSelection>
      {props.layerHostId && <LayerHost id={props.layerHostId} />}
    </ScrollablePane>
  )
}

List.defaultProps = {
  items: [],
  columns: [],
  selectionMode: SelectionMode.multiple,
  constrainMode: ConstrainMode.unconstrained,
  scrollablePane: {
    scrollbarVisibility: ScrollbarVisibility.auto,
    styles: {
      root: {
        top: 75
      }
    }
  }
}

export * from './ItemColumn'
export * from './types'
export * from './useAddColumn'

