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
import { onRenderItemColumn } from './ItemColumn'
import { IListProps } from './types'
import { useAddColumn } from './useAddColumn'
import { onRenderDetailsHeader } from './ListHeader'

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
        />
      </MarqueeSelection>
      {props.layerHostId && <LayerHost id={props.layerHostId} />}
    </ScrollablePane>
  )
}

List.defaultProps = {
  compact: false,
  isAddColumnEnabled: false,
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
