import { tryParseJson } from '../../../util'
import { IDialogColumnProps } from './types'
import { useInfoText } from './useInfoText'
import _ from 'lodash'
import { useColumns } from './useColumns'

/**
 * Parses measurement history and supplies its dialog headings, information text and columns.
 */
export function useDialogColumn(props: IDialogColumnProps) {
  const infoText = useInfoText(props)
  const title = props.item[props.headerTitleField]
  const subTitle = props.item[props.headerSubTitleField]
  const items = tryParseJson(props.columnValue, [])
  const shouldRenderList = !_.isEmpty(items)
  const columns = useColumns()

  return {
    infoText,
    title,
    subTitle,
    items,
    columns,
    shouldRenderList
  } as const
}
