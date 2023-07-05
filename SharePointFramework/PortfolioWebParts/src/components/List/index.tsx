import { ConstrainMode, SelectionMode, ShimmeredDetailsList } from '@fluentui/react'
import React, { FC } from 'react'
import { onRenderItemColumn } from './ItemColumn'
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
  renderTitleProjectInformationPanel: false
}

export * from './ItemColumn'
export * from './types'
export * from './useAddColumn'
