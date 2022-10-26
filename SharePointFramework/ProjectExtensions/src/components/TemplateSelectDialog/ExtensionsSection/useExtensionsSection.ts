import { IDetailsRowProps, Selection } from '@fluentui/react'
import { ProjectExtension } from 'models'
import { useContext, useEffect, useState } from 'react'
import { TemplateSelectDialogContext } from '../context'

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
    const { item } = detailsRowProps
    const { selectedTemplate } = context.state
    const isLocked =
      selectedTemplate?.isDefaultExtensionsLocked &&
      selectedTemplate?.extensionIds.includes(item.id)
    if (isLocked) detailsRowProps.disabled = true
    if (item.text.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return null
    return defaultRender(detailsRowProps)
  }

  return { selection, items, onSearch: setSearchTerm, onRenderRow } as const
}
