import {
  ConstrainMode,
  DetailsListLayoutMode,
  LayerHost,
  MarqueeSelection,
  ScrollablePane,
  ScrollbarVisibility,
  SelectionMode,
  ShimmeredDetailsList,
  Target
} from '@fluentui/react'
import React, { FC } from 'react'
import { onRenderItemColumn } from './ItemColumn'
import { onRenderDetailsHeader } from './ListHeader'
import { IListProps } from './types'
import { useAddColumn } from './useAddColumn'

/**
 * List component using `ShimmeredDetailsList` from `@fluentui/react`.
 *
 * Supports different render types for the columns:
 * - `text`: Renders the text value of the column
 * - `user`: Renders an user using the `Persona` component from `@fluentui/react`
 * - `date`: Renders a formatted date
 * - `number`: Renders a formatted number
 * - `currency`: Renders a formatted currency
 * - `tags`: Renders tags for multiple values
 * - `boolean`: Renders a boolean value
 * - `url`: Renders a link
 *
 * @param props List properties
 */
export const List: FC<IListProps> = (props) => {
  const { addColumn } = useAddColumn(props.isAddColumnEnabled)
  return (
    <ScrollablePane {...props.scrollablePane}>
      <MarqueeSelection selection={props.selection}>
        <ShimmeredDetailsList
          {...props}
          columns={[...props.columns, addColumn]}
          onRenderItemColumn={onRenderItemColumn(props)}
          onRenderDetailsHeader={onRenderDetailsHeader(props)}
          layoutMode={
            props.isListLayoutModeJustified
              ? DetailsListLayoutMode.justified
              : DetailsListLayoutMode.fixedColumns
          }
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
