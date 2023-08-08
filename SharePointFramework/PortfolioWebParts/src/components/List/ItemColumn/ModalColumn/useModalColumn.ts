import { IColumn } from '@fluentui/react'
import { getObjectValue as get, tryParseJson } from 'pp365-shared-library'
import { useState } from 'react'
import { IModalColumnProps } from './types'
import { useInfoText } from './useInfoText'
import _ from 'lodash'
import { stringIsNullOrEmpty } from '@pnp/core'

/**
 * Hook that returns the necessary props for rendering a modal with a list of items.
 *
 * @param props - The props for the modal column.
 *
 * @returns An object containing the necessary props for rendering a modal column.
 */
export function useModalColumn(props: IModalColumnProps) {
  const [isOpen, setIsOpen] = useState(false)
  const infoText = useInfoText(props)

  const onRenderItemColumn = (item: any, index: number, column: IColumn) => {
    const fieldNameDisplay: string = get(column, 'data.fieldNameDisplay', null)
    return column.onRender
      ? column.onRender(item, index, column)
      : get(item, fieldNameDisplay ?? column.fieldName, null)
  }

  const items = tryParseJson(props.columnValue, [])

  const shouldRenderList = !_.isEmpty(items) || stringIsNullOrEmpty(props.emptyListText)

  return { isOpen, setIsOpen, infoText, items, shouldRenderList, onRenderItemColumn } as const
}
