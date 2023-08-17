import { IDetailsRowProps } from '@fluentui/react'
import strings from 'ProjectExtensionsStrings'
import React, { useContext } from 'react'
import { MandatoryCheck } from '../MandatoryCheck'
import { TemplateSelectDialogContext } from '../context'
import { ProjectExtension } from 'pp365-shared-library'

/**
 * Row renderer hook for `ExtensionsSection`. Returns an instance of
 * `onRenderRow` that is used by `DetailsList` to render rows.
 */
export function useRowRenderer({ selectedKeys, searchTerm }) {
  const context = useContext(TemplateSelectDialogContext)
  return (
    detailsRowProps: IDetailsRowProps,
    defaultRender: (props?: IDetailsRowProps) => JSX.Element
  ) => {
    const ext = detailsRowProps.item as ProjectExtension
    const isMandatory = ext.isMandatoryForTemplate(context.state.selectedTemplate)
    detailsRowProps.disabled = isMandatory
    if (isMandatory) {
      detailsRowProps.onRenderCheck = (props) => (
        <MandatoryCheck {...props} tooltip={{ text: strings.ExtensionLockedTooltipText }} />
      )
      detailsRowProps.styles = {
        root: { background: 'rgb(237, 235, 233)', color: 'rgb(50, 49, 48)' }
      }
    }
    const shouldRenderRow =
      ext.text.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1 ||
      selectedKeys.includes(ext.key)
    return shouldRenderRow ? defaultRender(detailsRowProps) : null
  }
}
