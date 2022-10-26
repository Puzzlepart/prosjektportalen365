import { IDetailsRowProps, Selection } from '@fluentui/react'
import { ListContentConfig } from 'models'
import { useContext, useEffect, useState } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { useColumns } from './useColumns'

/**
 * Component logic hook for `ListContentSection`
 */
export function useListContentSection() {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = context.state.selectedListContentConfig.map((lc) => lc.key)
  const __selection = new Selection<ListContentConfig>({
    onSelectionChanged: () => {
      context.setState({ selectedListContentConfig: [...selection.getSelection()] })
    }
  })
  const [selection, setSelection] = useState<Selection<ListContentConfig>>(__selection)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    __selection.setChangeEvents(false)
    selectedKeys.forEach((key) => __selection.setKeySelected(key, true, true))
    __selection.setChangeEvents(true)
    setSelection(__selection)
  }, [searchTerm])

  const items = context.props.data.listContentConfig.filter((lcc) => !lcc.hidden)

  function onRenderRow(
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) {
    const lcc = detailsRowProps.item as ListContentConfig
    if (lcc.text.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return null
    return defaultRender({
      ...detailsRowProps,
      disabled: lcc.isLocked(context.state.selectedTemplate)
    })
  }

  const columns = useColumns()

  return { selection, items, columns, onSearch: setSearchTerm, onRenderRow } as const
}
