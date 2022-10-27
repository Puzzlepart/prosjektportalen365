import { IDetailsRowProps, Selection } from '@fluentui/react'
import { ProjectExtension } from 'models'
import { useContext, useEffect, useState } from 'react'
import { TemplateSelectDialogContext } from '../context'
import { onRenderCheckLocked } from './onRenderCheckLocked'
import { useColumns } from './useColumns'

/**
 * Component logic hook for `ExtensionsSection`
 */
export function useExtensionsSection() {
  const context = useContext(TemplateSelectDialogContext)
  const selectedKeys = context.state.selectedExtensions.map((lc) => lc.key)
  const __selection = new Selection<ProjectExtension>({
    onSelectionChanged: () => {
      context.setState({ selectedExtensions: selection.getSelection() })
    }
  })
  const [selection, setSelection] = useState<Selection<ProjectExtension>>(__selection)
  const [searchTerm, setSearchTerm] = useState<string>('')

  useEffect(() => {
    __selection.setChangeEvents(false)
    selectedKeys.forEach((key) => __selection.setKeySelected(key, true, true))
    __selection.setChangeEvents(true)
    setSelection(__selection)
  }, [searchTerm])

  const items = context.props.data.extensions.filter((ext) => !ext.hidden)

  function onRenderRow(
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) {
    const ext = detailsRowProps.item as ProjectExtension
    detailsRowProps.disabled = ext.isLocked(context.state.selectedTemplate)
    if (detailsRowProps.disabled) detailsRowProps.onRenderCheck = onRenderCheckLocked
    if (
      ext.text.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1 &&
      !selectedKeys.includes(ext.key)
    )
      return null
    return defaultRender(detailsRowProps)
  }

  const columns = useColumns()

  return { selection, items, columns, onSearch: setSearchTerm, onRenderRow } as const
}
