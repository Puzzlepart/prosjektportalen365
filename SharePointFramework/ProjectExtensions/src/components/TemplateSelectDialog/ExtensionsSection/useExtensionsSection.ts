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

  const items = context.props.data.extensions

  function onRenderRow(
    props: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) {
    if (props.item.text.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) return null
    return defaultRender(props)
  }

  return { selection, items, onSearch: setSearchTerm, onRenderRow } as const
}
