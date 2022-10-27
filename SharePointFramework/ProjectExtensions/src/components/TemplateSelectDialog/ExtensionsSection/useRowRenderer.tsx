import { IDetailsRowProps } from '@fluentui/react'
import { ProjectExtension } from 'models'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { CheckLocked } from '../CheckLocked'
import { TemplateSelectDialogContext } from '../context'

export function useRowRenderer({ selectedKeys, searchTerm }) {
  const context = useContext(TemplateSelectDialogContext)
  return (
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) => {
    const ext = detailsRowProps.item as ProjectExtension
    const isLocked = ext.isLocked(context.state.selectedTemplate)
    detailsRowProps.disabled = isLocked
    if (isLocked) {
      detailsRowProps.onRenderCheck = (props) => (
        <CheckLocked {...props} tooltip={{ text: strings.ExtensionLockedTooltipText }} />
      )
      if (ext.isDefault) {
        detailsRowProps.styles = {
          root: { background: 'rgb(237, 235, 233)', color: 'rgb(50, 49, 48)' }
        }
      }
    }
    const shouldRenderRow =
      ext.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      selectedKeys.includes(ext.key) ||
      (isLocked && ext.isDefault)
    if (shouldRenderRow) return defaultRender(detailsRowProps)
    else return null
  }
}
