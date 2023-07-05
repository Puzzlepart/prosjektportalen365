import {
  ConstrainMode,
  DetailsListLayoutMode,
  SelectionMode,
  ShimmeredDetailsList
} from '@fluentui/react'
import React, { FC } from 'react'
import { IListProps } from './types'
import { useAddColumn } from './useAddColumn'
import { onRenderItemColumn } from './ItemColumn'

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
    <ShimmeredDetailsList
      {...props}
      columns={[...props.columns, addColumn].filter(Boolean)}
      onRenderItemColumn={onRenderItemColumn(props)}
      isPlaceholderData={props.enableShimmer}
    />
  )
}

List.defaultProps = {
  compact: false,
  isAddColumnEnabled: false,
  selectionMode: SelectionMode.none,
  constrainMode: ConstrainMode.unconstrained,
  layoutMode: DetailsListLayoutMode.fixedColumns,
  renderTitleProjectInformationPanel: false
}

export * from './types'
export * from './ItemColumn'
export * from './useAddColumn'
